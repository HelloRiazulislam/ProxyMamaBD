import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';
import { Shield } from 'lucide-react';
import { useSettings } from '../../App';
import Markdown from 'react-markdown';

export default function Terms() {
  const { settings } = useSettings();
  const content = settings?.legalPages?.termsAndConditions;

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <section className="pt-32 pb-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-16 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Shield size={24} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            </div>
            
            <div className="prose prose-blue max-w-none text-gray-600">
              {content ? (
                <div className="markdown-body">
                  <Markdown>{content}</Markdown>
                </div>
              ) : (
                <div className="space-y-6">
                  <p>Last Updated: April 09, 2026</p>
                  
                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                    <p>By accessing and using ProxyMamaBD, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                    <p>ProxyMamaBD provides high-speed Bangladesh-based proxy services (SOCKS5 and HTTP). Our services are intended for legal use cases such as web scraping, automation, and secure browsing.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Responsibilities</h2>
                    <p>You are responsible for maintaining the confidentiality of your account credentials. You agree not to use our proxies for any illegal activities, including but not limited to hacking, spamming, or violating any local or international laws.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">4. Payment and Refunds</h2>
                    <p>All payments are processed through our supported payment gateways. Refunds are handled according to our Refund Policy. We reserve the right to change our pricing at any time.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
                    <p>ProxyMamaBD shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services.</p>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
