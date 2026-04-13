import { Download, Smartphone, Monitor, Shield, Zap, Globe, Apple } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';
import Footer from '../components/Footer';
import { useSettings } from '../App';

export default function Downloads() {
  const { settings } = useSettings();

  const softwares = [
    {
      name: 'Super Proxy',
      platform: 'Android',
      icon: Smartphone,
      version: 'v0.8.92',
      link: settings?.downloadLinks?.android || 'https://github.com/chen08209/FlClash/releases/download/v0.8.92/FlClash-0.8.92-android-arm64-v8a.apk',
      description: 'High-performance proxy client for Android devices. Supports multiple protocols and easy configuration.',
      features: ['BDIX Speed Bypass', 'Low Latency', 'Battery Optimized']
    },
    {
      name: 'Proxifier',
      platform: 'Windows',
      icon: Monitor,
      version: 'Standard Edition',
      link: settings?.downloadLinks?.windows || 'https://www.proxifier.com/download/ProxifierSetup.exe',
      description: 'The most advanced proxy client for Windows. Allows network applications that do not support working through proxy servers to operate through a SOCKS or HTTP(S) proxy.',
      features: ['System-wide Proxy', 'Rule-based Routing', 'DNS over Proxy']
    },
    {
      name: 'V2RayNG',
      platform: 'iOS / macOS',
      icon: Apple,
      version: 'Latest',
      link: settings?.downloadLinks?.ios || '#',
      description: 'Versatile proxy client for Apple devices. Supports V2Ray, Shadowsocks, and Trojan protocols with high stability.',
      features: ['Secure Encryption', 'Multi-protocol', 'iCloud Sync']
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <PublicNavbar />
      
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              Download <span className="text-blue-600">Setup Tools</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Get the best software to connect and manage your proxies on all your devices.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {softwares.map((soft) => (
              <div key={soft.name} className="bg-gray-50 dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 hover:shadow-xl transition-all group">
                <div className="flex items-start justify-between mb-8">
                  <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    <soft.icon className="text-blue-600 dark:text-blue-400" size={32} />
                  </div>
                  <span className="px-4 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                    {soft.platform}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{soft.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Version: {soft.version}</p>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {soft.description}
                </p>
                
                <div className="space-y-3 mb-8">
                  {soft.features.map((feature) => (
                    <div key={feature} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <Shield size={16} className="text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>

                <a
                  href={soft.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center group shadow-lg shadow-blue-100 dark:shadow-none"
                >
                  <Download className="mr-2 group-hover:animate-bounce" size={20} />
                  Download Now
                </a>
              </div>
            ))}
          </div>

          <div className="bg-blue-600 rounded-[40px] p-12 text-white overflow-hidden relative">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-bold mb-4">Need help with setup?</h2>
              <p className="text-blue-100 mb-8">
                Check our FAQ section for detailed step-by-step guides on how to configure these softwares with our proxies.
              </p>
              <div className="flex flex-wrap gap-4">
                <Shield className="opacity-50" size={40} />
                <Zap className="opacity-50" size={40} />
                <Globe className="opacity-50" size={40} />
              </div>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-50" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
