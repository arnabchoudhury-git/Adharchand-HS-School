import { motion } from 'motion/react';
import { Mail, Linkedin, GraduationCap, School } from 'lucide-react';

export default function Faculty() {
  const departments = ['ADMINISTRATION', 'SCIENCE', 'COMMERCE', 'HUMANITIES', 'ARTS & CULTURE'];
  
  const faculty = [
    { name: 'Dr. Rajesh Sharma', role: 'Principal / Physics', dept: 'ADMINISTRATION', img: 'RS', bio: 'PhD in Theoretical Physics from IIT Bombay, with 25 years of educational experience.' },
    { name: 'Mrs. Sunita Verma', role: 'Vice Principal / Mathematics', dept: 'ADMINISTRATION', img: 'SV', bio: 'Academic head overseeing curriculum design and mathematical research.' },
    { name: 'Mr. Amit Das', role: 'HOD / English Language', dept: 'HUMANITIES', img: 'AD', bio: 'Specialist in post-colonial literature and creative writing workshops.' },
    { name: 'Dr. Priya Nair', role: 'Senior Lecturer / Chemistry', dept: 'SCIENCE', img: 'PN', bio: 'Expert in Organic Chemistry and Laboratory safety protocols.' },
    { name: 'Mr. Rahul Sengupta', role: 'Senior Faculty / Accountancy', dept: 'COMMERCE', img: 'RS', bio: 'Chartered Accountant with a passion for teaching modern business ethics.' },
    { name: 'Ms. Ishita Bose', role: 'Senior Faculty / History', dept: 'HUMANITIES', img: 'IB', bio: 'Historian specializing in medieval Indian history and archeology.' },
    { name: 'Mr. David Wilson', role: 'Physical Education / Coach', dept: 'ARTS & CULTURE', img: 'DW', bio: 'Certified athletic trainer focusing on holistic physical development.' },
    { name: 'Mrs. Kavita Reddy', role: 'HOD / Computer Science', dept: 'SCIENCE', img: 'KR', bio: 'Leading the smart-campus initiative and software development club.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24"
    >
      <section className="bg-white border-b-2 border-[#1E3A8A] pt-24 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-12 text-center md:text-left">
          <div className="max-w-2xl">
            <p className="text-[#B45309] font-bold text-xs uppercase tracking-[0.3em] mb-4">Academic Pillars</p>
            <h2 className="text-5xl md:text-7xl font-black text-[#1E3A8A] tracking-tighter mb-8 leading-tight">
              MEET OUR<br/><span className="italic">FACULTY MEMBERS.</span>
            </h2>
            <p className="text-lg text-gray-500 font-medium leading-relaxed">
              Our educators are more than teachers; they are mentors, researchers, and specialists dedicated to fostering student potential.
            </p>
          </div>
          <div className="hidden lg:flex w-64 h-64 bg-[#1E3A8A] items-center justify-center -rotate-6 border-8 border-white shadow-xl">
             <GraduationCap className="w-32 h-32 text-white opacity-40" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16 space-y-24">
        {departments.map((dept, dIdx) => (
          <div key={dIdx}>
            <div className="flex items-center gap-6 mb-12">
              <h3 className="text-xs font-black text-[#B45309] tracking-[0.4em] uppercase">{dept}</h3>
              <div className="flex-grow h-0.5 bg-gray-100"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {faculty.filter(f => f.dept === dept).map((member, mIdx) => (
                <div key={mIdx} className="bg-white border border-gray-100 group hover:border-[#1E3A8A] transition-all overflow-hidden flex flex-col">
                  <div className="aspect-square bg-[#F4F4F1] flex items-center justify-center overflow-hidden relative">
                    {/* Portrait Placeholder */}
                    <div className="absolute inset-0 bg-[#1E3A8A]/5 group-hover:bg-[#1E3A8A]/10 transition-colors"></div>
                    <div className="text-4xl font-black text-[#1E3A8A] opacity-10 group-hover:opacity-20 transition-opacity italic">{member.img}</div>
                    <div className="absolute bottom-4 right-4 flex gap-2">
                       <div className="p-2 bg-white rounded-full text-gray-400 hover:text-[#1E3A8A] cursor-pointer shadow-sm"><Mail className="w-3.5 h-3.5" /></div>
                       <div className="p-2 bg-white rounded-full text-gray-400 hover:text-[#1E3A8A] cursor-pointer shadow-sm"><Linkedin className="w-3.5 h-3.5" /></div>
                    </div>
                  </div>
                  <div className="p-6 flex-grow">
                    <h4 className="text-lg font-bold text-[#1E3A8A] mb-1">{member.name}</h4>
                    <p className="text-[10px] font-bold text-[#B45309] uppercase tracking-widest mb-4 italic">{member.role}</p>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      {member.bio}
                    </p>
                  </div>
                  <div className="p-4 bg-[#F4F4F1] group-hover:bg-[#1E3A8A] transition-colors">
                     <p className="text-[9px] font-black group-hover:text-white transition-colors text-[#1E3A8A] tracking-[0.2em] text-center uppercase">View Full Profile</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
