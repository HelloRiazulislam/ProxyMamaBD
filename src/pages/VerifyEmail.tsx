import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sendEmailVerification, applyActionCode } from 'firebase/auth';
import { Mail, RefreshCw, LogOut, CheckCircle, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PublicNavbar from '../components/PublicNavbar';
import { auth } from '../lib/firebase';

export default function VerifyEmail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      handleVerifyCode(oobCode);
    }
  }, [searchParams]);

  const handleVerifyCode = async (code: string) => {
    setVerifying(true);
    try {
      await applyActionCode(auth, code);
      toast.success('Email verified successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Verification failed. The link may be expired.');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.emailVerified) {
      navigate('/dashboard');
      return;
    }

    // Poll for verification status
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          toast.success('Email verified successfully!');
          navigate('/dashboard');
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user?.uid, navigate]);

  const handleResend = async () => {
    if (!user || countdown > 0) return;
    
    setResending(true);
    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent!');
      setCountdown(60);
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-24">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-10 text-center relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50" />

          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-200">
              {verifying ? (
                <RefreshCw className="animate-spin" size={48} />
              ) : (
                <ShieldCheck size={48} />
              )}
            </div>
            
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">
              {verifying ? 'Verifying Account...' : 'Verify Your Email'}
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed px-4">
              {verifying 
                ? 'Please wait while we confirm your email address.' 
                : <>We've sent a secure verification link to <br /><strong className="text-gray-900 font-bold">{user?.email}</strong></>}
            </p>

            {!verifying && (
              <div className="space-y-5">
                <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex items-start text-left">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle className="text-blue-600" size={18} />
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed font-medium">
                    Click the link in your inbox to unlock your ProxyMama account instantly.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={handleResend}
                    disabled={resending || countdown > 0}
                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center justify-center disabled:opacity-50 shadow-xl shadow-gray-200"
                  >
                    {resending ? (
                      <RefreshCw className="animate-spin mr-2" size={20} />
                    ) : (
                      <Mail className="mr-2" size={20} />
                    )}
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center"
                  >
                    <LogOut className="mr-2" size={20} /> Sign Out
                  </button>
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="flex items-center justify-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
                Waiting for verification
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
