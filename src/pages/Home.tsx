import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Globe, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { cn } from '../lib/utils';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 pb-20 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-950 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4 md:mb-6">
              Premium <span className="text-blue-600 dark:text-blue-400">Bangladesh</span> <br />
              Proxy Service
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 md:mb-10 px-2 md:px-0">
              High-speed SOCKS5 and HTTP proxies located in Bangladesh. 
              Perfect for scraping, automation, and secure browsing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center"
              >
                Get Started Now <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                to="/downloads"
                className="w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center"
              >
                Download Tools
              </Link>
            </div>
          </div>
          
          <div className="mt-16 md:mt-20 relative">
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="w-[800px] h-[400px] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50" />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">100%</div>
                  <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Uptime</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">10Gbps</div>
                  <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Network</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">24/7</div>
                  <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Support</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">Instant</div>
                  <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Delivery</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">Why Choose ProxyMama?</h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We provide the most reliable and fastest proxy infrastructure in Bangladesh.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            {[
              {
                title: 'High Speed',
                desc: 'Optimized network for maximum speed and minimum latency.',
                icon: Zap,
                color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
              },
              {
                title: 'Bangladesh Location',
                desc: 'Real residential and datacenter IPs from Bangladesh.',
                icon: Globe,
                color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              },
              {
                title: 'Multiple Protocols',
                desc: 'Full support for SOCKS5 and HTTP/HTTPS protocols.',
                icon: ShieldCheck,
                color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              },
              {
                title: 'Instant Setup',
                desc: 'Get your proxies immediately after purchase.',
                icon: Clock,
                color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              },
              {
                title: 'Unlimited Bandwidth',
                desc: 'No data caps or throttling on our premium plans.',
                icon: CheckCircle,
                color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              },
              {
                title: 'Secure & Private',
                desc: 'Your data and browsing history are never logged.',
                icon: ShieldCheck,
                color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 p-5 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-blue-900/10 transition-shadow flex flex-row md:flex-col items-start gap-4 md:gap-0">
                <div className={cn("w-12 h-12 shrink-0 rounded-xl flex items-center justify-center md:mb-6", feature.color)}>
                  <feature.icon size={24} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">{feature.title}</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 dark:bg-blue-700 rounded-3xl p-6 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-blue-500 dark:bg-blue-600 rounded-full blur-3xl opacity-50" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">Ready to experience the best Bangladesh proxies?</h2>
              <p className="text-blue-100 mb-8 md:mb-10 max-w-xl mx-auto text-base md:text-lg">
                Join thousands of satisfied customers and start your proxy journey today.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 md:px-8 py-3.5 md:py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
