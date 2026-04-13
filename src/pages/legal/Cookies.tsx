import PublicNavbar from '../../components/PublicNavbar';
import Footer from '../../components/Footer';
import { Cookie } from 'lucide-react';

export default function Cookies() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <section className="pt-32 pb-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-16 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center">
                <Cookie size={24} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
            </div>
            
            <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
              <p>Last Updated: April 09, 2026</p>
              
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">1. What are Cookies?</h2>
                <p>Cookies are small text files that are stored on your device when you visit a website. They help the website remember your preferences and provide a better user experience.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Cookies</h2>
                <p>We use cookies to keep you logged in, remember your preferences, and analyze how you use our website so we can improve it.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">3. Types of Cookies We Use</h2>
                <p><strong>Essential Cookies:</strong> These are necessary for the website to function properly.</p>
                <p><strong>Analytical Cookies:</strong> These help us understand how visitors interact with our website.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">4. Managing Cookies</h2>
                <p>You can control and manage cookies through your browser settings. However, disabling certain cookies may affect the functionality of our website.</p>
              </section>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
