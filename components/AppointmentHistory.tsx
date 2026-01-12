import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, CheckCircle, Clock, Calendar, 
  RefreshCw, Sparkles, ChevronRight, Eye,
  AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AppointmentHistoryProps {
  onViewChange?: (view: string, data?: any) => void;
}

const AppointmentHistory: React.FC<AppointmentHistoryProps> = ({ onViewChange }) => {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedAppointment, setSelectedAppointment] = React.useState<any>(null);
  const [stats, setStats] = React.useState({ perfectedCount: 0, totalSpend: 0 });
  const [userPoints, setUserPoints] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<'active' | 'history'>('active');

  React.useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await api.getAppointments({ customer_id: session.user.id }, 1, 1000);
      setHistory(data || []);

      const [customerStats, profile] = await Promise.all([
        api.getCustomerStats(session.user.id),
        api.getProfile(session.user.id)
      ]);
      setStats(customerStats);
      setUserPoints(profile?.glow_points || 0);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      toast.error("Failed to recall your ritual history");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you wish to dissolve this ritual from your timeline?")) return;
    try {
      await api.deleteAppointment(id);
      toast.success("Ritual dissolved successfully");
      fetchHistory();
    } catch (err) {
      toast.error("Failed to dissolve ritual");
    }
  };

  const handleRebook = (appointment: any) => {
    if (onViewChange) {
      onViewChange('book', appointment);
      toast.success("Opening the Ritual Sanctuary for adjustment...");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return { 
          bg: 'bg-atelier-sage/20', 
          text: 'text-atelier-sage', 
          icon: CheckCircle2,
          label: 'Ritual Confirmed'
        };
      case 'completed':
        return { 
          bg: 'bg-atelier-clay/20', 
          text: 'text-atelier-clay', 
          icon: CheckCircle,
          label: 'Art Completed'
        };
      case 'cancelled':
        return { 
          bg: 'bg-red-50', 
          text: 'text-red-500', 
          icon: XCircle,
          label: 'Ritual Halted'
        };
      default:
        return { 
          bg: 'bg-amber-50 animate-pulse', 
          text: 'text-amber-600', 
          icon: Clock,
          label: 'PENDING SALON APPROVAL'
        };
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <RefreshCw className="w-10 h-10 text-atelier-clay animate-spin" />
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-atelier-taupe">Recalling Rituals...</p>
    </div>
  );

  const activeRituals = history.filter(item => ['pending', 'confirmed'].includes(item.status));
  const pastChronicles = history.filter(item => ['completed', 'cancelled'].includes(item.status));
  const displayRituals = activeTab === 'active' ? activeRituals : pastChronicles;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            Appointment <span className="font-bold text-atelier-clay italic">Chronicles</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            Track your past and upcoming style sessions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-atelier-cream p-1.5 rounded-2xl border border-atelier-sand">
            <button 
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white text-atelier-clay shadow-sm border border-atelier-sand' : 'text-atelier-taupe hover:text-atelier-charcoal'}`}
            >
              Active Rituals ({activeRituals.length})
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-atelier-clay shadow-sm border border-atelier-sand' : 'text-atelier-taupe hover:text-atelier-charcoal'}`}
            >
              Past Chronicles ({pastChronicles.length})
            </button>
          </div>
          <button 
            onClick={fetchHistory}
            className="p-4 hover:bg-white rounded-full transition-all border border-atelier-sand shadow-sm group"
          >
            <RefreshCw className="w-4 h-4 text-atelier-clay group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <AnimatePresence mode="wait">
          {displayRituals.length === 0 ? (
            <motion.div 
              key={`empty-${activeTab}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[60px] p-20 border border-dashed border-atelier-sand text-center space-y-6"
            >
              <div className="w-20 h-20 bg-atelier-nude rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-10 h-10 text-atelier-clay" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-atelier-charcoal uppercase tracking-widest">No {activeTab} Rituals Found</p>
                <p className="text-xs text-atelier-taupe max-w-xs mx-auto">
                  {activeTab === 'active' 
                    ? "You have no upcoming sessions manifested at this time." 
                    : "No completed rituals are recorded in your history yet."}
                </p>
              </div>
            </motion.div>
          ) : (
            displayRituals.map((item, idx) => {
              const status = getStatusStyle(item.status);
              const Icon = status.icon;
              const date = new Date(item.start_time);
              
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-[48px] border border-atelier-sand overflow-hidden hover:shadow-2xl hover:shadow-atelier-clay/5 transition-all group flex flex-col md:flex-row"
                >
                  <div className="md:w-64 h-48 md:h-auto bg-atelier-cream relative overflow-hidden shrink-0">
                    {item.service?.image_url ? (
                      <img src={item.service.image_url} alt={item.service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="w-12 h-12 text-atelier-sand" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-atelier-charcoal/40 to-transparent md:bg-gradient-to-r" />
                    
                    {/* GlowPoints Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {item.is_redeemed && (
                        <div className="px-3 py-1 bg-atelier-charcoal/80 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-atelier-clay" />
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">-100 PTS</span>
                        </div>
                      )}
                      {item.status === 'completed' && item.points_earned > 0 && (
                        <div className="px-3 py-1 bg-atelier-clay/80 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-white" />
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter">+5 PTS</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 p-8 md:p-10 flex flex-col justify-between space-y-8 md:space-y-0 text-left">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="space-y-3">
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${status.bg} border border-atelier-sand`}>
                          <Icon className={`w-3.5 h-3.5 ${status.text}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${status.text}`}>{status.label}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-atelier-charcoal uppercase tracking-widest leading-tight">
                          {item.service?.name || 'Bespoke Ritual'}
                        </h3>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-atelier-taupe">
                            <Calendar className="w-4 h-4 text-atelier-clay" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-atelier-taupe">
                            <Clock className="w-4 h-4 text-atelier-clay" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left md:text-right space-y-1">
                        <p className="text-[10px] font-black text-atelier-sand uppercase tracking-widest">Master Artisan</p>
                        <div className="flex items-center md:justify-end gap-3">
                          <p className="text-sm font-bold text-atelier-charcoal uppercase tracking-[0.1em]">{item.artisan?.full_name || 'Expert Stylist'}</p>
                          <div className="w-8 h-8 rounded-full bg-atelier-nude border border-atelier-sand overflow-hidden">
                            {item.artisan?.avatar_url && <img src={item.artisan.avatar_url} className="w-full h-full object-cover" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-atelier-cream flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-10">
                        <div>
                          <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest mb-1">Session Value</p>
                          <p className="text-2xl font-light text-atelier-clay tracking-tighter italic">Rs.{item.total_price || item.service?.price || '0.00'}</p>
                        </div>
                        <div className="h-8 w-px bg-atelier-sand/30" />
                        <div>
                          <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest mb-1">Duration</p>
                          <p className="text-sm font-bold text-atelier-charcoal uppercase tracking-widest">{item.service?.duration_minutes || '45'} Mins</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <button 
                          onClick={() => handleRebook(item)}
                          className="flex-1 md:flex-none px-8 py-4 bg-atelier-charcoal text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-atelier-clay transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" /> Edit Ritual
                        </button>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedAppointment(item)}
                            className="p-4 hover:bg-atelier-cream rounded-2xl border border-atelier-sand transition-all text-atelier-clay"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-4 hover:bg-red-50 rounded-2xl border border-atelier-sand transition-all text-red-400 hover:text-red-500"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-atelier-charcoal rounded-[60px] p-12 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-atelier-clay/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 w-full">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full border border-white/10">
              <Scissors className="w-3 h-3 text-atelier-clay" />
              <p className="text-atelier-sand font-bold uppercase tracking-[0.3em] text-[8px]">Rituals Perfected</p>
            </div>
            <h3 className="text-4xl font-light tracking-tight italic">{stats.perfectedCount} <span className="text-sm font-bold text-white/40 uppercase tracking-widest not-italic ml-2">Sessions</span></h3>
          </div>

          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full border border-white/10">
              <Sparkles className="w-3 h-3 text-atelier-clay" />
              <p className="text-atelier-sand font-bold uppercase tracking-[0.3em] text-[8px]">Sanctuary Investment</p>
            </div>
            <h3 className="text-4xl font-light tracking-tight italic">Rs.{stats.totalSpend.toFixed(2)}</h3>
          </div>

          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/10 rounded-full border border-white/10">
              <Sparkles className="w-3 h-3 text-atelier-clay" />
              <p className="text-atelier-sand font-bold uppercase tracking-[0.3em] text-[8px]">GlowPoints Balance</p>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-6">
              <h3 className="text-4xl font-light tracking-tight italic">{userPoints} <span className="text-sm font-bold text-atelier-clay uppercase tracking-widest not-italic ml-2">Points</span></h3>
              <div className="w-16 h-16 rounded-full border-4 border-white/5 flex items-center justify-center relative scale-75">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
                  <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={163.3} strokeDashoffset={163.3 * (1 - Math.min(userPoints / 100, 1))} className="text-atelier-clay" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black italic">{Math.min(userPoints, 100)}%</p>
                </div>
              </div>
            </div>
            {userPoints < 100 ? (
              <p className="text-atelier-sand/40 text-[9px] font-medium uppercase tracking-widest mt-2">Manifest {100 - userPoints} more for a 20% discount.</p>
            ) : (
              <p className="text-atelier-sage text-[9px] font-black uppercase tracking-widest mt-2 animate-pulse">20% Discount Manifested!</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Ritual Detail Modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-atelier-charcoal/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[60px] shadow-2xl max-w-2xl w-full p-12 border border-atelier-sand relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-light tracking-widest text-atelier-charcoal uppercase">
                    Ritual <span className="font-bold text-atelier-clay italic">Insight</span>
                  </h2>
                  <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest mt-2">Comprehensive session details</p>
                </div>
                <button 
                  onClick={() => setSelectedAppointment(null)} 
                  className="p-3 hover:bg-atelier-cream rounded-full transition-colors border border-atelier-sand"
                >
                  <XCircle className="w-5 h-5 text-atelier-charcoal" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="aspect-video bg-atelier-cream rounded-[40px] overflow-hidden">
                  {selectedAppointment.service?.image_url ? (
                    <img src={selectedAppointment.service.image_url} alt={selectedAppointment.service.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Scissors className="w-16 h-16 text-atelier-sand" /></div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">The Sanctuary</p>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest">{selectedAppointment.service?.name}</p>
                      <p className="text-sm font-bold text-atelier-charcoal uppercase tracking-widest leading-tight">{selectedAppointment.service?.description || "A personalized grooming ritual."}</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-right">
                    <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">Master Artisan</p>
                    <div className="flex items-center justify-end gap-3">
                      <p className="text-sm font-bold text-atelier-charcoal uppercase tracking-widest">{selectedAppointment.artisan?.full_name}</p>
                      <div className="w-10 h-10 rounded-full bg-atelier-nude border border-atelier-sand overflow-hidden">
                        {selectedAppointment.artisan?.avatar_url && <img src={selectedAppointment.artisan.avatar_url} className="w-full h-full object-cover" />}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-atelier-sand flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">Manifestation Date</p>
                    <p className="text-sm font-bold text-atelier-charcoal uppercase tracking-widest">
                      {new Date(selectedAppointment.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-atelier-clay text-[9px] font-black uppercase tracking-widest">
                      {new Date(selectedAppointment.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">Investment</p>
                    <p className="text-3xl font-light text-atelier-clay tracking-tighter italic">Rs.{selectedAppointment.total_price || selectedAppointment.service?.price}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedAppointment(null)}
                  className="w-full py-5 bg-atelier-charcoal text-white rounded-3xl font-bold uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-atelier-clay transition-all"
                >
                  Acknowledge Ritual
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppointmentHistory;
