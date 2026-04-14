import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Smartphone, Apple } from 'lucide-react';

export default function Downloads() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Downloads</h1>
      <p className="text-gray-500 dark:text-gray-400">Download our apps to get started with our proxy services.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <a 
          href="https://play.google.com/store/apps/details?id=com.scheler.superproxy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="p-4 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl mr-4">
            <Smartphone size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">Android App</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Download from Google Play Store</p>
          </div>
        </a>

        <a 
          href="https://apps.apple.com/us/app/potatso/id1239860606" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="p-4 bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white rounded-xl mr-4">
            <Apple size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">iOS App</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Download from Apple App Store</p>
          </div>
        </a>
      </div>
    </div>
  );
}
