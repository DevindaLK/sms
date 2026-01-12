import React from 'react';
import { 
  Clock, User, CheckCircle, ChevronRight, RefreshCw, 
  Calendar, Scissors, Sparkles, CheckCircle2, LayoutDashboard
} from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface StylistScheduleProps {
  user: any;
}

const StylistSchedule: React.FC<StylistScheduleProps> = ({ user }) => {
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user) fetchSchedule();
  }, [user]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      if (!user) return;
      // Fetch specifically for today
      const today = new Date();
      const { data } = await api.getAppointments({
        stylist_id: user.id,
        date: today.toISOString()
      }, 1, 1000);
      setTasks(data || []);
    } catch (e) {
      toast.error("Failed to load your rituals");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishRitual = async (id: string) => {
    try {
      await api.updateAppointmentStatus(id, 'completed');
      toast.success("Ritual perfected successfully");
      fetchSchedule();
    } catch (e) {
      toast.error("Failed to finalize ritual");
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            Daily <span className="font-bold text-atelier-clay italic">Manifestation</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            {todayStr} • YOUR ARTISAN PIPELINE
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-atelier-sage/10 text-atelier-sage px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-atelier-sage/20">
            <div className="w-2 h-2 bg-atelier-sage rounded-full animate-pulse" />
            Live Timeline
          </div>
          <button 
            onClick={fetchSchedule}
            className="p-4 hover:bg-white rounded-full transition-all border border-atelier-sand shadow-sm group"
          >
            <RefreshCw className={`w-4 h-4 text-atelier-clay ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-20 space-y-4"
            >
              <RefreshCw className="w-12 h-12 text-atelier-clay animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-atelier-taupe leading-relaxed">Reading the Stars...</p>
            </motion.div>
          ) : tasks.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[60px] p-24 border-2 border-dashed border-atelier-sand text-center space-y-6"
            >
              <div className="w-24 h-24 bg-atelier-nude rounded-full flex items-center justify-center mx-auto shadow-sm">
                <LayoutDashboard className="w-10 h-10 text-atelier-clay opacity-30" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-atelier-charcoal uppercase tracking-widest">No Manifestations Today</p>
                <p className="text-xs text-atelier-taupe max-w-xs mx-auto">Your timeline is clear for today. Take this time to reflect on your craft or explore the ritual collection.</p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {tasks.map((task, idx) => {
                const isConfirmed = task.status === 'confirmed';
                const isCompleted = task.status === 'completed';
                
                return (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`group relative overflow-hidden rounded-[40px] border p-8 transition-all hover:shadow-2xl hover:shadow-atelier-clay/5 ${
                      isConfirmed 
                        ? 'bg-atelier-charcoal text-white border-atelier-charcoal scale-[1.01] shadow-xl' 
                        : 'bg-white border-atelier-sand text-atelier-charcoal hover:border-atelier-clay'
                    }`}
                  >
                    {isConfirmed && (
                      <div className="absolute top-0 right-0 w-64 h-64 bg-atelier-clay/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    )}
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-10">
                        <div className="text-center min-w-[100px] space-y-1">
                          <p className={`text-[9px] font-black uppercase tracking-widest ${isConfirmed ? 'text-atelier-sand' : 'text-atelier-taupe'}`}>Alignment</p>
                          <p className={`text-2xl font-light italic tracking-tighter ${isConfirmed ? 'text-white' : 'text-atelier-clay'}`}>
                            {new Date(task.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        <div className={`h-12 w-px ${isConfirmed ? 'bg-white/10' : 'bg-atelier-sand'}`} />
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                              isConfirmed ? 'bg-white/10 border-white/20 text-atelier-sand' : 'bg-atelier-cream border-atelier-sand text-atelier-clay'
                            }`}>
                              {task.service?.name}
                            </span>
                            {task.is_redeemed && (
                              <div className="flex items-center gap-1.5 bg-atelier-clay/20 px-3 py-1.5 rounded-full border border-atelier-clay/30">
                                <Sparkles className="w-3 h-3 text-atelier-clay animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-atelier-clay">Reward Used</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl overflow-hidden border ${isConfirmed ? 'border-white/20' : 'border-atelier-sand'}`}>
                              {task.customer?.avatar_url ? (
                                <img src={task.customer.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-atelier-nude flex items-center justify-center">
                                  <User className={`w-6 h-6 ${isConfirmed ? 'text-atelier-clay' : 'text-atelier-sand'}`} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">Seeker</p>
                              <p className={`text-xl font-bold uppercase tracking-widest ${isConfirmed ? 'text-white' : 'text-atelier-charcoal'}`}>
                                {task.customer?.full_name || 'Anonymous Guest'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 w-full md:w-auto">
                        {!isCompleted ? (
                          <button 
                            onClick={() => handleFinishRitual(task.id)}
                            className={`flex-1 md:flex-none px-10 py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
                              isConfirmed 
                                ? 'bg-white text-atelier-charcoal hover:bg-atelier-sand' 
                                : 'bg-atelier-charcoal text-white hover:bg-atelier-clay'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Perfect Ritual
                          </button>
                        ) : (
                          <div className={`flex items-center gap-3 px-8 py-5 rounded-2xl border ${
                            isConfirmed ? 'bg-white/10 border-white/20 text-atelier-sage' : 'bg-atelier-cream border-atelier-sand text-atelier-sage'
                          }`}>
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Ritual Perfected</span>
                          </div>
                        )}
                        
                        <button className={`p-4 rounded-2xl border transition-all ${
                          isConfirmed 
                            ? 'border-white/10 text-white/40 hover:text-white hover:bg-white/5' 
                            : 'border-atelier-sand text-atelier-sand hover:text-atelier-clay hover:bg-atelier-cream'
                        }`}>
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StylistSchedule;
