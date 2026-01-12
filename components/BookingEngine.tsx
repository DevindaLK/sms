
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
// Added: Import supabase directly for authentication checks to resolve property error on api object
import { supabase } from '../lib/supabase';
import { 
  Check, Calendar, User as UserIcon, Clock, Scissors, Info, X, 
  ShieldCheck, ChevronLeft, ChevronRight, Sparkles, Lock, RefreshCw,
  Sun, Sunset, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingEngineProps {
  isAuthenticated: boolean;
  onAuthRedirect: () => void;
  onSuccess?: (view: string) => void;
  editingAppointment?: any;
}

const BookingEngine: React.FC<BookingEngineProps> = ({ isAuthenticated, onAuthRedirect, onSuccess, editingAppointment }) => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [artisans, setArtisans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);

  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isConfirmingFinal, setIsConfirmingFinal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [srvsRes, arts] = await Promise.all([
          api.getServices(1, 100),
          api.getArtisans()
        ]);
        const srvs = srvsRes.data;
        setServices(srvs);
        setArtisans(arts);

        // Fetch user points if authenticated
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const profile = await api.getProfile(session.user.id);
          setUserPoints(profile?.glow_points || 0);
        }

        // If editing, initialize state
        if (editingAppointment) {
          const service = srvs.find((s: any) => s.id === editingAppointment.service_id);
          const artisan = arts.find((a: any) => a.id === editingAppointment.stylist_id);
          setSelectedService(service);
          setSelectedStylist(artisan);
          const date = new Date(editingAppointment.start_time);
          setSelectedDate(new Date(date.setHours(0,0,0,0)));
          const time = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          setSelectedTime(time);
          setStep(3); // Jump to date/time selection
        }
      } catch (err) {
        console.error("Failed to load booking data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [editingAppointment]);

  // Fetch occupied slots when date or stylist changes
  useEffect(() => {
    const fetchOccupied = async () => {
      if (!selectedDate || !selectedStylist) return;
      setLoadingSlots(true);
      try {
        const { data } = await api.getAppointments({
          stylist_id: selectedStylist.id,
          date: selectedDate.toISOString()
        }, 1, 1000);
        setExistingAppointments(data || []);
      } catch (err) {
        console.error("Failed to fetch existing appointments:", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchOccupied();
  }, [selectedDate, selectedStylist]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }, [currentMonth]);

  const slotsData = useMemo(() => {
    if (!selectedDate || !selectedStylist) return { morning: [], afternoon: [], evening: [] };
    
    const dayOfWeek = selectedDate.getDay();
    const workingHours = selectedStylist.working_hours || { start: '09:00', end: '18:00' };
    const daysOff = selectedStylist.days_off || [];

    if (daysOff.includes(dayOfWeek)) return { morning: [], afternoon: [], evening: [] };

    const morning: any[] = [];
    const afternoon: any[] = [];
    const evening: any[] = [];
    
    const [startH, startM] = workingHours.start.split(':').map(Number);
    const [endH, endM] = workingHours.end.split(':').map(Number);

    let current = new Date(selectedDate);
    current.setHours(startH, startM, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
      const timeString = current.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Simple overlap check
      const currentTimestamp = current.getTime();
      const isOccupied = existingAppointments.some(apt => {
        const aptStart = new Date(apt.start_time).getTime();
        const aptEnd = new Date(apt.end_time).getTime();
        return currentTimestamp >= aptStart && currentTimestamp < aptEnd;
      });

      const slot = { time: timeString, timestamp: currentTimestamp, isOccupied };
      const hour = current.getHours();

      if (hour < 12) morning.push(slot);
      else if (hour < 17) afternoon.push(slot);
      else evening.push(slot);

      current.setMinutes(current.getMinutes() + 30);
    }
    return { morning, afternoon, evening };
  }, [selectedDate, selectedStylist, existingAppointments]);

  const handleBookingRequest = () => {
    if (!isAuthenticated) {
      alert("Registration Required: Please sign up to book a service.");
      onAuthRedirect();
      return;
    }
    setIsConfirmingFinal(true);
  };

  const finalizeBooking = async () => {
    try {
      if (!selectedService || !selectedStylist || !selectedDate || !selectedTime) return;

      const startTime = new Date(selectedDate);
      const [time, period] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + selectedService.duration_minutes);

      // Fixed: Access supabase directly from lib/supabase instead of api.supabase on line 152
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const finalPrice = usePoints ? selectedService.price * 0.8 : selectedService.price;

      const appointmentData = {
        customer_id: session.user.id,
        stylist_id: selectedStylist.id,
        service_id: selectedService.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending',
        total_price: finalPrice,
        is_redeemed: usePoints
      };

      if (editingAppointment) {
        await api.updateAppointment(editingAppointment.id, appointmentData);
        toast.success(`Ritual Manifestation Updated.`);
      } else {
        await api.createAppointment(appointmentData);
        toast.success(`Ritual Scheduled. Welcome to PAWA.`);
      }
      setIsConfirmingFinal(false);
      setStep(1);
      setSelectedService(null);
      setSelectedStylist(null);
      setSelectedDate(null);
      setSelectedTime('');
      if (onSuccess) onSuccess('history');
    } catch (err) {
      console.error(err);
      toast.error("Scheduling error. Our oracle is silent.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <RefreshCw className="w-10 h-10 text-atelier-clay animate-spin" />
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-atelier-taupe">Loading Services...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-atelier-charcoal uppercase">
            Service <span className="font-bold text-atelier-clay">Scheduler</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            Book your next appointment
          </p>
        </div>
        <div className="flex items-center space-x-4 bg-white p-2 rounded-[30px] border border-atelier-sand shadow-sm">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${step >= s ? 'border-atelier-clay bg-atelier-charcoal text-white shadow-xl' : 'border-atelier-sand text-atelier-taupe'}`}>
              {step > s ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">{s}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[80px] p-12 shadow-sm border border-atelier-sand min-h-[600px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-atelier-nude/20 rounded-full blur-[100px] -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-10"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-atelier-nude p-4 rounded-3xl shadow-sm"><Scissors className="w-6 h-6 text-atelier-clay" /></div>
                <div>
                  <h3 className="text-xl font-bold text-atelier-charcoal uppercase tracking-widest">Service Selection</h3>
                  <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">Select a service for your session</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedService(s); setStep(2); }}
                    className="flex justify-between items-center p-8 border border-atelier-sand rounded-[40px] hover:border-atelier-clay hover:bg-atelier-cream transition-all text-left group bg-atelier-cream/20 shadow-sm hover:shadow-xl hover:shadow-atelier-clay/5"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-atelier-charcoal group-hover:text-atelier-clay transition-colors uppercase tracking-widest text-sm">{s.name}</p>
                      <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-[0.2em]">{s.duration_minutes} mins • {s.category}</p>
                    </div>
                    <span className="text-xl font-light text-atelier-clay tracking-tighter">Rs.{s.price}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <button onClick={() => setStep(1)} className="text-atelier-clay text-[10px] font-bold hover:underline flex items-center gap-2 uppercase tracking-widest">
                <ChevronLeft className="w-4 h-4" /> Return to Services
              </button>
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-atelier-nude p-4 rounded-3xl shadow-sm"><UserIcon className="w-6 h-6 text-atelier-clay" /></div>
                <div>
                  <h3 className="text-xl font-bold text-atelier-charcoal uppercase tracking-widest">Select Stylist</h3>
                  <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">Choose your preferred stylist</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {artisans.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStylist(s); setStep(3); }}
                    className="flex flex-col items-center p-12 border border-atelier-sand rounded-[60px] hover:border-atelier-clay hover:bg-atelier-cream transition-all group bg-atelier-cream/10 shadow-sm hover:shadow-2xl"
                  >
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-atelier-clay/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img 
                        src={s.avatar_url || 'https://via.placeholder.com/150'} 
                        alt={s.full_name} 
                        className="w-32 h-32 rounded-full object-cover border-[10px] border-white shadow-xl grayscale group-hover:grayscale-0 transition-all duration-1000 relative z-10" 
                      />
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-atelier-sage border-4 border-white rounded-full z-20"></div>
                    </div>
                    <p className="font-bold text-atelier-charcoal group-hover:text-atelier-clay uppercase tracking-[0.2em] text-sm text-center">{s.full_name}</p>
                    <p className="text-[9px] text-atelier-taupe uppercase tracking-[0.3em] font-black mt-3">Senior Stylist</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-10"
            >
              <button onClick={() => setStep(2)} className="text-atelier-clay text-[10px] font-bold hover:underline flex items-center gap-2 uppercase tracking-widest">
                <ChevronLeft className="w-4 h-4" /> Return to Stylists
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Visual Calendar */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-light text-atelier-charcoal uppercase tracking-[0.2em]">
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-3">
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-4 hover:bg-atelier-cream rounded-full transition-colors border border-atelier-sand"><ChevronLeft className="w-4 h-4 text-atelier-taupe" /></button>
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-4 hover:bg-atelier-cream rounded-full transition-colors border border-atelier-sand"><ChevronRight className="w-4 h-4 text-atelier-taupe" /></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-3 text-center mb-6">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <span key={d} className="text-[10px] font-black uppercase text-atelier-sand tracking-widest">{d}</span>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-3">
                    {calendarDays.map((date, i) => {
                      if (!date) return <div key={`pad-${i}`} className="aspect-square"></div>;
                      const active = selectedDate && date.toDateString() === selectedDate.toDateString();
                      const isOff = selectedStylist?.days_off?.includes(date.getDay());
                      const isPast = date < new Date(new Date().setHours(0,0,0,0));
                      
                      return (
                        <button
                          key={i}
                          disabled={isOff || isPast}
                          onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                          className={`
                            aspect-square flex flex-col items-center justify-center rounded-[24px] text-[11px] font-bold transition-all relative group
                            ${active ? 'bg-atelier-charcoal text-white shadow-2xl scale-110 z-10' : 'hover:bg-atelier-nude text-atelier-taupe bg-atelier-cream/50'} 
                            ${(isOff || isPast) ? 'opacity-10 cursor-not-allowed grayscale' : 'cursor-pointer'}
                          `}
                        >
                          {date.getDate()}
                          {active && (
                            <motion.div layoutId="cal-dot" className="absolute bottom-2 w-1.5 h-1.5 bg-atelier-clay rounded-full" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection */}
                <div className="lg:col-span-5 space-y-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-atelier-charcoal flex items-center gap-3 uppercase tracking-widest">
                      <Clock className="w-5 h-5 text-atelier-clay" /> Availability
                    </h3>
                    {loadingSlots && <RefreshCw className="w-4 h-4 text-atelier-clay animate-spin" />}
                  </div>

                  {!selectedDate ? (
                    <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-6 bg-atelier-cream/20 rounded-[50px] border-2 border-dashed border-atelier-sand p-10">
                      <Calendar className="w-12 h-12 text-atelier-sand" />
                      <div>
                        <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-[0.3em]">Awaiting Date Selection</p>
                        <p className="text-[9px] text-atelier-sand uppercase tracking-widest mt-2">Select a date to view available times</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 max-h-[450px] overflow-y-auto pr-6 custom-scrollbar pb-10">
                      {/* Slot Groups */}
                      {[
                        { title: 'Morning', icon: Sun, slots: slotsData.morning },
                        { title: 'Afternoon', icon: Sunset, slots: slotsData.afternoon },
                        { title: 'Evening', icon: Moon, slots: slotsData.evening }
                      ].map(group => group.slots.length > 0 && (
                        <div key={group.title} className="space-y-4">
                          <div className="flex items-center gap-2 border-b border-atelier-sand pb-2">
                            <group.icon className="w-3.5 h-3.5 text-atelier-clay" />
                            <span className="text-[9px] font-black text-atelier-sand uppercase tracking-[0.3em]">{group.title} Slots</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {group.slots.map(s => (
                              <button
                                key={s.time}
                                disabled={s.isOccupied}
                                onClick={() => {
                                  if (s.isOccupied) {
                                    toast.error("This slot is already manifested by another participant.");
                                    return;
                                  }
                                  setSelectedTime(s.time);
                                }}
                                className={`
                                  p-5 text-[10px] font-bold rounded-2xl border-2 transition-all flex items-center justify-center gap-2 uppercase tracking-widest
                                  ${s.isOccupied 
                                    ? 'bg-atelier-cream border-atelier-cream text-atelier-sand cursor-not-allowed opacity-40 line-through' 
                                    : selectedTime === s.time 
                                      ? 'bg-atelier-clay border-atelier-clay text-white shadow-xl scale-[1.02]' 
                                      : 'border-atelier-sand hover:border-atelier-clay bg-white text-atelier-charcoal shadow-sm'
                                  }
                                `}
                              >
                                {s.time}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {slotsData.morning.length === 0 && slotsData.afternoon.length === 0 && slotsData.evening.length === 0 && (
                        <div className="text-center py-10 space-y-4">
                          <Info className="w-8 h-8 text-atelier-sand mx-auto" />
                          <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">Stylist is unavailable on this day</p>
                        </div>
                      )}
                    </div>
                  )}

                  <AnimatePresence>
                    {selectedDate && selectedTime && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-atelier-charcoal p-10 rounded-[50px] text-white shadow-2xl space-y-6 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-atelier-clay/20 rounded-full blur-3xl" />
                        <div className="relative z-10">
                          <p className="text-[9px] font-black uppercase text-atelier-clay tracking-[0.4em] mb-3">Booking Confirmation</p>
                          <p className="text-xl font-light tracking-tight italic">
                            {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} @ {selectedTime}
                          </p>
                          <p className="text-[10px] text-atelier-sand/50 uppercase tracking-widest mt-2">Duration: {selectedService?.duration_minutes} Minutes</p>
                        </div>
                        
                        {!isAuthenticated && (
                          <div className="flex items-center gap-3 p-5 bg-white/5 rounded-2xl border border-white/10 relative z-10">
                            <Lock className="w-4 h-4 text-atelier-clay" />
                            <p className="text-[9px] font-bold uppercase tracking-widest text-atelier-sand">Identity verification required</p>
                          </div>
                        )}
                        
                        {userPoints >= 100 ? (
                          <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 relative z-10 transition-all hover:bg-white/10">
                            <div className="flex items-center gap-3">
                              <Sparkles className="w-4 h-4 text-atelier-clay" />
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white">GlowPoints Reward Available</p>
                                <p className="text-[8px] text-atelier-sand/60 uppercase tracking-widest">Redeem 100 for 20% off</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => setUsePoints(!usePoints)}
                              className={`w-12 h-6 rounded-full transition-all relative ${usePoints ? 'bg-atelier-clay' : 'bg-white/10'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${usePoints ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 relative z-10 opacity-60">
                            <div className="flex items-center gap-3">
                              <Sparkles className="w-4 h-4 text-atelier-sand" />
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-atelier-sand">GlowPoints Progress</p>
                                <p className="text-[8px] text-atelier-sand/60 uppercase tracking-widest">{userPoints}/100 points collected</p>
                              </div>
                            </div>
                            <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-atelier-sand" style={{ width: `${userPoints}%` }} />
                            </div>
                          </div>
                        )}
                        
                        <button 
                          onClick={handleBookingRequest} 
                          className={`
                            w-full py-6 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-2 shadow-2xl relative z-10
                            ${isAuthenticated ? 'bg-white text-atelier-charcoal hover:bg-atelier-clay hover:text-white' : 'bg-atelier-clay text-white hover:scale-[1.02]'}
                          `}
                        >
                          {isAuthenticated ? (usePoints ? `Confirm with 20% Discount` : 'Confirm Appointment') : 'Sign Up to Book'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isConfirmingFinal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-atelier-charcoal/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[80px] shadow-2xl max-w-xl w-full overflow-hidden border border-atelier-sand p-1"
            >
              <div className="p-12 space-y-12">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-atelier-clay uppercase tracking-[0.4em]">Booking Summary</p>
                  <button onClick={() => setIsConfirmingFinal(false)} className="p-3 hover:bg-atelier-cream rounded-full transition-colors border border-atelier-sand">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-atelier-nude rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Sparkles className="w-10 h-10 text-atelier-clay" />
                  </div>
                  <h3 className="text-4xl font-light text-atelier-charcoal tracking-tighter">Your Appointment is <span className="font-bold italic text-atelier-clay">Ready.</span></h3>
                  <p className="text-atelier-taupe text-sm">Please review the details of your session below.</p>
                </div>

                <div className="bg-atelier-cream rounded-[50px] p-10 space-y-8 border border-atelier-sand relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-atelier-clay/5 rounded-full blur-2xl" />
                  <div className="flex justify-between items-end border-b border-atelier-sand pb-8 relative z-10">
                    <div>
                      <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest mb-2">Service</p>
                      <p className="font-bold text-atelier-charcoal uppercase tracking-widest text-base">{selectedService?.name}</p>
                      {usePoints && <p className="text-[8px] text-atelier-sage font-black uppercase tracking-widest mt-1">20% GlowPoints Reward Applied</p>}
                    </div>
                    <div className="text-right">
                      {usePoints && <p className="text-[10px] text-atelier-sand line-through">Rs.{selectedService?.price}</p>}
                      <p className="text-3xl font-light text-atelier-clay tracking-tighter">
                        Rs.{usePoints ? (selectedService?.price * 0.8).toFixed(2) : selectedService?.price}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-10 pt-2 relative z-10">
                    <div>
                      <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest mb-2">Stylist</p>
                      <p className="font-bold text-atelier-charcoal text-xs uppercase tracking-widest">{selectedStylist?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest mb-2">Appointment Time</p>
                      <p className="font-bold text-atelier-charcoal text-xs uppercase tracking-widest">
                        {selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} @ {selectedTime}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <button 
                    onClick={finalizeBooking} 
                    className="w-full bg-atelier-charcoal text-white py-7 rounded-[32px] font-bold uppercase tracking-[0.4em] text-[11px] shadow-2xl hover:bg-atelier-clay transition-all flex items-center justify-center gap-4"
                  >
                    <ShieldCheck className="w-6 h-6 text-atelier-clay" /> Confirm Appointment
                  </button>
                  <button onClick={() => setIsConfirmingFinal(false)} className="w-full text-atelier-taupe py-2 text-[10px] font-bold uppercase tracking-widest hover:text-atelier-charcoal transition-colors">
                    Revisit Selection
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingEngine;