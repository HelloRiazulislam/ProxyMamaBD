import { Link } from 'react-router-dom';
import { ShieldCheck, Facebook, Instagram, Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { useSettings } from '../App';

export default function Footer() {
  const { settings } = useSettings();
  const social = settings?.socialLinks || {};

  return (
    <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-2">
              {settings?.branding?.logoUrl ? (
                <img src={settings.branding.logoUrl} alt={settings.platformName || 'ProxyMama'} className="h-10 w-auto" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900">
                  <ShieldCheck className="text-white" size={24} />
                </div>
              )}
              <span className="text-2xl font-bold text-white tracking-tight">{settings?.platformName || 'ProxyMama'}</span>
            </Link>
            <p className="text-sm leading-relaxed">
              The leading provider of high-speed Bangladesh proxies. 
              Reliable, secure, and affordable solutions for all your needs.
            </p>
            <div className="flex space-x-4">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                  <Facebook size={20} />
                </a>
              )}
              {social.telegram && (
                <a href={social.telegram} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                  <Send size={20} />
                </a>
              )}
              {social.whatsapp && (
                <a href={`https://wa.me/${social.whatsapp}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                  <MessageCircle size={20} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
              <li><Link to="/downloads" className="hover:text-blue-500 transition-colors">Downloads</Link></li>
              <li><Link to="/faq" className="hover:text-blue-500 transition-colors">FAQ</Link></li>
              <li><Link to="/track-order" className="hover:text-blue-500 transition-colors">Track Order</Link></li>
              <li><Link to="/contact" className="hover:text-blue-500 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Legal</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/terms" className="hover:text-blue-500 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-500 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund" className="hover:text-blue-500 transition-colors">Refund Policy</Link></li>
              <li><Link to="/cookies" className="hover:text-blue-500 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-blue-500" />
                <span>{settings?.supportEmail || 'support@proxymama.com'}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-blue-500" />
                <span>+880 1234-567890</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin size={18} className="text-blue-500" />
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} {settings?.platformName || 'ProxyMama'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
