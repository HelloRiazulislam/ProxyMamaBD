import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';
import { Lock } from 'lucide-react';
import { useSettings } from '../../App';
import Markdown from 'react-markdown';

export default function Privacy() {
  const { settings } = useSettings();
  const content = settings?.legalPages?.privacyPolicy;

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <section className="pt-32 pb-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-16 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <Lock size={24} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
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
                    <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact support. This may include your name, email address, and payment information.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you about your account and our services.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">3. Data Security</h2>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. However, no security system is impenetrable.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">4. No Log Policy</h2>
                    <p>We do not log your browsing history, traffic destination, data content, or DNS queries while you are connected to our proxy services.</p>
                  </section>

                  <section>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">5. Third-Party Services</h2>
                    <p>We may use third-party services for payment processing and analytics. These services have their own privacy policies and we encourage you to review them.</p>
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
