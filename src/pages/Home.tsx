import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight, 
  Server, 
  Lock, 
  Star,
  ChevronRight,
  Activity,
  Shield,
  ZapOff,
  Terminal,
  Database,
  Check
} from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] font-sans selection:bg-blue-500/30 selection:text-blue-200">
      <PublicNavbar />
      
      {/* Hero Section - Advanced Professional */}
      <section className="relative pt-32 md:pt-56 pb-24 md:pb-48 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent" />
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-[0.25em] mb-10"
            >
              <Activity size={12} className="mr-1" />
              <span>Reliable Proxy Network</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-9xl font-black text-slate-950 dark:text-white tracking-tight leading-[0.95] mb-10"
            >
              Fast & Reliable <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                BD Proxies
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-14 leading-relaxed font-medium"
            >
              The simplest way to get high-quality residential and datacenter proxies 
              in Bangladesh. Secure, fast, and easy to use.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto"
            >
              <Link
                to="/register"
                className="w-full sm:w-auto px-12 py-6 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-blue-500/20 flex items-center justify-center text-lg group"
              >
                Start Now
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={22} />
              </Link>
              <Link
                to="/downloads"
                className="w-full sm:w-auto px-12 py-6 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white font-black rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center text-lg shadow-sm"
              >
                Download App
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 border-y border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
            <div className="flex items-center space-x-2 font-black text-2xl tracking-tighter italic">DATALINE</div>
            <div className="flex items-center space-x-2 font-black text-2xl tracking-tighter italic">CORENET</div>
            <div className="flex items-center space-x-2 font-black text-2xl tracking-tighter italic">SHIELDPAY</div>
            <div className="flex items-center space-x-2 font-black text-2xl tracking-tighter italic">GLOBALIP</div>
          </div>
        </div>
      </section>

      {/* Advanced Features - Bento Grid Style */}
      <section className="py-32 md:py-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-slate-950 dark:text-white tracking-tight mb-6">
              Why Choose <span className="text-blue-600">Us?</span>
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              We provide the best proxy solutions for your business and personal needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Large Feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-8 group bg-slate-50 dark:bg-slate-900/40 p-10 md:p-16 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden relative"
            >
              <div className="relative z-10 max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-8 shadow-lg shadow-blue-500/20">
                  <Zap size={28} />
                </div>
                <h3 className="text-3xl font-black text-slate-950 dark:text-white mb-6">Super Fast Speed</h3>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed font-medium mb-8">
                  Enjoy high-speed internet with our optimized network. 
                  Perfect for browsing, streaming, and automation.
                </p>
                <ul className="space-y-3">
                  {['Unlimited Bandwidth', '99.9% Uptime', 'Fast Response'].map((item, i) => (
                    <li key={i} className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                      <Check size={16} className="mr-2 text-blue-600" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/5 to-transparent -z-10" />
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-700" />
            </motion.div>

            {/* Small Feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-4 bg-slate-950 p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mb-8 backdrop-blur-md">
                  <Lock size={24} />
                </div>
                <h3 className="text-2xl font-black mb-4">Secure & Private</h3>
                <p className="text-slate-400 leading-relaxed font-medium">
                  Your privacy is our priority. We ensure your data and identity stay safe.
                </p>
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />
            </motion.div>

            {/* Small Feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-4 bg-white dark:bg-slate-900/40 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-8">
                  <Terminal size={24} />
                </div>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white mb-4">Easy to Use</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Simple setup process. Get your proxies running in just a few clicks.
                </p>
              </div>
            </motion.div>

            {/* Large Feature */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-8 bg-blue-600 p-10 md:p-16 rounded-[3rem] text-white relative overflow-hidden group"
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-8 backdrop-blur-md">
                    <Globe size={28} />
                  </div>
                  <h3 className="text-3xl font-black mb-6">Real User IPs</h3>
                  <p className="text-blue-100 text-lg leading-relaxed font-medium">
                    Access real residential IPs from Bangladesh for better success rates.
                  </p>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Success', value: '99%' },
                    { label: 'Latency', value: 'Low' },
                    { label: 'Rotation', value: 'Auto' },
                    { label: 'Support', value: '24/7' },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                      <div className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">{stat.label}</div>
                      <div className="text-xl font-black">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="py-32 md:py-56 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-tight mb-8">
                Built for <br />
                <span className="text-blue-500">Everyone</span>
              </h2>
              <div className="space-y-8">
                {[
                  {
                    title: 'Fast Network',
                    desc: 'Optimized servers for the best possible speed.',
                    icon: Server
                  },
                  {
                    title: 'Safe & Secure',
                    desc: 'Advanced encryption to keep your data safe.',
                    icon: Shield
                  },
                  {
                    title: 'Always Online',
                    desc: 'We monitor our network 24/7 to ensure uptime.',
                    icon: Activity
                  }
                ].map((item, i) => (
                  <div key={i} className="flex items-start space-x-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center shrink-0 border border-blue-600/30">
                      <item.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                      <p className="text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 rounded-[3rem] blur-[80px] -z-10" />
              <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                <div className="flex items-center space-x-2 mb-8">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="text-blue-400">$ curl -x proxy.proxymama.com:8080 \</div>
                  <div className="text-blue-400">  -U user:pass https://api.ip.com</div>
                  <div className="text-slate-500"># Response:</div>
                  <div className="text-green-400">{"{"}</div>
                  <div className="text-green-400">  "ip": "103.145.112.45",</div>
                  <div className="text-green-400">  "location": "Dhaka, Bangladesh",</div>
                  <div className="text-green-400">  "status": "Active"</div>
                  <div className="text-green-400">{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Advanced */}
      <section className="py-32 md:py-56">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[4rem] blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[4rem] p-12 md:p-32 text-center relative z-10 shadow-sm">
              <h2 className="text-5xl md:text-8xl font-black text-slate-950 dark:text-white tracking-tight mb-10 leading-none">
                Ready to <span className="text-blue-600">Start?</span>
              </h2>
              <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
                Join thousands of users who trust ProxyMama for their proxy needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-14 py-7 bg-blue-600 text-white font-black rounded-3xl hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-blue-500/20 text-xl"
                >
                  Create Account
                </Link>
                <Link
                  to="/contact"
                  className="w-full sm:w-auto px-14 py-7 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black rounded-3xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xl"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


