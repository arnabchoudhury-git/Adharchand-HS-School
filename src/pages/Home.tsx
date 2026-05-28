import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Users, Trophy, Bell, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Home() {
  const [admissionsOpen, setAdmissionsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'admissions');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAdmissionsOpen(docSnap.data().open ?? true);
      } else {
        setAdmissionsOpen(true);
      }
    }, (error) => {
      console.error("Error fetching settings:", error);
      setAdmissionsOpen(true);
    });
    return () => unsubscribe();
  }, []);

  const notices = [
    { date: 'OCT 24, 2023', title: 'Final Examination Schedule for Grade 10 & 12' },
    { date: 'OCT 20, 2023', title: 'Inter-School Athletic Meet Registration Open' },
    { date: 'OCT 15, 2023', title: 'Parent-Teacher Conference: Winter Session' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-full overflow-hidden"
    >
      {/* Hero Section */}
      <section className="bg-white border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 min-h-[70vh]">
          <div className="md:col-span-12 lg:col-span-7 p-8 md:p-16 flex flex-col justify-center border-r border-gray-100">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-6 inline-block bg-[#1E3A8A] text-white px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase rounded-sm">
                Excellence in Education Since 1940
              </div>
              <h2 className="text-4xl md:text-7xl font-black text-[#1E3A8A] leading-[1.1] mb-8 tracking-tight">
                तमसो मा ज्योतिर्गमय
                <span className="text-2xl md:text-4xl block mt-6 font-bold text-[#B45309] leading-tight">
                  Lead us from darkness to light
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-xl mb-10 leading-relaxed font-medium">
                Adharchand Higher Secondary School offers a premier curriculum from Grades 6 to 12. 
                Providing a focused environment for boys (6-10) and a dynamic co-educational experience for senior secondary.
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                {admissionsOpen === null ? (
                  <div className="bg-[#1E3A8A]/50 text-white px-8 py-5 font-bold tracking-wide flex items-center justify-center gap-3 select-none">
                    LOADING PORTAL STATUS...
                  </div>
                ) : admissionsOpen ? (
                  <Link 
                    to="/admission" 
                    className="bg-[#1E3A8A] text-white px-8 py-5 font-bold tracking-wide hover:bg-[#162d6b] flex items-center justify-center gap-3 transition-all hover:translate-x-2"
                  >
                    ONLINE ADMISSION (OPEN) <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link 
                    to="/admission" 
                    className="border-2 border-red-600 bg-red-50/50 text-red-600 px-8 py-5 font-bold tracking-wide hover:bg-red-50 flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    ADMISSIONS CLOSED (OFFLINE) <ArrowRight className="w-5 h-5 text-red-600" />
                  </Link>
                )}
                <Link 
                  to="/campus"
                  className="border-2 border-[#1E3A8A] text-[#1E3A8A] px-8 py-5 font-bold tracking-wide hover:bg-[#1E3A8A] hover:text-white transition-all flex items-center justify-center cursor-pointer"
                >
                  EXPLORE CAMPUS
                </Link>
              </div>
            </motion.div>
          </div>
          
          <div className="md:col-span-12 lg:col-span-5 bg-white p-8 md:p-16 flex flex-col">
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-8 text-[#B45309]">
                  <Bell className="w-5 h-5" />
                  <h3 className="text-xs font-bold tracking-widest uppercase">Latest Notices</h3>
                </div>
                <div className="space-y-10">
                  {notices.map((notice, idx) => (
                    <div key={idx} className="group cursor-pointer border-l-2 border-transparent hover:border-[#1E3A8A] pl-4 transition-all">
                      <p className="text-[11px] text-gray-400 font-bold mb-2 uppercase tracking-wider">{notice.date}</p>
                      <p className="text-base font-bold text-[#1E3A8A] group-hover:text-[#B45309] transition-colors leading-tight">{notice.title}</p>
                    </div>
                  ))}
                </div>
                <Link to="/notice" className="inline-block mt-8 text-xs font-bold border-b-2 border-gray-200 pb-1 hover:border-[#1E3A8A] text-gray-500 hover:text-[#1E3A8A] transition-all">
                  VIEW ALL ANNOUNCEMENTS
                </Link>
              </div>

              <div className="mt-16 p-8 bg-[#F4F4F1] relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-[#1E3A8A]/5 -rotate-12 translate-x-8 -translate-y-8 group-hover:rotate-0 transition-transform"></div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Admission Status</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-black text-[#1E3A8A]">OPEN</p>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm text-gray-500 mt-2 font-medium">Limited seats available for Grade 11 Science, Commerce & Arts streams.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#1E3A8A] text-white py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: 'STUDENTS', count: '1,200+', icon: Users },
            { label: 'EXPERIENCED FACULTY', count: '85+', icon: BookOpen },
            { label: 'SPORTS TITLES', count: '42', icon: Trophy },
            { label: 'YEARS LEGACY', count: '80+', icon: Bell },
          ].map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-4">
              <stat.icon className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-4xl md:text-5xl font-black tracking-tighter">{stat.count}</p>
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60 leading-none">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <p className="text-[#B45309] font-bold text-xs uppercase tracking-widest mb-4">Our Methodology</p>
            <h3 className="text-5xl font-black text-[#1E3A8A] leading-tight mb-6">Why Choose Adharchand?</h3>
            <p className="text-gray-500 text-lg">We believe in a holistic education that balances rigorous academics with creative arts, athletics, and social responsibility.</p>
          </div>
          <Link to="/about" className="text-sm font-bold bg-white border-2 border-[#1E3A8A] text-[#1E3A8A] px-8 py-4 hover:bg-[#1E3A8A] hover:text-white transition-all">
            DISCOVER OUR STORY
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Academic Rigor', desc: 'Consistently achieving 100% pass rates in board examinations with top state rankings.', imgColor: 'bg-[#1E3A8A]/10' },
            { title: 'Value Based', desc: 'Rooted in Indian traditions while fostering a global outlook for the 21st century.', imgColor: 'bg-[#B45309]/10' },
            { title: 'Modern Facilities', desc: 'Smart classrooms, advanced science labs, and comprehensive sports infrastructure.', imgColor: 'bg-white' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-10 border border-gray-100 hover:border-[#1E3A8A] transition-all group">
              <div className={`w-full aspect-video mb-8 overflow-hidden rounded-sm relative`}>
                <img 
                  src="/src/assets/images/adharchand_school_building_1779038874684.png" 
                  alt="School Heritage" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-[#1E3A8A]/10 group-hover:bg-transparent transition-colors"></div>
              </div>
              <h4 className="text-2xl font-bold text-[#1E3A8A] mb-4">{item.title}</h4>
              <p className="text-gray-500 leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
