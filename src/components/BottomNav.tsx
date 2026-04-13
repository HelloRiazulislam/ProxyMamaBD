import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ShieldCheck, 
  User, 
  Wallet,
  Users,
  Database,
  Search,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from '../App';

interface BottomNavProps {
  role: 'admin' | 'user';
}

export default function BottomNav({ role }: BottomNavProps) {
  const location = useLocation();
  const { t } = useSettings();

  const userLinks = [
    { name: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Buy', icon: ShoppingCart, path: '/dashboard/buy-proxy' },
    { name: 'Proxies', icon: ShieldCheck, path: '/dashboard/my-proxies' },
    { name: 'Wallet', icon: Wallet, path: '/dashboard/add-balance' },
    { name: 'Profile', icon: User, path: '/dashboard/profile' },
  ];

  const adminLinks = [
    { name: 'Home', icon: LayoutDashboard, path: '/admin' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Tracking', icon: Search, path: '/admin/proxy-tracking' },
    { name: 'Inventory', icon: Database, path: '/admin/proxy-inventory' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-200/50 dark:border-slate-800/50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all relative",
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              <link.icon size={20} className={cn(isActive && "scale-110")} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{link.name}</span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
