import { motion } from 'motion/react';
import { History, Target, Eye, Quote } from 'lucide-react';

export default function About() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="pb-24"
    >
      <header className="bg-white border-b border-gray-100 pt-24 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#B45309] font-bold text-xs uppercase tracking-[0.3em] mb-4">Institutional Profile</p>
          <h2 className="text-5xl md:text-7xl font-black text-[#1E3A8A] tracking-tighter mb-8 leading-tight">
            A DELEGACY OF<br/>TRANSFORMATION.
          </h2>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-24 grid grid-cols-1 md:grid-cols-12 gap-16">
        <div className="md:col-span-8 space-y-12">
          <div>
            <div className="flex items-center gap-4 mb-6 text-[#1E3A8A]">
              <History className="w-6 h-6" />
              <h3 className="text-2xl font-bold tracking-tight">Our History</h3>
            </div>
            <div className="prose prose-lg text-gray-600 leading-relaxed space-y-6">
              <p>
                Adharchand Higher Secondary School of Silchar is one of the oldest and most respected educational institutions in the Barak Valley. Established in 1940 during the British period, the school has played a significant role in spreading modern education in southern Assam. Over the decades, it has earned a reputation for academic excellence, discipline, and cultural development.
              </p>
              <p>
                The school was named after the visionary philanthropist Late Shri Adharchand Ghosh, whose dream was to create a temple of learning that remained accessible to all while maintaining world-class standards of excellence.
              </p>
              <p>
                The institution has produced many distinguished students who have contributed to society in different fields such as education, administration, literature, and public service. The school has always encouraged not only academic achievement but also sports, cultural activities, and moral values. Its platinum jubilee celebration reflected the pride and emotional attachment of generations of students and teachers associated with the institution.
              </p>
              <p>
                Today, Adharchand Higher Secondary School continues to uphold its rich heritage while adapting to modern educational needs with improved infrastructure and smart classroom facilities. It remains a symbol of learning, tradition, and progress in Silchar and the Barak Valley.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12">
            <div className="p-10 bg-white border-l-4 border-[#1E3A8A] shadow-sm">
              <Target className="w-8 h-8 text-[#1E3A8A] mb-6" />
              <h4 className="text-xl font-bold mb-4">Our Mission</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                To empower students with a rigorous academic foundation, ethical values, and the critical thinking skills necessary to navigate a complex, changing world.
              </p>
            </div>
            <div className="p-10 bg-white border-l-4 border-[#B45309] shadow-sm">
              <Eye className="w-8 h-8 text-[#B45309] mb-6" />
              <h4 className="text-xl font-bold mb-4">Our Vision</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                To be a benchmark of educational excellence that produces socially conscious, globally competitive, and compassionate world citizens.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-4">
          <div className="sticky top-32 space-y-8">
            <div className="bg-[#1E3A8A] text-white p-12 relative overflow-hidden">
              <Quote className="absolute top-8 right-8 w-16 h-16 opacity-10" />
              <p className="text-lg font-medium leading-relaxed italic relative z-10">
                "Education is not just the learning of facts, but the training of the mind to think."
              </p>
              <div className="mt-8 border-t border-white/20 pt-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center italic font-bold">MB</div>
                <div>
                  <p className="text-sm font-bold">Mrs. Madhuri Barman</p>
                  <p className="text-[10px] opacity-60 uppercase tracking-widest">Principal's Message</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border border-gray-100">
               <h4 className="text-xs font-bold uppercase tracking-widest text-[#B45309] mb-6">Core Values</h4>
               <ul className="space-y-4">
                 {['Integrity First', 'Academic Discipline', 'Social Responsibility', 'Creative Freedom', 'Resilience'].map((val, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm font-bold text-[#1E3A8A]">
                     <div className="w-1.5 h-1.5 bg-[#B45309] rounded-full"></div>
                     {val}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Co-ed Info */}
      <section className="bg-white mt-24 py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h3 className="text-4xl font-black text-[#1E3A8A] mb-8 leading-tight">Diversity in our<br/>Academic Structure.</h3>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Adharchand maintains a unique institutional structure designed to provide the most appropriate developmental environment for each age group.
            </p>
            <div className="space-y-6">
              <div className="flex gap-4 p-6 bg-[#F4F4F1] border-l-4 border-[#1E3A8A]">
                <div className="text-2xl font-black text-[#1E3A8A] opacity-20">01</div>
                <div>
                  <h4 className="font-bold text-[#1E3A8A]">GRADES 6 - 10</h4>
                  <p className="text-sm text-gray-500 font-medium">Bespoke curriculum exclusively for boys, focusing on young adolescent development.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 bg-[#F4F4F1] border-l-4 border-[#B45309]">
                <div className="text-2xl font-black text-[#B45309] opacity-20">02</div>
                <div>
                  <h4 className="font-bold text-[#B45309]">GRADES 11 - 12 (SSC)</h4>
                  <p className="text-sm text-gray-500 font-medium">Dynamic co-educational environment preparing students for university life and beyond.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative aspect-[4/5] rounded-sm border-2 border-[#1E3A8A]/10 overflow-hidden shadow-2xl">
            <img 
              src="/src/assets/images/adharchand_school_building_1779038874684.png" 
              alt="Adharchand Higher Secondary School Building" 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1E3A8A]/40 to-transparent"></div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
