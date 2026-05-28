import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Maximize2, 
  X, 
  Map, 
  Award,
  FlaskConical,
  Tv,
  Focus
} from 'lucide-react';

interface CampusArea {
  id: string;
  title: string;
  category: 'academics' | 'labs' | 'resources' | 'heritage' | 'sports';
  image: string;
  description: string;
  details: string[];
  capacity?: string;
  established: string;
}

const campusAreas: CampusArea[] = [
  {
    id: 'facade',
    title: 'Historical Campus Façade',
    category: 'heritage',
    image: '/src/assets/images/campus_historic_facade_1779956578662.png',
    description: 'The monumental legacy structure of Adharchand built during the British period in 1940, standing as a proud beacon of education in southern Assam.',
    details: [
      'Colonial-style architecture with custom high-arch colonnades',
      'Houses the historic administrative wing and founder memory archives',
      'Preserved exterior structure representing Barak Valley\'s heritage',
      'Surrounded by manicured landscaping and lush green gardens'
    ],
    established: '1940'
  },
  {
    id: 'school_building',
    title: 'Adharchand Memorial Wing',
    category: 'heritage',
    image: '/src/assets/images/adharchand_school_building_1779038874684.png',
    description: 'The core academic block of the institution hosting senior classes. It maintains a seamless architectural blend of our traditional legacy and state-of-the-art updates.',
    details: [
      'Accommodates high school and higher secondary classroom blocks',
      'Equipped with heavy timber ventilation structures and tall windows',
      'Attached student common room and counseling cells',
      'Secured main entrance with direct access to assembly grounds'
    ],
    established: '1940'
  },
  {
    id: 'science_lab',
    title: 'Dr. Radhakrishnan Science Laboratory',
    category: 'labs',
    image: '/src/assets/images/campus_science_lab_1779956597864.png',
    description: 'A fully integrated multi-discipline scientific workstation customized for experiments across Physics, Chemistry, and Biological Sciences.',
    details: [
      'Individual safe workstation blocks with gas, water, and power outlets',
      'Equipped with premium quality digital microscopes and safety ventilation hoods',
      'Rich inventory of physical models, chemical reagents, and botanical samples',
      'Maintains strict safety standards with specialized overhead emergency showers'
    ],
    capacity: '40 Students per batch',
    established: '2012 (Upgraded 2024)'
  },
  {
    id: 'library',
    title: 'Heritage Library & Archives',
    category: 'resources',
    image: '/src/assets/images/campus_library_1779956621030.png',
    description: 'A peaceful, atmospheric academic shelter storing over 15,000 volumes of historical, academic, and scientific literature.',
    details: [
      'Extensive collection of rare local histories of Southern Assam & Barak Valley',
      'Integrated computerized cataloging system (OPAC) for rapid book lookup',
      'Quiet separate reading desks illuminated with modern study lamps',
      'Subscriptions to major international science magazines and local journals'
    ],
    capacity: '80 Readers simultaneously',
    established: '1952 (Digitalized 2022)'
  },
  {
    id: 'smart_classroom',
    title: 'Interactive Smart Classroom',
    category: 'academics',
    image: '/src/assets/images/campus_smart_classroom_1779956644383.png',
    description: 'Next-generation learning spaces integrating smart multimedia screens, computer workstations, and collaborative modular study desks.',
    details: [
      'Interactive UHD touchscreen smart boards for collaborative learning',
      'Configured with enterprise educational suites and streaming links',
      'Ergonomic, flexible desk seating promoting group and individual tasking',
      'Fully air-conditioned acoustics optimized for hybrid physical-digital lessons'
    ],
    capacity: '45 Students',
    established: '2023'
  },
  {
    id: 'sports_ground',
    title: 'Adharchand Athletic Fields',
    category: 'sports',
    image: '/src/assets/images/campus_sports_ground_1779956677818.png',
    description: 'The expansive central green field on campus, supporting physical fitness, rigorous athletic training, and regional-level tournament matches.',
    details: [
      'Lush natural turf soccer and cricket grounds designed under standard dimensions',
      'Modern open-court basketball area configured with professional surface coating',
      'Full-size athletic tracks and broad jump pits on the perimeter',
      'Hosted over fifty inter-school athletic championships and district levels'
    ],
    capacity: '2,500 Spectators',
    established: '1945'
  }
];

