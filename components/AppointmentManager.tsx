
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, Search, Filter, CheckCircle, 
  XCircle, Clock, Scissors, User as UserIcon, 
  RefreshCw, ChevronRight, Sparkles, MoreVertical,
  Calendar as CalendarIcon, Check, Trash2, AlertCircle
} from 'lucide-react';
import { api } from '../lib/api';
import { Appointment, UserRole } from '../types';
import toast from 'react-hot-toast';
import Pagination from './Shared/Pagination';

interface AppointmentManagerProps {
  user: any;
  role: UserRole;
}

const AppointmentManager: React.FC<AppointmentManagerProps> = ({ user, role }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchAppointments();
  }, [user, role, currentPage]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (!user) return;
      if (role === UserRole.STYLIST) {
        filters.stylist_id = user.id;
      }
      
      const { data, count } = await api.getAppointments(filters, currentPage, pageSize);
      setAppointments(data || []);
      setTotalItems(count || 0);
    } catch (e) {
      toast.error("Failed to recall the ritual chronicles");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAppointments();
    setIsRefreshing(false);
    toast.success("Ritual chronicles synchronized");
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.updateAppointmentStatus(id, status);
      toast.success(`Ritual status manifested as ${status}`);
      fetchAppointments();
    } catch (e) {
      toast.error("Status shift failed in the ether");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-atelier-clay text-white border-atelier-clay';
      case 'completed': return 'bg-atelier-charcoal text-white border-atelier-charcoal';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = 
      apt.customer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.artisan?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            Ritual <span className="font-bold text-atelier-clay italic">Management</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            {role === UserRole.ADMIN ? "Overseeing the sanctuary's temporal flow" : "Your upcoming artisan engagements"}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
            <input 
              type="text" 
              placeholder="Search rituals or seekers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-atelier-sand rounded-full py-3.5 pl-12 pr-6 text-xs w-64 focus:ring-2 focus:ring-atelier-clay outline-none shadow-sm transition-all"
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border-atelier-sand rounded-full py-3.5 px-6 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-atelier-clay shadow-sm cursor-pointer"
          >
            <option value="all">Every State</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <button 
            onClick={handleRefresh}
            className={`p-3.5 bg-white border border-atelier-sand rounded-full hover:bg-atelier-cream transition-all shadow-sm group ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 text-atelier-clay ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <RefreshCw className="w-12 h-12 text-atelier-clay animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-atelier-taupe">Reading the Stars...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-[40px] border-2 border-dashed border-atelier-sand p-20 text-center space-y-4">
          <div className="bg-atelier-nude w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-atelier-clay opacity-30" />
          </div>
          <h3 className="text-xl font-light text-atelier-charcoal uppercase tracking-widest">No Rituals Detected</h3>
          <p className="text-atelier-taupe text-xs uppercase tracking-widest max-w-xs mx-auto">The temporal stream is currently empty for these parameters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-atelier-sand overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-atelier-cream/50 border-b border-atelier-sand">
                  <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-[0.2em]">Seer & Ritual</th>
                  <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-[0.2em]">Temporal Alignment</th>
                  <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-[0.2em]">Artisan</th>
                  <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-[0.2em]">Investment</th>
                  <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-[0.2em] text-right">Manifest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-atelier-sand">
                {filteredAppointments.map((apt) => (
                  <motion.tr 
                    layout
                    key={apt.id} 
                    className="hover:bg-atelier-cream/30 transition-colors group"
                  >
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-atelier-nude overflow-hidden border border-atelier-sand shrink-0">
                          {apt.customer?.avatar_url ? (
                            <img src={apt.customer.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-atelier-clay" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-atelier-charcoal text-sm uppercase tracking-widest">{apt.customer?.full_name}</p>
                          <p className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest mt-0.5 italic">{apt.service?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-atelier-charcoal">
                          <CalendarIcon className="w-3.5 h-3.5 text-atelier-clay" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {new Date(apt.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-atelier-taupe">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold tracking-widest">
                            {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-atelier-cream border border-atelier-sand flex items-center justify-center overflow-hidden shrink-0">
                          {apt.artisan?.avatar_url ? (
                            <img src={apt.artisan.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <Scissors className="w-4 h-4 text-atelier-clay" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-atelier-taupe uppercase tracking-widest">{apt.artisan?.full_name?.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.1em] border ${getStatusStyle(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-light text-atelier-charcoal tracking-tighter">Rs.{apt.total_price}</span>
                        {apt.is_redeemed && (
                          <div className="flex items-center gap-1.5 mt-1 text-atelier-clay">
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-widest bg-atelier-nude px-2 py-0.5 rounded-md border border-atelier-sand">20% Reward</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {apt.status === 'pending' && (
                          <button 
                            onClick={() => updateStatus(apt.id, 'confirmed')}
                            className="bg-atelier-clay text-white p-2.5 rounded-xl hover:bg-atelier-charcoal transition-all shadow-md group/btn"
                            title="Manifest Approval"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button 
                            onClick={() => updateStatus(apt.id, 'completed')}
                            className="bg-atelier-charcoal text-white p-2.5 rounded-xl hover:bg-black transition-all shadow-md"
                            title="Complete Ritual"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                          <button 
                            onClick={() => updateStatus(apt.id, 'cancelled')}
                            className="p-2.5 text-atelier-sand hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Cease Manifestation"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {role === UserRole.ADMIN && (
                          <button className="p-2.5 text-atelier-sand hover:text-atelier-charcoal hover:bg-atelier-cream rounded-xl transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination 
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default AppointmentManager;
