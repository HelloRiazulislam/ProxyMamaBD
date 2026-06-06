import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';

class FirebaseService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // User Profile Stream
  Stream<DocumentSnapshot> get userProfileStream {
    if (currentUser == null) return const Stream.empty();
    return _db.collection('users').doc(currentUser!.uid).snapshots();
  }

  // Active Proxies List Stream (combines inventory and free claims)
  Stream<List<Map<String, dynamic>>> getMyProxiesStream() {
    if (currentUser == null) return const Stream.empty();
    
    // Listen to purchased proxy inventory
    var inventoryStream = _db
        .collection('proxyInventory')
        .where('assignedToUid', isEqualTo: currentUser!.uid)
        .where('isAssigned', isEqualTo: true)
        .snapshots();

    // Listen to free proxy claims
    var claimsStream = _db
        .collection('freeProxyClaims')
        .where('uid', isEqualTo: currentUser!.uid)
        .snapshots();

    // In a production setup, we can yield lists
    // Here we'll merge them or return the inventory stream combined with logic
    return _db
        .collection('proxyInventory')
        .where('assignedToUid', isEqualTo: currentUser!.uid)
        .where('isAssigned', isEqualTo: true)
        .snapshots()
        .map((inventSnap) {
          return inventSnap.docs.map((doc) {
            final data = doc.data();
            data['id'] = doc.id;
            data['collection'] = 'proxyInventory';
            return data;
          }).toList();
        });
  }

  // Get active free campaign
  Stream<QuerySnapshot> getActiveCampaign() {
    return _db
        .collection('freeProxyCampaigns')
        .where('isActive', isEqualTo: true)
        .limit(1)
        .snapshots();
  }

  // Get user's claimed campaign proxy
  Stream<QuerySnapshot> getUserClaims() {
    if (currentUser == null) return const Stream.empty();
    return _db
        .collection('freeProxyClaims')
        .where('uid', isEqualTo: currentUser!.uid)
        .snapshots();
  }

  // Email/Password Login
  Future<UserCredential> loginWithEmail(String email, String password) async {
    return await _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  // Email/Password Registration (with @gmail.com validation)
  Future<UserCredential> registerWithEmail({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String phoneNumber,
  }) async {
    // 1. Enforce Gmail domain constraint on mobile client (exactly matched)
    if (!email.toLowerCase().trim().endsWith('@gmail.com')) {
      throw Exception('Registration failed! Only @gmail.com email addresses are allowed.');
    }

    final userCred = await _auth.createUserWithEmailAndPassword(
      email: email.toLowerCase().trim(),
      password: password,
    );

    // 2. Initialize Firestore User Profile Document
    await _db.collection('users').doc(userCred.user!.uid).set({
      'uid': userCred.user!.uid,
      'email': email.toLowerCase().trim(),
      'firstName': firstName,
      'lastName': lastName,
      'phoneNumber': phoneNumber,
      'walletBalance': 5.0, // Match start/free signup bonus if applicable
      'isReseller': false,
      'createdAt': FieldValue.serverTimestamp(),
    });

    return userCred;
  }

  // Google Sign-In
  Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCred = await _auth.signInWithCredential(credential);
      
      // Ensure user profile exists in Firestore
      final userDoc = await _db.collection('users').doc(userCred.user!.uid).get();
      if (!userDoc.exists) {
        await _db.collection('users').doc(userCred.user!.uid).set({
          'uid': userCred.user!.uid,
          'email': userCred.user!.email,
          'firstName': googleUser.displayName?.split(' ').first ?? 'Google',
          'lastName': googleUser.displayName?.split(' ').skip(1).join(' ') ?? 'User',
          'walletBalance': 5.0,
          'isReseller': false,
          'createdAt': FieldValue.serverTimestamp(),
        });
      }

      return userCred;
    } catch (e) {
      debugPrint("Error performing Google login: $e");
      rethrow;
    }
  }

  // Claim Free Proxy Campaign
  Future<void> claimFreeProxyCampaign(String campaignId, Map<String, dynamic> campaignData) async {
    if (currentUser == null) throw Exception("Please log in to claim a free proxy.");

    final uid = currentUser!.uid;

    await _db.runTransaction((transaction) async {
      // 1. Verify user hasn't claimed yet for this campaign
      final claimQuery = await _db
          .collection('freeProxyClaims')
          .where('uid', isEqualTo: uid)
          .where('campaignId', isEqualTo: campaignId)
          .get();

      if (claimQuery.docs.isNotEmpty) {
        throw Exception("You have already claimed your free proxy for this campaign!");
      }

      // 2. Fetch user profile
      final userDocRef = _db.collection('users').doc(uid);
      final userSnap = await transaction.get(userDocRef);
      if (!userSnap.exists) throw Exception("User profile not found.");
      final userData = userSnap.data()!;

      // 3. Create active claim
      final claimDocRef = _db.collection('freeProxyClaims').doc();
      transaction.set(claimDocRef, {
        'uid': uid,
        'campaignId': campaignId,
        'host': campaignData['host'],
        'port': campaignData['port'],
        'username': campaignData['username'],
        'password': campaignData['password'],
        'type': campaignData['proxyType'] ?? 'SOCKS5', // Shows protocol (SOCKS5/HTTP)
        'speed': campaignData['speed'] ?? 'Uncapped',
        'email': userData['email'],
        'displayName': '${userData['firstName']} ${userData['lastName']}',
        'planTitle': 'Free Trial',
        'claimedAt': FieldValue.serverTimestamp(),
        'expiryDate': campaignData['endTime'] is Timestamp 
            ? (campaignData['endTime'] as Timestamp).toDate().toIso8601String()
            : campaignData['endTime'],
      });

      // 4. Create Notification
      final notifDocRef = _db.collection('notifications').doc();
      transaction.set(notifDocRef, {
        'uid': uid,
        'title': 'Free Proxy Claimed! 🎁',
        'message': 'You have successfully claimed your free proxy trial on mobile.',
        'isRead': false,
        'createdAt': FieldValue.serverTimestamp(),
      });
    });
  }

  // Sign out
  Future<void> logout() async {
    await _auth.signOut();
    await _googleSignIn.signOut();
  }
}
