import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Mail, Lock, User, ArrowRight, Phone, Smartphone, CheckCircle2 } from 'lucide-react';

type AuthMethod = 'email' | 'phone';

export default function AuthForm({ isAdminMode = false }: { isAdminMode?: boolean }) {
  const [method, setMethod] = useState<AuthMethod>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Clean up reCAPTCHA on unmount
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    try {
      if (isLogin) {
        try {
          await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        } catch (loginErr: any) {
          // If login fails and matches requested admin credentials, try to auto-create
          if (trimmedEmail === 'admin@adharchand.edu' && trimmedPassword === 'School@Adharchand78') {
            try {
              console.log('Auto-provisioning admin account...');
              await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
            } catch (createErr: any) {
              // If creation also fails (e.g. already exists but password is wrong), throw original login error
              throw loginErr;
            }
          } else {
            throw loginErr;
          }
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        await updateProfile(userCredential.user, { displayName: name });
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
    } catch (err: any) {
      handleError(err);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(otp);
    } catch (err: any) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err: any) => {
    console.error('Auth error:', err);
    let message = err.message || 'Authentication failed';
    
    if (err.code === 'auth/invalid-credential') {
      message = 'Invalid credentials. Please check your details.';
    } else if (err.code === 'auth/user-not-found') {
      message = 'No account found. Please sign up first.';
    } else if (err.code === 'auth/wrong-password') {
      message = 'Incorrect password.';
    } else if (err.code === 'auth/invalid-phone-number') {
      message = 'The phone number provided is incorrect.';
    } else if (err.code === 'auth/too-many-requests') {
      message = 'Too many attempts. Please try again later.';
    }
    
    setError(message);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border-2 border-[#1E3A8A] p-8 md:p-12 shadow-2xl relative overflow-hidden"
    >
      <div id="recaptcha-container"></div>
      <div className="absolute right-0 top-0 w-32 h-32 bg-[#1E3A8A]/5 -rotate-12 translate-x-12 -translate-y-12"></div>
      
      <div className="relative">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-4xl font-black text-[#1E3A8A] tracking-tighter mb-2 uppercase">
              {method === 'email' ? (isLogin ? 'Sign In' : 'Join Us') : 'Phone Auth'}
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              Access the Adharchand HS Portal
            </p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => { setMethod('email'); setError(''); setConfirmationResult(null); }}
              className={`p-3 rounded-full transition-all ${method === 'email' ? 'bg-[#1E3A8A] text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              title="Email Auth"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button 
              onClick={() => { setMethod('phone'); setError(''); setConfirmationResult(null); }}
              className={`p-3 rounded-full transition-all ${method === 'phone' ? 'bg-[#1E3A8A] text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
              title="Phone Auth"
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {method === 'email' ? (
            <motion.form 
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleEmailSubmit} 
              className="space-y-6"
            >
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 focus:border-[#1E3A8A] outline-none transition-all font-bold text-sm"
                      placeholder="John Doe"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">
                  {isAdminMode ? 'User Address' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 focus:border-[#1E3A8A] outline-none transition-all font-bold text-sm"
                    placeholder={isAdminMode ? "user@example.com" : "email@example.com"}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 focus:border-[#1E3A8A] outline-none transition-all font-bold text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 border-l-4 border-red-500">{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#1E3A8A] text-white py-4 font-black text-sm uppercase tracking-[0.2em] hover:bg-[#B45309] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-xl"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {isLogin ? 'Authorize Entry' : 'Create Profile'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {!confirmationResult ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="tel" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 focus:border-[#1E3A8A] outline-none transition-all font-bold text-sm"
                        placeholder="+91 12345 67890"
                        required
                      />
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 border-l-4 border-red-500">{error}</p>}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#1E3A8A] text-white py-4 font-black text-sm uppercase tracking-[0.2em] hover:bg-[#B45309] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get OTP Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 italic">Code sent to {phoneNumber}</p>
                    <label className="text-[10px] font-bold text-[#1E3A8A] uppercase tracking-widest">One Time Password</label>
                    <div className="relative">
                      <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 focus:border-[#1E3A8A] outline-none transition-all font-bold text-sm"
                        placeholder="123456"
                        required
                      />
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 border-l-4 border-red-500">{error}</p>}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#1E3A8A] text-white py-4 font-black text-sm uppercase tracking-[0.2em] hover:bg-[#B45309] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setConfirmationResult(null)}
                    className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#1E3A8A]"
                  >
                    Resend Code or Change Number
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isAdminMode && (
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-4 font-medium italic">
              {method === 'email' 
                ? (isLogin ? "New to the portal?" : "Already have an account?") 
                : "Need to use email instead?"}
            </p>
            <button 
              type="button"
              onClick={() => {
                if (method === 'phone') {
                  setMethod('email');
                  setIsLogin(true);
                } else {
                  setIsLogin(!isLogin);
                }
                setError('');
              }}
              className={`text-xs font-black uppercase tracking-widest transition-colors border-2 px-6 py-2 rounded-sm ${isLogin ? 'text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white' : 'text-[#B45309] border-[#B45309] hover:bg-[#B45309] hover:text-white'}`}
            >
              {method === 'phone' ? "Use Email Login" : (isLogin ? "Create an Account" : "Access Login")}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

