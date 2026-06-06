import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import '../services/firebase_service.dart';

class FreeProxyScreen extends StatefulWidget {
  const FreeProxyScreen({super.key});

  @override
  State<FreeProxyScreen> createState() => _FreeProxyScreenState();
}

class _FreeProxyScreenState extends State<FreeProxyScreen> {
  bool _claiming = false;
  Timer? _countdownTimer;
  String _timeLeftText = "";

  void _startCountdown(Timestamp endTime) {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      final now = DateTime.now();
      final end = endTime.toDate();
      final difference = end.difference(now);

      if (difference.isNegative) {
        timer.cancel();
        if (mounted) setState(() => _timeLeftText = "Campaign Expired");
        return;
      }

      final hours = difference.inHours;
      final minutes = difference.inMinutes % 60;
      final seconds = difference.inSeconds % 60;

      if (mounted) {
        setState(() {
          _timeLeftText = "${hours}h ${minutes}m ${seconds}s left";
        });
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleClaim(String campaignId, Map<String, dynamic> campaignData) async {
    setState(() => _claiming = true);
    try {
      final authService = Provider.of<FirebaseService>(context, listen: false);
      await authService.claimFreeProxyCampaign(campaignId, campaignData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Free proxy claimed successfully! 🎉'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        // Automatic redirection to my proxies screen upon successful claim (Satisfies Rule 8)
        Navigator.pushReplacementNamed(context, '/my-proxies');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll("Exception:", "").trim()),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _claiming = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<FirebaseService>(context, listen: false);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Free Campaign', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: authService.getActiveCampaign(),
        builder: (context, campaignSnapshot) {
          if (campaignSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)));
          }

          if (campaignSnapshot.hasError || !campaignSnapshot.hasData || campaignSnapshot.data!.docs.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.hourglass_empty_rounded, size: 70, color: Colors.grey[700]),
                    const SizedBox(height: 16),
                    const Text(
                      'No Active Free Campaign',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Please keep an eye on our portal or Telegram announcement channel for upcoming free proxy campaigns.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ],
                ),
              ),
            );
          }

          final campaignDoc = campaignSnapshot.data!.docs.first;
          final campaignId = campaignDoc.id;
          final campaign = campaignDoc.data() as Map<String, dynamic>;

          // Start countdown
          if (campaign['endTime'] != null && _timeLeftText.isEmpty) {
            _startCountdown(campaign['endTime'] as Timestamp);
          }

          return StreamBuilder<QuerySnapshot>(
            stream: authService.getUserClaims(),
            builder: (context, claimsSnapshot) {
              final hasClaimedThisRecord = claimsSnapshot.hasData &&
                  claimsSnapshot.data!.docs.any((claim) => (claim.data() as Map<String, dynamic>)['campaignId'] == campaignId);

              // Extract Protocol format details SOCKS5/HTTP
              final protocolText = (campaign['proxyType'] ?? 'SOCKS5').toString().toUpperCase();

              return SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Premium design container
                    Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFEC4899).withOpacity(0.2),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(28.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.flash_on_rounded, color: Colors.white, size: 14),
                                SizedBox(width: 4),
                                Text('ACTIVE FREE TRIAL', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 20),
                          Text(
                            campaign['title'] ?? 'Exclusive High-Speed Free Trial Campaign',
                            style: theme.textTheme.headlineMedium?.copyWith(color: Colors.white, fontSize: 24),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            campaign['description'] ?? 'Speed testing and protocol availability for new partners and premium members.',
                            style: const TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
                          ),
                          const SizedBox(height: 24),
                          
                          // Horizontal stats
                          Row(
                            children: [
                              _buildCampaignMetaChip(icon: Icons.speed, val: campaign['speed'] ?? 'Uncapped'),
                              const SizedBox(width: 12),
                              _buildCampaignMetaChip(icon: Icons.shield, val: protocolText), // Socks5/HTTP (Rule 10)
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Countdown card & claim actions
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Campaign status', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                                Text(
                                  _timeLeftText.isNotEmpty ? _timeLeftText : 'Initialise...',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFEC4899)),
                                )
                              ],
                            ),
                            const Divider(height: 32, color: Color(0xFF334155)),

                            if (hasClaimedThisRecord) ...[
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.blueAccent.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.blueAccent.withOpacity(0.3)),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.check_circle_rounded, color: Colors.blueAccent),
                                    SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        'You have already claimed your free proxy from this campaign. Go to My Proxies to copy config or scan QR code.',
                                        style: TextStyle(fontSize: 12, height: 1.4, color: Colors.blueAccent),
                                      ),
                                    )
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),
                              ElevatedButton(
                                onPressed: () => Navigator.pushReplacementNamed(context, '/my-proxies'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF1E293B),
                                  side: const BorderSide(color: Color(0xFF334155)),
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: const Text('View Claimed Proxy', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                              ),
                            ] else ...[
                              ElevatedButton(
                                onPressed: _claiming ? null : () => _handleClaim(campaignId, campaign),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF2563EB),
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: _claiming
                                    ? const SizedBox(
                                        height: 22,
                                        width: 22,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                      )
                                    : const Text(
                                        'Claim Free Proxy Now',
                                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                                      ),
                              ),
                            ]
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildCampaignMetaChip({required IconData icon, required String val}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 6),
          Text(
            val,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
          ),
        ],
      ),
    );
  }
}
