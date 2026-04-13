import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';
import { RefreshCcw } from 'lucide-react';

export default function Refund() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <section className="pt-32 pb-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-16 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                <RefreshCcw size={24} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Refund Policy</h1>
            </div>
            
            <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
              <p>Last Updated: April 09, 2026</p>
              
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">1. Eligibility for Refunds</h2>
                <p>We offer a 24-hour money-back guarantee if our proxies do not work as advertised or if you experience technical issues that we cannot resolve.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">2. Non-Refundable Cases</h2>
                <p>Refunds will not be issued if your account is suspended for violating our Terms of Service, or if you simply changed your mind after using the service.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">3. Refund Process</h2>
                <p>To request a refund, please contact our support team via the Contact page or email us at support@proxymama.com with your order details and the reason for the request.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">4. Processing Time</h2>
                <p>Once approved, refunds are typically processed within 3-5 business days. The time it takes for the funds to appear in your account depends on your payment method.</p>
              </section>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
