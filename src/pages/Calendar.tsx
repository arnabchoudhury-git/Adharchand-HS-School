import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';

interface Event {
  date: Date;
  title: string;
  category: 'ACADEMIC' | 'SPORTS' | 'HOLIDAY' | 'EVENT';
  time?: string;
  location?: string;
}

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const events: Event[] = [
    { date: new Date(2024, 4, 15), title: "Founder's Day Celebration", category: 'EVENT', time: '09:00 AM', location: 'Main Auditorium' },
    { date: new Date(2024, 4, 22), title: "Inter-House Debate Finals", category: 'ACADEMIC', time: '11:30 AM', location: 'Library Annex' },
    { date: new Date(2024, 4, 28), title: "Faculty Development Workshop", category: 'EVENT', time: '08:00 AM', location: 'Conference Room' },
    { date: new Date(2024, 5, 5), title: "World Environment Day", category: 'EVENT' },
    { date: new Date(2024, 5, 10), title: "Summer Selection Trials: Cricket", category: 'SPORTS', time: '03:30 PM', location: 'School Ground' },
    { date: new Date(2024, 5, 15), title: "Quarterly Assessment Begins", category: 'ACADEMIC' },
  ];

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center bg-white border-b-2 border-[#1E3A8A] p-8">
        <div>
          <p className="text-[#B45309] font-bold text-xs uppercase tracking-[0.3em] mb-2">School Timeline</p>
          <h2 className="text-4xl font-black text-[#1E3A8A] uppercase tracking-tighter italic">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={prevMonth}
            className="p-3 bg-[#F4F4F1] hover:bg-[#1E3A8A] hover:text-white transition-all border border-gray-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-3 bg-[#F4F4F1] hover:bg-[#1E3A8A] hover:text-white transition-all border border-gray-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return (
      <div className="grid grid-cols-7 bg-[#1E3A8A] text-white">
        {days.map((day, i) => (
          <div key={i} className="py-4 text-center text-[10px] font-black tracking-[0.2em]">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-100 border-x border-b border-gray-100">
        {days.map((day, i) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const dayEvents = events.filter(e => isSameDay(e.date, day));

          return (
            <div
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[120px] p-4 bg-white cursor-pointer transition-all hover:bg-[#F4F4F1] group relative ${
                !isCurrentMonth ? 'text-gray-300' : 'text-[#1E3A8A]'
              } ${isSelected ? 'ring-2 ring-inset ring-[#1E3A8A] z-10' : ''}`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-xl font-black ${isCurrentMonth ? '' : 'opacity-30'}`}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && isCurrentMonth && (
                  <div className="w-1.5 h-1.5 bg-[#B45309] rounded-full"></div>
                )}
              </div>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((event, idx) => (
                  <div 
                    key={idx} 
                    className={`text-[9px] font-bold p-1 truncate rounded-sm leading-none ${
                        event.category === 'HOLIDAY' ? 'bg-red-100 text-red-600' :
                        event.category === 'ACADEMIC' ? 'bg-blue-100 text-[#1E3A8A]' :
                        event.category === 'SPORTS' ? 'bg-green-100 text-green-600' :
                        'bg-amber-100 text-[#B45309]'
                    }`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[8px] font-bold text-gray-400">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getEventForSelectedDate = () => {
    return events.filter(e => isSameDay(e.date, selectedDate));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-24 max-w-7xl mx-auto px-6 md:px-12 mt-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-2 border-[#1E3A8A]">
        {/* Main Calendar View */}
        <div className="lg:col-span-8 bg-white border-r-2 border-[#1E3A8A]">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>

        {/* Event Detail Sidebar */}
        <div className="lg:col-span-4 bg-[#F4F4F1] p-8 md:p-12 flex flex-col">
          <div className="mb-12">
            <h3 className="text-xs font-bold text-[#B45309] tracking-[0.4em] uppercase mb-4">Agenda</h3>
            <div className="flex items-baseline gap-4">
              <span className="text-6xl font-black text-[#1E3A8A]">{format(selectedDate, 'dd')}</span>
              <div>
                <p className="text-sm font-bold text-[#1E3A8A] uppercase tracking-widest">{format(selectedDate, 'EEEE')}</p>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{format(selectedDate, 'MMMM yyyy')}</p>
              </div>
            </div>
          </div>

          <div className="flex-grow space-y-8">
            {getEventForSelectedDate().length > 0 ? (
              getEventForSelectedDate().map((event, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="bg-white p-6 border-l-4 border-[#1E3A8A] shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest ${
                         event.category === 'HOLIDAY' ? 'bg-red-100 text-red-600' :
                         event.category === 'ACADEMIC' ? 'bg-blue-100 text-[#1E3A8A]' :
                         'bg-amber-100 text-[#B45309]'
                    }`}>
                      {event.category}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-[#1E3A8A] mb-4">{event.title}</h4>
                  <div className="space-y-2">
                    {event.time && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                        <Clock className="w-3.5 h-3.5 text-[#B45309]" />
                        {event.time}
                      </div>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[#B45309]" />
                        {event.location}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-12">
                <CalendarIcon className="w-16 h-16 mb-4" />
                <p className="text-xs font-bold tracking-widest uppercase">No events scheduled<br/>for this date</p>
              </div>
            )}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <button className="w-full bg-[#1E3A8A] text-white px-6 py-4 font-bold text-[10px] tracking-[0.2em] hover:bg-[#162d6b] transition-all flex items-center justify-center gap-3">
              SYNC TO PERSONAL CALENDAR
            </button>
          </div>
        </div>
      </div>

      {/* Legend / Info */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { label: 'ACADEMIC DATES', color: 'bg-blue-100 border-blue-200' },
          { label: 'SCHOOL HOLIDAYS', color: 'bg-red-100 border-red-200' },
          { label: 'SPORTS & ATHLETICS', color: 'bg-green-100 border-green-200' },
          { label: 'CULTURAL EVENTS', color: 'bg-amber-100 border-amber-200' },
        ].map((item, idx) => (
          <div key={idx} className={`p-4 border-l-4 ${item.color} flex items-center gap-4`}>
            <span className="text-[10px] font-black tracking-widest text-[#1E3A8A]">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
