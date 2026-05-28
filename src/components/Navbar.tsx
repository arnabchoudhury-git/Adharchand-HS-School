import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { name: 'HOME', path: '/' },
    { name: 'ABOUT', path: '/about' },
    { name: 'CAMPUS', path: '/campus' },
    { name: 'ADMISSION', path: '/admission' },
    { name: 'NOTICE', path: '/notice' },
    { name: 'CALENDAR', path: '/calendar' },
    { name: 'FACULTY', path: '/faculty' },
    ...(isAdmin ? [{ name: 'DASHBOARD', path: '/dashboard' }] : []),
    ...(user ? [
      { name: 'SIGN OUT', path: '#signout', onClick: handleLogout }
    ] : [
      { 
        name: 'LOGIN', 
        path: '/login',
        dropdown: [
          { name: 'Admin Login', path: '/login?type=admin' },
          { name: 'Faculty Login', path: '/login?type=faculty' },
          { name: 'Student Login', path: '/login?type=student' },
        ]
      }
    ]),
  ];

  return (
    <header className="bg-white border-b-2 border-[#1E3A8A] px-6 md:px-12 py-6 flex justify-between items-center sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-4 group">
        <div className="w-20 h-20 bg-white flex items-center justify-center rounded-sm transition-transform group-hover:scale-105 overflow-hidden">
          <img 
            src="/src/assets/images/adharchand_torch_logo_1779037415571.png" 
            alt="Adharchand HS School Logo" 
            className="w-full h-full object-contain scale-110"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl md:text-4xl font-black text-[#1E3A8A] leading-[0.9] tracking-tighter uppercase">ADHARCHAND</h1>
          <p className="text-[10px] md:text-sm font-bold text-[#B45309] tracking-[0.22em] leading-none mt-1 uppercase">Higher Secondary School</p>
        </div>
      </Link>
      
      <nav className="hidden md:flex gap-4 lg:gap-8 items-center">
        {navItems.map((item) => (
          <div key={item.path} className="relative group/parent">
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="text-sm font-black text-[#B45309] hover:text-[#1E3A8A] transition-colors cursor-pointer uppercase py-1"
              >
                {item.name}
              </button>
            ) : (
              <Link
                to={item.path}
                className={cn(
                  "text-sm font-bold pb-1 transition-all duration-200 block",
                  location.pathname === item.path 
                    ? "text-[#1E3A8A] border-b-2 border-[#1E3A8A]" 
                    : item.name === 'LOGIN'
                      ? "px-4 py-2 bg-[#1E3A8A] text-white rounded-sm hover:bg-[#B45309] transition-colors"
                      : "text-gray-500 hover:text-[#1E3A8A]"
                )}
              >
                {item.name}
              </Link>
            )}
            
            {item.dropdown && (
              <div className="absolute top-full left-0 pt-4 hidden group-hover/parent:block min-w-[200px] z-50">
                <div className="bg-white border-2 border-[#1E3A8A] p-2 shadow-xl">
                  {item.dropdown.map((subItem) => (
                    <Link
                      key={subItem.path}
                      to={subItem.path}
                      className="block px-4 py-3 text-[10px] font-black text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white transition-colors uppercase tracking-widest"
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Mobile Menu Trigger */}
      <div className="md:hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-[#1E3A8A] p-2 hover:bg-[#1E3A8A]/5 transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-0 right-0 bg-white border-b-2 border-[#1E3A8A] overflow-hidden z-40 shadow-2xl"
          >
            <div className="p-6 space-y-2">
              {navItems.map((item) => (
                <div key={item.path} className="border-b border-gray-50 last:border-0 pb-2">
                  <div className="flex items-center justify-between">
                    {item.onClick ? (
                      <button
                        onClick={() => {
                          item.onClick?.();
                          setIsOpen(false);
                        }}
                        className="text-lg font-black tracking-tight py-3 text-[#B45309] block uppercase w-full text-left cursor-pointer"
                      >
                        {item.name}
                      </button>
                    ) : (
                      <Link
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "text-lg font-black tracking-tight py-3 block",
                          location.pathname === item.path 
                            ? "text-[#1E3A8A]" 
                            : item.name === 'LOGIN'
                              ? "text-[#B45309]"
                              : "text-gray-500"
                        )}
                      >
                        {item.name}
                      </Link>
                    )}
                    {item.dropdown && (
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === item.name ? null : item.name)}
                        className="p-3 text-[#1E3A8A]"
                      >
                        <ChevronDown className={cn("w-5 h-5 transition-transform", activeDropdown === item.name && "rotate-180")} />
                      </button>
                    )}
                  </div>
                  
                  {item.dropdown && activeDropdown === item.name && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 p-4 mt-2 grid grid-cols-1 gap-4"
                    >
                      {item.dropdown.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] font-black text-[#1E3A8A] uppercase tracking-widest pl-4 border-l-2 border-[#B45309]"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-6 bg-[#1E3A8A] text-white text-center">
              <p className="text-[10px] font-bold tracking-[0.2em] mb-2 uppercase">Connect With Us</p>
              <div className="flex justify-center gap-6">
                <span className="text-xs font-bold">SILCHAR ADHARCHAND HS</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
