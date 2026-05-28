import { motion } from 'motion/react';
import { Calendar, Download, ExternalLink, ChevronRight } from 'lucide-react';

export default function Notice() {
  const categories = ['ALL', 'ACADEMICS', 'SPORTS', 'EVENTS', 'CIRCULARS'];
  const notices = [
    { category: 'ACADEMICS', date: '24 OCT 2023', title: 'Final Examination Schedule for Grade 10 & 12 (Board Prep)', desc: 'Detailed schedule for the upcoming mock board examinations and practical sessions.' },
    { category: 'SPORTS', date: '20 OCT 2023', title: 'Inter-School Athletic Meet 2023: Registration Open', desc: 'Students interested in track and field events can register with the Sports HOD.' },
    { category: 'EVENTS', date: '15 OCT 2023', title: 'Annual Cultural Festival "Sanskriti" - Volunteers Needed', desc: 'Calling all creative minds for the stage management and hospitality teams.' },
    { category: 'ACADEMICS', date: '10 OCT 2023', title: 'Quarterly Project Submissions - Winter Term', desc: 'Reminder for all grades regarding the electronic submission of term projects.' },
    { category: 'CIRCULARS', date: '05 OCT 2023', title: 'Winter Uniform Regulations - Effective Nov 1st', desc: 'Important change in the daily attire requirements for the winter session.' },
    { category: 'SPORTS', date: '28 SEP 2023', title: 'Swimming Gala: Results and Award Ceremony', desc: 'Congratulations to the Blue Tigers house for winning the overall championship.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      <header className="bg-white border-b-2 border-[#1E3A8A] pt-24 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-end gap-8">
          <div>
            <p className="text-[#B45309] font-bold text-xs uppercase tracking-[0.3em] mb-4">Official Announcements</p>
            <h2 className="text-5xl md:text-7xl font-black text-[#1E3A8A] tracking-tighter italic">NOTICE BOARD.</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {categories.map((cat, i) => (
              <button 
                key={i} 
                className={`px-6 py-3 text-[10px] font-bold tracking-widest border-2 transition-all ${i === 0 ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-gray-500 border-gray-100 hover:border-[#1E3A8A]'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
          {notices.map((notice, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-100 p-10 flex flex-col group hover:shadow-2xl hover:shadow-[#1E3A8A]/5 transition-all relative z-0 hover:z-10"
            >
              <div className="flex justify-between items-start mb-10">
                <div className="px-3 py-1 border-2 border-[#1E3A8A] text-[9px] font-black text-[#1E3A8A] tracking-widest uppercase italic">
                  {notice.category}
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold tracking-wider">{notice.date}</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1E3A8A] mb-4 group-hover:text-[#B45309] transition-colors leading-tight">
                {notice.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
                {notice.desc}
              </p>
              <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                <button className="flex items-center gap-2 text-[10px] font-bold text-[#1E3A8A] hover:underline uppercase tracking-widest">
                  Read More <ChevronRight className="w-3 h-3" />
                </button>
                <div className="flex gap-4">
                  <Download className="w-4 h-4 text-gray-300 hover:text-[#1E3A8A] cursor-pointer transition-colors" />
                  <ExternalLink className="w-4 h-4 text-gray-300 hover:text-[#1E3A8A] cursor-pointer transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
           <button className="px-12 py-5 bg-white border-2 border-[#1E3A8A] text-[#1E3A8A] font-extrabold tracking-[0.2em] text-xs hover:bg-[#1E3A8A] hover:text-white transition-all italic">
             LOAD HISTORICAL ARCHIVE
           </button>
        </div>
      </div>
    </motion.div>
  );
}
