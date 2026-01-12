
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, Search, Sparkles, RefreshCw, 
  Edit2, CheckCircle, X, ChevronRight, Mail, Phone
} from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import Pagination from './Shared/Pagination';

const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPoints, setEditingPoints] = useState<any | null>(null);
  const [newPoints, setNewPoints] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, count } = await api.getCustomers(currentPage, pageSize);
      setCustomers(data || []);
      setTotalItems(count || 0);
    } catch (e) {
      toast.error("Failed to summon the list of participants");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePoints = async () => {
    if (!editingPoints) return;
    try {
      await api.updateProfile(editingPoints.id, { glow_points: newPoints });
      toast.success(`Ritual energy (GlowPoints) recalibrated for ${editingPoints.full_name}`);
      setEditingPoints(null);
      fetchCustomers();
    } catch (e) {
      toast.error("Failed to manifest point adjustment");
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            Customer <span className="font-bold text-atelier-clay italic">Directory</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            Manage customer loyalty and ritual energy
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
            <input 
              type="text" 
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-atelier-sand rounded-full py-3 pl-12 pr-6 text-xs w-64 focus:ring-2 focus:ring-atelier-clay outline-none shadow-sm"
            />
          </div>
          <button 
            onClick={fetchCustomers}
            className="p-3.5 hover:bg-white rounded-full transition-all border border-atelier-sand shadow-sm group"
          >
            <RefreshCw className="w-4 h-4 text-atelier-clay group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <RefreshCw className="w-10 h-10 text-atelier-clay animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-atelier-taupe">Recalling Participants...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCustomers.map((customer) => (
            <motion.div 
              layout
              key={customer.id}
              className="bg-white rounded-[40px] border border-atelier-sand p-8 hover:shadow-2xl hover:shadow-atelier-clay/5 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[24px] bg-atelier-nude flex items-center justify-center overflow-hidden border border-atelier-sand">
                    {customer.avatar_url ? (
                      <img src={customer.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-8 h-8 text-atelier-clay" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-atelier-charcoal uppercase tracking-widest group-hover:text-atelier-clay transition-colors">{customer.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-3 h-3 text-atelier-sand" />
                      <span className="text-[9px] font-bold text-atelier-taupe uppercase tracking-widest">{customer.email}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => { setEditingPoints(customer); setNewPoints(customer.glow_points || 0); }}
                  className="p-3 hover:bg-atelier-cream rounded-2xl border border-atelier-sand transition-all text-atelier-clay"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-atelier-sand flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">GlowPoints Balance</p>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-atelier-clay animate-pulse" />
                    <span className="text-2xl font-light text-atelier-clay tracking-tighter italic">{customer.glow_points || 0}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">Joined On</p>
                  <p className="text-[10px] font-bold text-atelier-charcoal uppercase tracking-widest">{new Date(customer.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Decorative Background */}
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 duration-700">
                <Sparkles className="w-32 h-32" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Pagination 
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {/* Point Adjustment Modal */}
      <AnimatePresence>
        {editingPoints && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-atelier-charcoal/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[60px] shadow-2xl max-w-md w-full p-12 border border-atelier-sand relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-2xl font-light tracking-widest text-atelier-charcoal uppercase leading-tight">
                    Recalibrate <span className="font-bold text-atelier-clay italic">Energy</span>
                  </h2>
                  <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest mt-2">{editingPoints.full_name}'s glowpoints</p>
                </div>
                <button onClick={() => setEditingPoints(null)} className="p-3 hover:bg-atelier-cream rounded-full transition-colors border border-atelier-sand shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-32 h-32 rounded-full border-8 border-atelier-nude flex items-center justify-center relative bg-white shadow-inner">
                    <Sparkles className="w-12 h-12 text-atelier-clay animate-pulse" />
                    <div className="absolute -bottom-2 px-6 py-2 bg-atelier-charcoal text-white rounded-full text-xs font-black italic shadow-xl">
                      {newPoints} PTS
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black text-atelier-clay uppercase tracking-[0.3em] ml-4 text-center block">Adjust Point Value</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="1000" 
                    step="5"
                    value={newPoints}
                    onChange={(e) => setNewPoints(parseInt(e.target.value))}
                    className="w-full h-2 bg-atelier-nude rounded-lg appearance-none cursor-pointer accent-atelier-clay"
                  />
                  <div className="flex justify-between px-2 text-[8px] font-black text-atelier-sand uppercase tracking-widest">
                    <span>0 Pts</span>
                    <span>500 Pts</span>
                    <span>1000 Pts</span>
                  </div>
                </div>

                <button 
                  onClick={handleUpdatePoints}
                  className="w-full py-6 bg-atelier-charcoal text-white rounded-3xl font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-atelier-clay transition-all active:scale-[0.98]"
                >
                  Manifest Adjustment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerManager;
