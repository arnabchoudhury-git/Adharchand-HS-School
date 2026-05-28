import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, UserRound, GraduationCap, ShieldCheck, ArrowRight, ChevronLeft } from 'lucide-react';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LoginCard = ({ title, icon: Icon, description, onClick }: { title: string, icon: any, description: string, onClick: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={onClick}
    className="bg-white border-2 border-gray-100 p-8 hover:border-[#1E3A8A] transition-all group relative overflow-hidden cursor-pointer"
  >
    <div className="absolute right-0 top-0 w-24 h-24 bg-[#1E3A8A]/5 -rotate-12 translate-x-8 -translate-y-8 group-hover:rotate-0 transition-transform"></div>
    
    <div className="w-16 h-16 bg-[#1E3A8A]/10 flex items-center justify-center rounded-sm mb-6 text-[#1E3A8A] group-hover:bg-[#1E3A8A] group-hover:text-white transition-colors">
      <Icon className="w-8 h-8" />
    </div>
    
    <h3 className="text-2xl font-black text-[#1E3A8A] mb-3 tracking-tight uppercase">{title}</h3>
    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
      {description}
    </p>
    
    <button className="flex items-center gap-3 text-sm font-bold text-[#B45309] hover:gap-5 transition-all group-hover:text-[#1E3A8A]">
      ACCESS PORTAL <ArrowRight className="w-4 h-4" />
    </button>
  </motion.div>
);

export default function Login() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string | null>(searchParams.get('type'));

  useEffect(() => {
    setSelectedType(searchParams.get('type'));
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      // Check for admin status both via context and email pattern for immediate redirect
      const isActuallyAdmin = isAdmin || user.email?.endsWith('@adharchand.edu') || selectedType === 'admin';
      
      if (isActuallyAdmin) {
        navigate('/dashboard');
      } else {
        navigate('/'); 
      }
    }
  }, [user, isAdmin, navigate, selectedType]);

  return (
    <div className="min-h-screen pt-12 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="bg-[#1E3A8A] text-white px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm inline-block mb-4">
            Security Portal
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[#1E3A8A] tracking-tight leading-[0.95]">
            AUTHORIZED<br/>ACCESS ONLY
          </h1>
          <p className="mt-6 text-gray-500 max-w-2xl font-medium">
            Please select your portal to continue. Your access is logged and monitored for security purposes.
          </p>
        </header>

        <AnimatePresence mode="wait">
          {!selectedType ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <LoginCard 
                title="Student Login" 
                icon={GraduationCap}
                description="Access your marksheet, attendance records, study materials, and academic reports."
                onClick={() => setSelectedType('student')}
              />
              <LoginCard 
                title="Faculty Login" 
                icon={UserRound}
                description="Manage classes, grade assignments, update notices, and access staff resources."
                onClick={() => setSelectedType('faculty')}
              />
              <LoginCard 
                title="Admin Login" 
                icon={ShieldCheck}
                description="Comprehensive management of school operations, databases, and configuration."
                onClick={() => setSelectedType('admin')}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl"
            >
              <button 
                onClick={() => setSelectedType(null)}
                className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A] mb-8 hover:gap-4 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> GO BACK TO SELECTION
              </button>
              <AuthForm isAdminMode={selectedType === 'admin'} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-16 p-8 bg-white border-t-4 border-[#1E3A8A] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 flex items-center justify-center text-red-600 rounded-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-[#1E3A8A]">Forgot Credentials?</h4>
              <p className="text-xs text-gray-500">Contact the IT department for password reset requests.</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Privacy Policy & Terms of Service Apply
          </p>
        </div>
      </div>
    </div>
  );
}