const walkPoints = [
  {
    step: '01',
    title: 'The Platinum Archway & Gate',
    desc: 'The iconic entry gate of the campus. Flanked by historical tablets detailing the establishment of southern Assam\'s school heritage in 1940.',
    icon: Building,
  },
  {
    step: '02',
    title: 'Central Assembly Courtyard',
    desc: 'The vibrant heart of the school where daily assemblies, national flag hoisting, and physical coordination drills commence.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'The Academic Blocks',
    desc: 'Separate, well-ventilated wings hosting grades 6-10 and the specialized co-educational Higher Secondary streams.',
    icon: BookOpen,
  },
  {
    step: '04',
    title: 'Scientific Research Hub',
    desc: 'A dedicated block housing the Computer lab, the Smart Classrooms, and the state-of-the-art Science Laboratories.',
    icon: FlaskConical,
  },
  {
    step: '05',
    title: 'General Utility & Sports Pavilion',
    desc: 'Direct entrance to the athletic fields, fully-equipped gymnasium room, and the multi-purpose cultural pavilion.',
    icon: Award,
  }
];

export default function Campus() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedArea, setSelectedArea] = useState<CampusArea | null>(null);

  const filteredAreas = activeFilter === 'all' 
    ? campusAreas 
    : campusAreas.filter(area => area.category === activeFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className="pb-24"
    >
      {/* Header Banner */}
      <header className="bg-white border-b-2 border-[#1E3A8A] pt-24 pb-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#B45309] font-bold text-xs uppercase tracking-[0.3em] mb-4">Visual Journey</p>
          <h2 className="text-5xl md:text-7xl font-black text-[#1E3A8A] tracking-tighter mb-4 leading-tight">
            EXPLORE OUR<br/>CAMPUS CORRIDORS
          </h2>
          <p className="text-gray-500 font-medium text-lg max-w-xl leading-relaxed">
            Take a professional look into the physical infrastructure of Adharchand Higher Secondary School. Connecting eight decades of learning spaces with modern academic smart facilities.
          </p>
        </div>
      </header>

      {/* Main Grid and Controls */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-16">
        {/* Category Controls */}
        <div className="flex flex-wrap gap-3 mb-12 border-b border-gray-200 pb-8">
          {[
            { id: 'all', label: 'ALL SPACES' },
            { id: 'heritage', label: 'HERITAGE & WINGS' },
            { id: 'academics', label: 'ACADEMICS' },
            { id: 'labs', label: 'LABS & TECHNOLOGY' },
            { id: 'resources', label: 'RESOURCES' },
            { id: 'sports', label: 'SPORTS & LEISURE' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setActiveFilter(btn.id)}
              className={`px-6 py-3 text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all duration-300 border-2 ${
                activeFilter === btn.id 
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-md' 
                  : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-700'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <motion.div 
          layout 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence mode="popLayout">
            {filteredAreas.map((area) => (
              <motion.div
                layout
                key={area.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group bg-white border border-gray-100 hover:border-[#1E3A8A] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={area.image} 
                      alt={area.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-[#1E3A8A]/10 px-3 py-1 font-bold text-[8px] tracking-[0.2em] text-[#1E3A8A] uppercase shadow-sm">
                      Est. {area.established}
                    </div>
                    <button 
                      onClick={() => setSelectedArea(area)}
                      className="absolute bottom-4 right-4 bg-[#1E3A8A]/90 hover:bg-[#B45309] text-white p-2.5 rounded-sm shadow-md transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Enlarge details"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-8">
                    <p className="text-[10px] font-bold text-[#B45309] uppercase tracking-widest mb-2">{area.category}</p>
                    <h3 className="text-xl font-bold text-[#1E3A8A] mb-3 group-hover:text-[#B45309] transition-colors line-clamp-1">{area.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{area.description}</p>
                  </div>
                </div>
                
                <div className="px-8 pb-8 pt-2">
                  <button
                    onClick={() => setSelectedArea(area)}
                    className="w-full py-3.5 border-2 border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white text-[#1E3A8A] font-black tracking-widest text-[10px] uppercase transition-all duration-300"
                  >
                    EXPLORE INFRASTRUCTURE
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Counter Statistics section */}
      <section className="bg-[#1E3A8A] text-white mt-24 py-20 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full pointer-events-none scale-150"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'CAMPUS PLOT size', value: '5.5 Acres' },
            { label: 'INTEGRATED SMART LABS', value: '4 Modern Labs' },
            { label: 'CLASSROOM COUNT', value: '38 Rooms' },
            { label: 'LIBRARY ACQUISITIONS', value: '15,000+ Books' }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <Focus className="w-5 h-5 text-[#B45309] opacity-80 mb-3" />
              <p className="text-3xl md:text-4xl font-black mb-1">{stat.value}</p>
              <p className="text-[9px] font-bold tracking-widest text-white/60 uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Conceptual Map Walkthrough timeline */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Map className="w-8 h-8 mx-auto text-[#B45309] mb-4" />
          <h3 className="text-3xl md:text-4xl font-black text-[#1E3A8A] uppercase tracking-tight">
            VIRTUAL CAMPUS PATHWAY
          </h3>
          <p className="text-gray-500 font-medium text-sm mt-3">
            A step-by-step navigational perspective walking from our main entrance through to academic facilities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {walkPoints.map((pt, i) => {
            const Icon = pt.icon;
            return (
              <div key={i} className="bg-white border border-gray-100 p-8 hover:border-[#1E3A8A] transition-all relative group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-3xl font-black text-gray-200 group-hover:text-[#B45309] transition-colors">{pt.step}</span>
                    <Icon className="w-6 h-6 text-[#1E3A8A]" />
                  </div>
                  <h4 className="font-bold text-base text-[#1E3A8A] mb-3">{pt.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{pt.desc}</p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[9px] font-bold text-[#B45309] uppercase tracking-widest">
                  <MapPin className="w-3 h-3 text-[#B45309]" />
                  Point of Interest
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal Detail Dialog */}
      <AnimatePresence>
        {selectedArea && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#F4F4F1] border-4 border-[#1E3A8A] w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl flex flex-col md:grid md:grid-cols-12"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedArea(null)}
                className="absolute top-4 right-4 bg-white hover:bg-red-50 to-red-600 hover:text-red-600 border-2 border-[#1E3A8A] text-[#1E3A8A] p-2 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Cover Column */}
              <div className="md:col-span-6 relative h-64 md:h-full min-h-[300px]">
                <img 
                  src={selectedArea.image} 
                  alt={selectedArea.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-6 left-6 bg-[#1E3A8A] text-white px-4 py-2 font-bold text-xs uppercase tracking-widest">
                  Est. {selectedArea.established}
                </div>
              </div>

              {/* Info Column */}
              <div className="md:col-span-6 p-8 md:p-12 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-[#B45309] uppercase tracking-widest mb-3">
                    {selectedArea.category}
                  </p>
                  <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tight mb-4">
                    {selectedArea.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {selectedArea.description}
                  </p>

                  <h4 className="text-xs font-black text-[#1E3A8A] uppercase tracking-widest mb-4">
                    SPECIFICATIONS & CAPABILITIES
                  </h4>
                  <ul className="space-y-3 mb-8">
                    {selectedArea.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-500 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-gray-200/60 flex items-center justify-between">
                  {selectedArea.capacity && (
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Capacity Limit</span>
                      <span className="text-xs font-semibold text-[#1E3A8A] uppercase">{selectedArea.capacity}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedArea(null)}
                    className="ml-auto bg-[#1E3A8A] hover:bg-[#B45309] text-white px-6 py-3 font-bold text-[10px] uppercase tracking-widest transition-colors"
                  >
                    CLOSE WINDOW
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
