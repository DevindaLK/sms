
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scissors, Plus, Search, Filter, MoreVertical, 
  Trash2, Edit2, Clock, DollarSign, Image as ImageIcon,
  CheckCircle, X, Sparkles, RefreshCw, Upload
} from 'lucide-react';
import { api } from '../lib/api';
import { Service, UserRole } from '../types';
import toast from 'react-hot-toast';
import Pagination from './Shared/Pagination';

interface ServicesManagerProps {
  role?: UserRole;
}

const ServicesManager: React.FC<ServicesManagerProps> = ({ role = UserRole.ADMIN }) => {
  const isStylist = role === UserRole.STYLIST;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState<Partial<Service>>({
    name: '',
    category: 'Hair',
    price: 0,
    duration_minutes: 30,
    description: '',
    image_url: ''
  });

  const categories = ['Hair', 'Beard', 'Facial', 'Nails', 'Massage', 'Ritual'];

  useEffect(() => {
    fetchServices();
  }, [currentPage]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, count } = await api.getServices(currentPage, pageSize);
      setServices(data || []);
      setTotalItems(count || 0);
    } catch (e) {
      toast.error("Failed to fetch rituals");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.updateService(editingService.id, form);
        toast.success("Ritual updated successfully");
      } else {
        await api.createService(form);
        toast.success("New Ritual added to the collection");
      }
      setIsAdding(false);
      setEditingService(null);
      setForm({ name: '', category: 'Hair', price: 0, duration_minutes: 30, description: '', image_url: '' });
      fetchServices();
    } catch (e) {
      toast.error("Operation failed");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const publicUrl = await api.uploadInventoryImage(file);
      setForm({ ...form, image_url: publicUrl });
      toast.success("Ritual portrait captured");
    } catch (e) {
      toast.error("Portrait upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this ritual?")) return;
    try {
      await api.deleteService(id);
      toast.success("Ritual removed");
      fetchServices();
    } catch (e) {
      toast.error("Failed to delete ritual");
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            Ritual <span className="font-bold text-atelier-clay italic">Collection</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
            Manage your salon's signature services
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
            <input 
              type="text" 
              placeholder="Search rituals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border-atelier-sand rounded-full py-3 pl-12 pr-6 text-xs w-64 focus:ring-2 focus:ring-atelier-clay outline-none shadow-sm"
            />
          </div>
          {!isStylist && (
            <button 
              onClick={() => { setIsAdding(true); setEditingService(null); setForm({ name: '', category: 'Hair', price: 0, duration_minutes: 30, description: '' }); }}
              className="bg-atelier-charcoal text-white px-8 py-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-atelier-clay transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Ritual
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <RefreshCw className="w-10 h-10 text-atelier-clay animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-atelier-taupe">Summoning Rituals...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <motion.div 
              layout
              key={service.id}
              className="bg-white rounded-[40px] border border-atelier-sand overflow-hidden hover:shadow-2xl hover:shadow-atelier-clay/5 transition-all group"
            >
              {service.image_url && (
                <div className="h-48 overflow-hidden relative">
                  <img src={service.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="bg-atelier-nude/30 p-4 rounded-3xl group-hover:bg-atelier-clay group-hover:text-white transition-colors">
                    <Scissors className="w-6 h-6" />
                  </div>
                  {!isStylist && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingService(service); setForm(service); setIsAdding(true); }}
                        className="p-2.5 text-atelier-sand hover:text-atelier-clay hover:bg-atelier-cream rounded-full transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(service.id)}
                        className="p-2.5 text-atelier-sand hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-atelier-cream text-atelier-clay text-[8px] font-black uppercase tracking-widest rounded-full">{service.category}</span>
                  </div>
                  <h3 className="text-xl font-bold text-atelier-charcoal group-hover:text-atelier-clay transition-colors uppercase tracking-widest">
                    {service.name}
                  </h3>
                  <p className="text-atelier-taupe text-xs line-clamp-2 min-h-[2.5rem] leading-relaxed">
                    {service.description || "No description provided for this ritual."}
                  </p>
                </div>

                <div className="pt-6 border-t border-atelier-sand flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-atelier-clay" />
                      <span className="text-[10px] font-bold text-atelier-charcoal uppercase">{service.duration_minutes}m</span>
                    </div>
                  </div>
                  <span className="text-2xl font-light text-atelier-clay tracking-tighter">Rs.{service.price}</span>
                </div>
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-atelier-charcoal/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[60px] shadow-2xl max-w-2xl w-full p-12 border border-atelier-sand relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 -z-10 rotate-12">
                <Scissors className="w-64 h-64" />
              </div>

              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-2xl font-light tracking-widest text-atelier-charcoal uppercase">
                    {editingService ? 'Refine' : 'New'} <span className="font-bold text-atelier-clay">Ritual</span>
                  </h2>
                  <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest mt-2">Update your menu of services</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-atelier-cream rounded-full transition-colors border border-atelier-sand shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="md:col-span-1 space-y-4">
                    <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Ritual Portrait</p>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square bg-atelier-cream rounded-[40px] border-2 border-dashed border-atelier-sand flex flex-col items-center justify-center cursor-pointer hover:bg-atelier-nude transition-all overflow-hidden relative group"
                    >
                      {form.image_url ? (
                        <>
                          <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white w-8 h-8" />
                          </div>
                        </>
                      ) : (
                        <>
                          {uploading ? (
                            <RefreshCw className="w-8 h-8 text-atelier-clay animate-spin" />
                          ) : (
                            <>
                              <ImageIcon className="w-10 h-10 text-atelier-sand mb-2" />
                              <span className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">Upload Image</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>

                  <div className="md:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-atelier-clay uppercase tracking-[0.3em] ml-4">Ritual Name</label>
                        <input 
                          type="text" 
                          required
                          value={form.name}
                          onChange={(e) => setForm({...form, name: e.target.value})}
                          placeholder="e.g. Modern Sculpt"
                          className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-3xl py-4 px-6 text-sm outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-atelier-clay uppercase tracking-[0.3em] ml-4">Category</label>
                        <select 
                          value={form.category}
                          onChange={(e) => setForm({...form, category: e.target.value})}
                          className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-3xl py-4 px-6 text-sm outline-none transition-all appearance-none cursor-pointer"
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-atelier-clay uppercase tracking-[0.3em] ml-4">Duration (Mins)</label>
                        <input 
                          type="number" 
                          required
                          value={form.duration_minutes}
                          onChange={(e) => setForm({...form, duration_minutes: parseInt(e.target.value)})}
                          className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-3xl py-4 px-6 text-sm outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-atelier-clay uppercase tracking-[0.3em] ml-4">Price (Rs.)</label>
                        <input 
                          type="number" 
                          required
                          value={form.price}
                          onChange={(e) => setForm({...form, price: parseFloat(e.target.value)})}
                          className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-3xl py-4 px-6 text-sm outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-atelier-clay uppercase tracking-[0.3em] ml-4">Description of Ritual</label>
                  <textarea 
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({...form, description: e.target.value})}
                    placeholder="Describe the sensory experience..."
                    className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-[32px] py-4 px-6 text-sm outline-none transition-all resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-6 bg-atelier-charcoal text-white rounded-3xl font-bold uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-atelier-clay transition-all active:scale-[0.98] mt-4"
                >
                  {editingService ? 'Commit Changes' : 'Initialize Ritual'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ServicesManager;
