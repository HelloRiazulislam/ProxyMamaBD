import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '../App';

export default function AdminLayout() {
  const { profile } = useAuth();

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar role="admin" />
      <main className="lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <BottomNav role="admin" />
    </div>
  );
}
