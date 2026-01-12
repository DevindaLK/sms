
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, Upload, Trash2, Plus, 
  X, Filter, Search, RefreshCw, CheckCircle, Camera
} from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import Pagination from './Shared/Pagination';

const GalleryManager: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    image_url: '',
    caption: '',
    category: 'Ritual'
  });

  const categories = ['Ritual', 'Interior', 'Artisans', 'Events', 'Lifestyle'];

  useEffect(() => {
    fetchGallery();
  }, [currentPage]);

  const fetchGallery = async () => {
    try {
      const { data, count } = await api.getGallery(currentPage, pageSize);
      setItems(data || []);
      setTotalItems(count || 0);
    } catch (e) {
      toast.error("Failed to load the visual sanctuary");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const publicUrl = await api.uploadInventoryImage(file);
      setForm({ ...form, image_url: publicUrl });
      toast.success("Visual captured successfully");
    } catch (e) {
      toast.error("Failed to preserve the visual");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) {
      toast.error("Please provide a visual representation");
      return;
    }

    try {
      await api.addToGallery(form);
      toast.success("New masterpiece added to the gallery");
      setIsAdding(false);
      setForm({ image_url: '', caption: '', category: 'Ritual' });
      fetchGallery();
    } catch (e) {
      toast.error("Failed to curate the masterpiece");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Archive this masterpiece from the gallery?")) return;
    try {
      await api.deleteFromGallery(id);
      toast.success("Visual archived");
      fetchGallery();
    } catch (e) {
      toast.error("Failed to archive visual");
    }
  };

  if (loading) return (
    <div className="p-32 text-center space-y-4">
      <RefreshCw className="animate-spin mx-auto w-12 h-12 text-atelier-clay" />
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-atelier-taupe">Illuminating the Sanctuary...</p>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            Visual <span className="font-bold text-atelier-clay italic">Sanctuary</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Curating the aesthetic essence of PAWA</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-atelier-charcoal text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-atelier-clay transition-all uppercase text-[10px] tracking-widest shadow-2xl"
        >
          <Camera className="w-4 h-4" /> Capture Moment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div 
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative aspect-[4/5] bg-atelier-cream rounded-[40px] overflow-hidden border border-atelier-sand shadow-sm hover:shadow-2xl transition-all duration-700"
            >
              <img src={item.image_url} alt={item.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-atelier-charcoal/90 via-atelier-charcoal/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end">
                <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{item.category}</p>
                <p className="text-white/80 text-xs italic mt-2 line-clamp-3">"{item.caption || 'A moment of pure ritual essence.'}"</p>
                <div className="flex gap-4 mt-6">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-red-500/20 backdrop-blur-md text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg text-atelier-clay">
                   <ImageIcon className="w-3.5 h-3.5" />
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Pagination 
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      {items.length === 0 && (
        <div className="text-center py-40 bg-atelier-cream/30 rounded-[60px] border-2 border-dashed border-atelier-sand">
          <ImageIcon className="w-16 h-16 text-atelier-sand mx-auto mb-6" />
          <p className="text-[10px] font-black text-atelier-taupe uppercase tracking-[0.4em]">The sanctuary is awaiting its first light</p>
          <button onClick={() => setIsAdding(true)} className="mt-8 text-atelier-clay font-bold text-[10px] uppercase tracking-widest hover:underline">Begin Curating</button>
        </div>
      )}

      {/* Add Visual Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-atelier-charcoal/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white rounded-[60px] p-12 max-w-2xl w-full shadow-2xl space-y-10 border border-atelier-sand relative"
            >
              <button 
                onClick={() => setIsAdding(false)}
                className="absolute top-10 right-10 p-4 bg-atelier-cream hover:bg-atelier-nude rounded-full transition-all border border-atelier-sand"
              >
                <X className="w-5 h-5 text-atelier-charcoal" />
              </button>

              <div>
                <h3 className="text-2xl font-light text-atelier-charcoal uppercase tracking-[0.2em]">Capture <span className="font-bold text-atelier-clay">ritual</span></h3>
                <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest mt-1">Preserving the aesthetic flow</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
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
                          <ImageIcon className="w-12 h-12 text-atelier-sand mb-4" />
                          <span className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">Select Visual</span>
                        </>
                      )}
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Chronicle Category</label>
                    <select 
                      value={form.category}
                      onChange={e => setForm({...form, category: e.target.value})}
                      className="w-full bg-atelier-cream p-5 rounded-2xl outline-none text-sm font-bold appearance-none cursor-pointer border-2 border-transparent focus:border-atelier-sand transition-all"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Capturing the Essence (Caption)</label>
                    <textarea 
                      rows={4}
                      value={form.caption}
                      onChange={e => setForm({...form, caption: e.target.value})}
                      className="w-full bg-atelier-cream p-5 rounded-2xl outline-none text-sm font-bold resize-none border-2 border-transparent focus:border-atelier-sand transition-all"
                      placeholder="Describe the aesthetic..."
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={uploading || !form.image_url}
                className="w-full py-6 bg-atelier-charcoal text-white rounded-3xl font-bold uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-atelier-clay disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-4"
              >
                <CheckCircle className="w-4 h-4" /> Finalize Masterpiece
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryManager;
