import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import '../services/firebase_service.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<FirebaseService>(context, listen: false);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('ProxyMama Dashboard', style: theme.textTheme.titleLarge),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.redAccent),
            tooltip: 'Logout',
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to sign out of ProxyMama?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                    TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Logout', style: TextStyle(color: Colors.red))),
                  ],
                ),
              );
              if (confirm == true) {
                await authService.logout();
                if (context.mounted) {
                  Navigator.pushReplacementNamed(context, '/login');
                }
              }
            },
          ),
        ],
      ),
      body: StreamBuilder<DocumentSnapshot>(
        stream: authService.userProfileStream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)));
          }

          if (snapshot.hasError || !snapshot.hasData || !snapshot.data!.exists) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline_rounded, size: 60, color: Colors.redAccent),
                  const SizedBox(height: 16),
                  const Text('Error loading profile. Check internet connections.', style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => authService.logout(),
                    child: const Text('Retry Login'),
                  )
                ],
              ),
            );
          }

          final userData = snapshot.data!.data() as Map<String, dynamic>;
          final balance = userData['walletBalance'] ?? 0.0;
          final firstName = userData['firstName'] ?? 'User';

          return RefreshIndicator(
            onRefresh: () async => ForceRefreshTrigger(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Greeting & Status Indicator
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Assalamu Alaikum, $firstName 👋',
                            style: const TextStyle(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            "Secure & Speed Bangladesh Proxies",
                            style: TextStyle(fontSize: 13, color: Colors.blueAccent, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, py: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircleAvatar(radius: 4, backgroundColor: Color(0xFF10B981)),
                            SizedBox(width: 6),
                            Text('Live', style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.w900)),
                          ],
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Wallet Balance Card (Beautiful Gradient Slate Design)
                  Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E3A8A), Color(0xFF1D4ED8)], // Rich Navy to Royal Blue
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(28),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF1D4ED8).withOpacity(0.25),
                          blurRadius: 25,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(28.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'WALLET BALANCE',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.5,
                              ),
                            ),
                            Icon(Icons.wallet_rounded, color: Colors.white.withOpacity(0.8), size: 28),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '৳${balance.toStringAsFixed(2)}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontFamily: 'Space Grotesk',
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () => Navigator.pushNamed(context, '/add-balance'),
                                icon: const Icon(Icons.add_circle_outline_rounded, size: 18, color: Color(0xFF1D4ED8)),
                                label: const Text('Add Money', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8))),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: const Color(0xFF1D4ED8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                ),
                              ),
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Quick Navigation Options (Grid Style)
                  const Text(
                    'QUICK ACCESS',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5),
                  ),
                  const SizedBox(height: 16),

                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.2,
                    children: [
                      _buildBentoItem(
                        context,
                        title: 'Claim Free Proxy',
                        subtitle: 'Live Campaign 🎁',
                        icon: Icons.card_giftcard_rounded,
                        gradientColor: [const Color(0xFFEC4899), const Color(0xFFDB2777)],
                        route: '/free-proxy',
                      ),
                      _buildBentoItem(
                        context,
                        title: 'My Proxies',
                        subtitle: 'Configurations & Protocol ⚡',
                        icon: Icons.vpn_lock_rounded,
                        gradientColor: [const Color(0xFF8B5CF6), const Color(0xFF7C3AED)],
                        route: '/my-proxies',
                      ),
                      _buildBentoItem(
                        context,
                        title: 'Add Balance',
                        subtitle: 'BKash / Nagad / Rocket',
                        icon: Icons.account_balance_wallet_rounded,
                        gradientColor: [const Color(0xFF3B82F6), const Color(0xFF2563EB)],
                        route: '/add-balance',
                      ),
                      _buildBentoItem(
                        context,
                        title: 'Buy Proxies',
                        subtitle: 'Requires Web portal 🌐',
                        icon: Icons.shopping_basket_rounded,
                        gradientColor: [const Color(0xFF06B6D4), const Color(0xFF0891B2)],
                        route: '',
                        onTap: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Purchase plans securely directly using ProxyMama Web!'),
                              backgroundColor: Colors.blueAccent,
                            ),
                          );
                        }
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void ForceRefreshTrigger() {}

  Widget _buildBentoItem(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Color> gradientColor,
    required String route,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap ?? () {
        if (route.isNotEmpty) Navigator.pushNamed(context, route);
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFF334155).withOpacity(0.5)),
        ),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: gradientColor),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: Colors.grey),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
