import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../services/firebase_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class MyProxiesScreen extends StatefulWidget {
  const MyProxiesScreen({super.key});

  @override
  State<MyProxiesScreen> createState() => _MyProxiesScreenState();
}

class _MyProxiesScreenState extends State<MyProxiesScreen> {
  bool _showCreds = false;

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: Colors.blueAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showQrModal(Map<String, dynamic> proxy) {
    // Generates URI like "socks5://username:password@host:port"
    final protocol = (proxy['type'] ?? 'socks5').toString().toLowerCase();
    final configUri = "$protocol://${proxy['username']}:${proxy['password']}@${proxy['host']}:${proxy['port']}";

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text('Proxy QR Code', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Scan with v2rayNG, Proxifier, Shadowrocket or compatible apps.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 20),
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(12),
                child: QrImageView(
                  data: configUri,
                  version: QrVersions.auto,
                  size: 200.0,
                ),
              ),
              const SizedBox(height: 20),
              SelectableText(
                configUri,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.grey),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: () {
                  _copyToClipboard(configUri, 'Configuration link');
                  Navigator.pop(context);
                },
                icon: const Icon(Icons.copy_rounded, size: 16),
                label: const Text('Copy Config URL', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              )
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<FirebaseService>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Proxies', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(_showCreds ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
            tooltip: 'Toggle Credentials Display',
            onPressed: () => setState(() => _showCreds = !_showCreds),
          )
        ],
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: authService.getMyProxiesStream(), // Streams proxy documents
        builder: (context, inventorySnapshot) {
          return StreamBuilder<QuerySnapshot>(
            stream: authService.getUserClaims(), // Multi-stream user claim docs
            builder: (context, claimsSnapshot) {
              if (inventorySnapshot.connectionState == ConnectionState.waiting ||
                  claimsSnapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)));
              }

              // Merge both Purchased Proxy and Claimed Campaign Proxies
              final List<Map<String, dynamic>> mergedProxies = [];

              if (inventorySnapshot.hasData) {
                mergedProxies.addAll(inventorySnapshot.data!);
              }

              if (claimsSnapshot.hasData) {
                for (var doc in claimsSnapshot.data!.docs) {
                  final data = doc.data() as Map<String, dynamic>;
                  data['id'] = doc.id;
                  data['collection'] = 'freeProxyClaims';
                  mergedProxies.add(data);
                }
              }

              if (mergedProxies.isEmpty) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shield_outlined, size: 80, color: Colors.grey[700]),
                        const SizedBox(height: 16),
                        const Text(
                          'No Active Proxies Found',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          "You haven't claimed any free proxies or purchased a plan yet.",
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey[500], fontSize: 13),
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: () => Navigator.pushNamed(context, '/free-proxy'),
                          icon: const Icon(Icons.card_giftcard),
                          label: const Text('Go to Free Campaign'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF8B5CF6),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        )
                      ],
                    ),
                  ),
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: mergedProxies.length,
                itemBuilder: (context, index) {
                  final proxy = mergedProxies[index];
                  final isFree = proxy['collection'] == 'freeProxyClaims';
                  // Show protocol (SOCKS5 / HTTP) as requested by rule 10 next to title
                  final typeLabel = (proxy['type'] ?? 'SOCKS5').toString().toUpperCase();

                  return Card(
                    margin: const EdgeInsets.bottomKey(16),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Row(
                                  children: [
                                    Text(
                                      proxy['planTitle'] ?? 'Bangladesh Proxy',
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(width: 8),
                                    
                                    // SOCKS5 / HTTP Protocol Tag - Fully Responsive styling
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF8B5CF6).withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.3)),
                                      ),
                                      child: Text(
                                        typeLabel, // socks5 naki http dekhabe
                                        style: const TextStyle(
                                          color: Color(0xFFA78BFA),
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (isFree)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'Free Gift',
                                    style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                                ),
                            ],
                          ),
                          const Divider(height: 32, color: Color(0xFF334155)),
                          
                          // Connection Information
                          _buildConfigRow(
                            label: 'Host IP Address',
                            val: proxy['host'] ?? '',
                            onCopy: () => _copyToClipboard(proxy['host'], 'IP'),
                          ),
                          const SizedBox(height: 12),
                          _buildConfigRow(
                            label: 'Port Number',
                            val: (proxy['port'] ?? '').toString(),
                            onCopy: () => _copyToClipboard(proxy['port'].toString(), 'Port'),
                          ),
                          const SizedBox(height: 12),
                          _buildConfigRow(
                            label: 'Username',
                            val: proxy['username'] ?? '',
                            obscure: !_showCreds,
                            onCopy: () => _copyToClipboard(proxy['username'], 'Username'),
                          ),
                          const SizedBox(height: 12),
                          _buildConfigRow(
                            label: 'Password',
                            val: proxy['password'] ?? '',
                            obscure: !_showCreds,
                            onCopy: () => _copyToClipboard(proxy['password'], 'Password'),
                          ),
                          
                          const Divider(height: 32, color: Color(0xFF334155)),
                          
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              ElevatedButton.icon(
                                onPressed: () => _showQrModal(proxy),
                                icon: const Icon(Icons.qr_code_rounded, size: 16),
                                label: const Text('Config QR Code', style: TextStyle(fontWeight: FontWeight.bold)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF1E293B),
                                  side: const BorderSide(color: Color(0xFF334155)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                              Row(
                                children: [
                                  const Icon(Icons.speed, size: 16, color: Colors.grey),
                                  const SizedBox(width: 4),
                                  Text(
                                    proxy['speed'] ?? 'Uncapped',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.blueAccent),
                                  )
                                ],
                              )
                            ],
                          )
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildConfigRow({
    required String label,
    required String val,
    bool obscure = false,
    required VoidCallback onCopy,
  }) {
    final displayValue = obscure ? '••••••••' : val;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(
              displayValue,
              style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ],
        ),
        IconButton(
          icon: const Icon(Icons.copy_rounded, size: 16, color: Colors.grey),
          onPressed: onCopy,
        )
      ],
    );
  }
}

extension on ListView {
  Widget margin(EdgeInsets edgeInsets) => this;
}

extension on Card {
  Widget margin(EdgeInsets edgeInsets) => this;
  // Fallback signature key support
  Widget marginBottomKey(double val) {
    return Padding(padding: EdgeInsets.only(bottom: val), child: this);
  }
}
