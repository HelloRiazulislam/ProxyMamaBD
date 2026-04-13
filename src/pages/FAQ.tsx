import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How to setup Proxy on Android? (Super Proxy)",
      a: "1. Download and install Super Proxy from our Downloads page. 2. Open the app and click the '+' icon to add a new proxy. 3. Enter a Profile Name (e.g., ProxyMama). 4. Select Protocol (SOCKS5 or HTTP). 5. Copy the Host/IP and Port from your dashboard and paste them. 6. Enable 'Authentication' and enter your Username and Password. 7. Save the profile and click the 'Start' button. You are now connected!"
    },
    {
      q: "How to setup Proxy on Windows? (Proxifier)",
      a: "1. Install Proxifier from the Downloads page. 2. Go to 'Profile' -> 'Proxy Servers'. 3. Click 'Add' and enter the Address (Host) and Port. 4. Select the Protocol (SOCKS5 or HTTPS). 5. Check 'Use Authentication' and enter your Username and Password. 6. Click 'OK' and then 'Yes' to make it the default proxy. 7. Your entire PC is now using the proxy!"
    },
    {
      q: "What is ProxyMama?",
      a: "ProxyMama is a premium proxy provider specializing in high-speed SOCKS5 and HTTP proxies located in Bangladesh. We offer reliable, secure, and affordable proxy solutions for various use cases."
    },
    {
      q: "How do I buy a proxy?",
      a: "First, create an account and log in. Then, add balance to your wallet using our supported payment methods (bKash, Nagad, etc.). Once your balance is added, go to the 'Buy Proxy' page, select a plan, and your proxy will be instantly delivered to your dashboard."
    },
    {
      q: "What protocols do you support?",
      a: "We support both SOCKS5 and HTTP/HTTPS protocols. You can choose the protocol that best fits your application or software."
    },
    {
      q: "Are these residential or datacenter proxies?",
      a: "We offer both! Our inventory includes real residential IPs and high-speed datacenter IPs from Bangladesh. Each plan specifies the type of proxy you are purchasing."
    },
    {
      q: "What is your refund policy?",
      a: "We offer a 24-hour money-back guarantee if our proxies do not work as advertised. Please contact our support team with your order details for a refund request."
    },
    {
      q: "Can I use these proxies for scraping?",
      a: "Yes, our proxies are perfect for web scraping, automation, and data collection. We provide high-speed connections with unlimited bandwidth."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      
      <section className="pt-32 pb-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex p-3 bg-blue-100 text-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-100">
              <HelpCircle size={32} />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h1>
            <p className="text-gray-600">
              Everything you need to know about ProxyMama and our services.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-900">{faq.q}</span>
                  {openIndex === i ? <ChevronUp className="text-blue-600" size={20} /> : <ChevronDown className="text-gray-400" size={20} />}
                </button>
                {openIndex === i && (
                  <div className="px-8 pb-6 text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
