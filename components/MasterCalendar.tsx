
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, User as UserIcon, Scissors, Filter, MoreHorizontal, 
  Search, Plus, CheckCircle, AlertCircle, RefreshCw, X, Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import BookingEngine from './BookingEngine';

interface MasterCalendarProps {
  role?: string;
}

const MasterCalendar: React.FC<MasterCalendarProps> = ({ role = 'admin' }) => {
  const isStylist = role === 'stylist';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'day'>('month');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.getAppointments(null, 1, 1000); // Get more for calendar view
      setAppointments(data || []);
    } catch (e) {
      toast.error("Failed to load ritual timeline");
    } finally {
      setLoading(false);
    }
  };

  const approveAppointment = async (id: string) => {
    try {
      await api.updateAppointmentStatus(id, 'confirmed');
      toast.success("Ritual confirmed and woven into the timeline");
      fetchData();
    } catch (err) {
      toast.error("Failed to manifest approval");
    }
  };

  const selectedDayAppointments = useMemo(() => {
    const dStr = selectedDate.toISOString().split('T')[0];
    return appointments.filter(apt => apt.start_time.split('T')[0] === dStr);
  }, [selectedDate, appointments]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();
    
    const days = [];
    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }
    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }
    return days;
  }, [currentDate]);

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getDate() === d2.getDate() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getFullYear() === d2.getFullYear();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            Master <span className="font-bold text-atelier-clay italic">Calendar</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            The complete visual ritual timeline
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-[30px] border border-atelier-sand shadow-sm">
          <button 
            onClick={() => setView('month')}
            className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'month' ? 'bg-atelier-charcoal text-white shadow-lg' : 'text-atelier-sand hover:text-atelier-clay'}`}
          >
            Month
          </button>
          <button 
            onClick={() => setView('day')}
            className={`px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'day' ? 'bg-atelier-charcoal text-white shadow-lg' : 'text-atelier-sand hover:text-atelier-clay'}`}
          >
            Day
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[60px] p-10 border border-atelier-sand shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-6">
                <h3 className="text-xl font-light text-atelier-charcoal uppercase tracking-widest">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 hover:bg-atelier-cream rounded-full transition-colors border border-atelier-sand"><ChevronLeft className="w-4 h-4"/></button>
                  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 hover:bg-atelier-cream rounded-full transition-colors border border-atelier-sand"><ChevronRight className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-atelier-sand" />
                  <input type="text" placeholder="Find Ritual..." className="bg-atelier-cream border-none rounded-full py-2.5 pl-10 pr-6 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-atelier-clay w-48" />
                </div>
                {!isStylist && (
                  <button 
                    onClick={() => setIsBooking(true)}
                    className="bg-atelier-clay text-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg"
                  >
                    <Plus className="w-4 h-4"/>
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {view === 'month' ? (
                <motion.div 
                  key="month-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-7 gap-px bg-atelier-sand/30 border border-atelier-sand rounded-[40px] overflow-hidden"
                >
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-atelier-cream py-4 text-center text-[9px] font-black uppercase text-atelier-sand tracking-[0.3em]">{day}</div>
                  ))}
                  {calendarDays.map((d, i) => {
                    const isSelected = isSameDay(d.date, selectedDate);
                    const dStr = d.date.toISOString().split('T')[0];
                    const dayAppointments = appointments.filter(apt => apt.start_time.split('T')[0] === dStr);
                    const hasAppointments = dayAppointments.length > 0;
                    
                    return (
                      <button
                        key={i}
                        onClick={() => { setSelectedDate(d.date); setView('day'); }}
                        className={`
                          relative aspect-square bg-white p-4 transition-all hover:bg-atelier-cream flex flex-col items-center justify-center group
                          ${!d.currentMonth ? 'opacity-20' : 'opacity-100'}
                          ${isSelected ? 'bg-atelier-cream ring-2 ring-inset ring-atelier-clay z-10' : ''}
                        `}
                      >
                        <span className={`text-xs font-bold mb-1 ${isSelected ? 'text-atelier-clay scale-125' : 'text-atelier-taupe'} transition-transform`}>
                          {d.day}
                        </span>
                        {hasAppointments && d.currentMonth && (
                          <div className="flex gap-0.5 mt-1">
                            {dayAppointments.slice(0, 3).map((_, idx) => (
                               <div key={idx} className="w-1 h-1 bg-atelier-clay rounded-full"></div>
                            ))}
                          </div>
                        )}
                        {isSelected && (
                          <motion.div layoutId="activeDay" className="absolute bottom-3 w-1.5 h-1.5 bg-atelier-clay rounded-full" />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  key="day-view"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, type: 'spring', damping: 25 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between px-6 pb-6 border-b border-atelier-sand/50">
                    <h4 className="text-xl font-light text-atelier-charcoal uppercase tracking-[0.2em]">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h4>
                    <span className="text-[10px] font-black text-atelier-clay uppercase tracking-widest bg-atelier-nude px-4 py-2 rounded-full">
                      {selectedDayAppointments.length} Ritual{selectedDayAppointments.length !== 1 ? 's' : ''} Found
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar p-2">
                    {selectedDayAppointments.length > 0 ? (
                      selectedDayAppointments.map((apt) => (
                        <div key={apt.id} className="bg-atelier-cream/30 border border-atelier-sand/50 rounded-[32px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:bg-white hover:shadow-xl hover:shadow-atelier-clay/5 transition-all">
                          <div className="flex items-center gap-8">
                             <div className="text-center min-w-[100px] py-4 px-6 bg-white rounded-3xl border border-atelier-sand shadow-sm group-hover:border-atelier-clay transition-colors">
                                <p className="text-[10px] font-black text-atelier-sand uppercase tracking-widest mb-1">Ritual Time</p>
                                <p className="text-xl font-light text-atelier-clay tracking-tight">
                                  {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                             </div>
                             <div className="h-10 w-px bg-atelier-sand opacity-50 hidden md:block" />
                             <div className="space-y-2">
                               <p className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.3em]">
                                 {apt.service?.name}
                               </p>
                               <h5 className="text-lg font-bold text-atelier-charcoal uppercase tracking-widest">{apt.customer?.full_name || 'Guest Participant'}</h5>
                               <div className="flex items-center gap-6 mt-2">
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-atelier-taupe uppercase tracking-widest">
                                    <UserIcon className="w-3.5 h-3.5 text-atelier-clay" />
                                    {apt.artisan?.full_name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-atelier-taupe uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5 text-atelier-clay" />
                                    {apt.service?.duration_minutes} Mins
                                  </div>
                               </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className={`px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                              apt.status === 'confirmed' ? 'bg-atelier-clay text-white shadow-lg shadow-atelier-clay/20' : 
                              apt.status === 'pending' ? 'bg-atelier-sage text-atelier-charcoal' : 'bg-atelier-taupe/10 text-atelier-taupe'
                            }`}>
                              {apt.status === 'pending' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                              {apt.status}
                            </span>
                            {apt.is_redeemed && (
                              <span className="px-4 py-2 bg-atelier-nude text-atelier-clay rounded-full text-[8px] font-black uppercase tracking-widest border border-atelier-sand flex items-center gap-2">
                                <Sparkles className="w-3 h-3" /> Reward Used
                              </span>
                            )}
                            {!isStylist && apt.status === 'pending' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); approveAppointment(apt.id); }}
                                className="p-4 bg-atelier-clay text-white hover:bg-atelier-charcoal rounded-2xl transition-all shadow-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                              >
                                <CheckCircle className="w-4 h-4" /> Approve
                              </button>
                            )}
                            {!isStylist && (
                              <button className="p-4 bg-white text-atelier-sand hover:text-atelier-clay border border-atelier-sand hover:border-atelier-clay rounded-2xl transition-all shadow-sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-32 space-y-6">
                        <CalendarIcon className="w-16 h-16 text-atelier-sand/20 mx-auto" />
                        <div>
                          <p className="text-[10px] font-black text-atelier-taupe uppercase tracking-[0.4em]">Tranquil Timeline</p>
                          <p className="text-sm text-atelier-sand italic mt-2">No rituals are manifesting on this specific day.</p>
                        </div>
                        <button 
                          onClick={() => setIsBooking(true)}
                          className="px-10 py-4 bg-atelier-charcoal text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-atelier-clay transition-all shadow-xl"
                        >
                          Initiate Ritual
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Ritual Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-atelier-charcoal rounded-[50px] p-8 text-white h-full shadow-2xl flex flex-col">
            <div className="mb-10">
              <p className="text-atelier-sand/50 text-[9px] font-black uppercase tracking-[0.4em] mb-2">Focused Rituals</p>
              <h3 className="text-xl font-light italic text-white tracking-tight">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </h3>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              {selectedDayAppointments.map((apt) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={apt.id} 
                  className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4 hover:bg-white/10 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-atelier-clay/20 flex items-center justify-center text-atelier-clay">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-atelier-clay uppercase tracking-widest">
                          {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-sm font-bold text-white uppercase tracking-widest mt-0.5 line-clamp-1">{apt.customer?.full_name || 'Guest'}</p>
                      </div>
                    </div>
                    <button className="text-atelier-sand opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4"/></button>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-3 text-atelier-sand/70">
                      <Scissors className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate">{apt.service?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-atelier-sand/70">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest truncate">{apt.artisan?.full_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                      apt.status === 'confirmed' ? 'bg-atelier-clay text-white' : 
                      apt.status === 'pending' ? 'bg-atelier-sage text-atelier-charcoal' : 'bg-white/10 text-atelier-sand'
                    }`}>
                      {/* Added RefreshCw to resolve missing name error on line 188 */}
                      {apt.status === 'pending' ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle className="w-2.5 h-2.5" />}
                      {apt.status}
                    </span>
                    {apt.is_redeemed && (
                      <span className="px-3 py-1 bg-atelier-nude/30 text-atelier-clay rounded-full text-[7px] font-black uppercase tracking-widest border border-atelier-sand/20">
                        <Sparkles className="w-2.5 h-2.5 inline mr-1" /> Reward
                      </span>
                    )}
                    {!isStylist && <button className="text-atelier-clay text-[9px] font-black uppercase tracking-widest hover:underline underline-offset-4">Manage</button>}
                  </div>
                </motion.div>
              ))}
              
              {selectedDayAppointments.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-center p-8 space-y-4 border-2 border-dashed border-white/10 rounded-[40px]">
                  <AlertCircle className="w-10 h-10 text-white/10" />
                  <p className="text-[10px] text-atelier-sand/30 font-bold uppercase tracking-[0.3em]">No rituals scheduled for this day</p>
                </div>
              )}
            </div>


            {!isStylist && (
              <button 
                onClick={() => setIsBooking(true)}
                className="w-full py-5 mt-8 bg-white text-atelier-charcoal rounded-3xl font-bold uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-atelier-clay hover:text-white transition-all"
              >
                Initiate New Ritual
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal Overlay */}
      <AnimatePresence>
        {isBooking && (
          <div className="fixed inset-0 z-[100] bg-atelier-charcoal/60 backdrop-blur-xl flex items-center justify-center p-8 overflow-y-auto">
            <div className="bg-white rounded-[80px] w-full max-w-6xl p-1 relative shadow-2xl">
               <button 
                onClick={() => setIsBooking(false)}
                className="absolute top-12 right-12 z-[110] p-4 bg-atelier-cream hover:bg-atelier-nude rounded-full transition-all border border-atelier-sand"
               >
                 <X className="w-6 h-6 text-atelier-charcoal" />
               </button>
               <div className="p-12 overflow-y-auto max-h-[90vh]">
                  <BookingEngine 
                    isAuthenticated={true} 
                    onAuthRedirect={() => {}} 
                    onSuccess={() => {
                      setIsBooking(false);
                      fetchData();
                    }}
                  />
               </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MasterCalendar;
