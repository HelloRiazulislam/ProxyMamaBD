import { Link } from 'react-router-dom';
import { ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth, useSettings } from '../App';

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { settings } = useSettings();

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Downloads', path: '/downloads' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {settings?.branding?.logoUrl ? (
                <img src={settings.branding.logoUrl} alt={settings.platformName || 'ProxyMama'} className="h-10 w-auto" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                  <ShieldCheck className="text-white" size={24} />
                </div>
              )}
              <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{settings?.platformName || 'ProxyMama'}</span>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <Link
                to="/dashboard"
                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 dark:shadow-none"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 dark:shadow-none"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 shadow-2xl p-6 space-y-6 animate-in slide-in-from-top-5 duration-200">
          <div className="space-y-4">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 py-2 border-b border-gray-50 dark:border-slate-800"
              >
                {link.name}
              </Link>
            ))}
          </div>
          {user ? (
            <Link
              to="/dashboard"
              onClick={() => setIsOpen(false)}
              className="block w-full text-center px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none"
            >
              Dashboard
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center py-4 text-gray-900 dark:text-white font-bold rounded-2xl bg-gray-100 dark:bg-slate-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="text-center px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
