import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight, 
  Server, 
  Lock, 
  CheckCircle2,
  Activity,
  ChevronRight
} from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1121] font-sans selection:bg-blue-500/30">
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Minimalist Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] -z-10" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -z-10 h-[400px] w-[800px] rounded-full bg-blue-500/10 blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300 mb-8 shadow-sm backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Premium BDIX Proxy Network
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight"
          >
            Unlock the True Power of <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              High-Speed Internet
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Enterprise-grade proxies in Bangladesh. Experience ultra-low latency, absolute privacy, and uninterrupted streaming with our premium network.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
            >
              Get Started Now
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/downloads"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center shadow-sm hover:-translate-y-0.5"
            >
              Download App
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-[#0F172A] border-y border-slate-100 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Engineered for Excellence</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">Clean, reliable, and blazingly fast infrastructure built for your most demanding tasks.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Experience ultra-low latency and high-speed connections optimized specifically for Bangladesh ISPs."
              },
              {
                icon: ShieldCheck,
                title: "Secure & Private",
                description: "Military-grade encryption ensures your traffic remains private and your real IP stays hidden."
              },
              {
                icon: Server,
                title: "99.9% Uptime",
                description: "Enterprise-grade servers with automated failover guarantee maximum uptime and reliability."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 transition-colors group"
              >
                <div className="w-12 h-12 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-[#F8FAFC] dark:bg-[#0B1121]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Built for Your Needs</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-10 text-lg leading-relaxed">
                Whether you are a gamer, streamer, or just value your online privacy, our BDIX proxies are optimized for peak performance across all your activities.
              </p>
              
              <div className="space-y-8">
                {[
                  { title: "Low-Ping Gaming", desc: "Experience lag-free gaming with optimized routing to local and international servers." },
                  { title: "Buffer-Free Streaming", desc: "Watch your favorite content in 4K without interruptions using BDIX bandwidth." },
                  { title: "Absolute Privacy", desc: "Keep your real identity hidden and protect your personal data from prying eyes." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800/50">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Professional Widget UI */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-cyan-400/20 rounded-[2rem] transform rotate-2 scale-105 -z-10 blur-xl" />
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Globe size={24} strokeWidth={1.5} />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-lg">Network Status</div>
                      <div className="text-sm text-green-500 font-medium flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Active & Secured
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    { label: "IP Address", value: "Hidden for Privacy", highlight: true },
                    { label: "Location", value: "Dhaka, Bangladesh" },
                    { label: "Latency", value: "12ms", success: true },
                    { label: "Bandwidth", value: "Unlimited" }
                  ].map((stat, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</span>
                      <span className={cn(
                        "font-semibold",
                        stat.highlight ? "text-slate-900 dark:text-white font-mono" : 
                        stat.success ? "text-green-500" : "text-slate-900 dark:text-white"
                      )}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden border border-slate-800 dark:border-slate-700 shadow-2xl">
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] -z-10 pointer-events-none" />
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">Ready to upgrade your connection?</h2>
            <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-lg">
              Join thousands of professionals who trust ProxyMamaBD for their daily operations. Fast, secure, and incredibly reliable.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:-translate-y-0.5"
            >
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


