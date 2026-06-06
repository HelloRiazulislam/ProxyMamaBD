import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/firebase_service.dart';

class AddBalanceScreen extends StatelessWidget {
  const AddBalanceScreen({super.key});

  void _copyToClipboard(BuildContext context, String text, String label) {
    // Utility clipboard helper
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied: $text'),
        backgroundColor: Colors.blueAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Money', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Warning header card
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              padding: const EdgeInsets.all(20),
              child: const Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: Colors.blueAccent, size: 28),
                  SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Payment Details',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Follow instructions below to dynamically add funds to your wallet instantly.',
                          style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.3),
                        )
                      ],
                    ),
                  )
                ],
              ),
            ),
            const SizedBox(height: 32),

            const Text(
              'SELECT PAYMENT METHODS',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.5),
            ),
            const SizedBox(height: 16),

            // bKash Item Channel
            _buildMfsPaymentChannel(
              context,
              name: 'bKash (Send Money)',
              number: '+88017XXXXXXXX',
              color: const Color(0xFFE2125F),
              instruction: 'Please Send Money to this personal number and contact admin on Telegram / WhatsApp with payment proof.',
            ),
            const SizedBox(height: 16),

            // Nagad Item Channel
            _buildMfsPaymentChannel(
              context,
              name: 'Nagad (Send Money)',
              number: '+88019XXXXXXXX',
              color: const Color(0xFFF26222),
              instruction: 'Please Send Money dynamically to this Personal Nagad account. Initiate WhatsApp instant support for wallet clearance.',
            ),
            const SizedBox(height: 16),

            // Rocket Item Channel
            _buildMfsPaymentChannel(
              context,
              name: 'Rocket (Send Money)',
              number: '+88018XXXXXXXX',
              color: const Color(0xFF8C3494),
              instruction: 'Personal Rocket receiver. Transfer the requested amount with your mobile number reference and verify instantly.',
            ),
            const SizedBox(height: 32),

            // Custom Help Actions
            Card(
              color: const Color(0xFF1E293B),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Need Instant Assistant?',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'If you have sent money to any of the accounts, please contact support with screenshot and account email for dynamic top-ups.',
                      style: TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: () async {
                        final telegramUrl = Uri.parse("https://t.me/proxymamabd");
                        if (await canLaunchUrl(telegramUrl)) {
                          await launchUrl(telegramUrl, mode: LaunchMode.externalApplication);
                        }
                      },
                      icon: const Icon(Icons.send_rounded, size: 18),
                      label: const Text('Contact Telegram Support', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0088CC),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildMfsPaymentChannel(
    BuildContext context, {
    required String name,
    required String number,
    required Color color,
    required String instruction,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF334155).withOpacity(0.5)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.copy_rounded, size: 18, color: Colors.grey),
                onPressed: () => _copyToClipboard(context, number, name),
              )
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Number: $number',
            style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
          ),
          const SizedBox(height: 12),
          Text(
            instruction,
            style: const TextStyle(fontSize: 12, color: Colors.grey, height: 1.4),
          ),
        ],
      ),
    );
  }
}
