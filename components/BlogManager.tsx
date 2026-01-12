import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, PenTool, Globe, Eye, Trash2, 
  Plus, X, Save, Search, RefreshCw, CheckCircle,
  Clock, Hash, Image as ImageIcon, Briefcase, ChevronRight,
  Upload
} from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import Pagination from './Shared/Pagination';

const BlogManager: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentPost, setCurrentPost] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    cover_image_url: '',
    status: 'draft'
  });

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Canvas to Blob failed'));
            },
            'image/webp',
            0.8
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
        type: 'image/webp'
      });

      const publicUrl = await api.uploadInventoryImage(compressedFile);
      setForm({ ...form, cover_image_url: publicUrl });
      toast.success("Cover visual preserved and optimized");
    } catch (e) {
      toast.error("Failed to process the visual essence");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage]);

  const fetchPosts = async () => {
    try {
      const { data, count } = await api.getBlogPosts(true, currentPage, pageSize); // include drafts
      setPosts(data || []);
      setTotalItems(count || 0);
    } catch (e) {
      toast.error("Chronicles could not be retrieved");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm({ 
      ...form, 
      title, 
      slug: generateSlug(title) 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentPost) {
        await api.updateBlogPost(currentPost.id, form);
        toast.success("Chronicle evolved successfully");
      } else {
        await api.createBlogPost(form);
        toast.success("New chronicle added to the sanctuary");
      }
      setIsEditing(false);
      setCurrentPost(null);
      setForm({ title: '', slug: '', content: '', excerpt: '', cover_image_url: '', status: 'draft' });
      fetchPosts();
    } catch (e) {
      toast.error("Translation of thoughts failed");
    }
  };

  const handleEdit = (post: any) => {
    setCurrentPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || '',
      cover_image_url: post.cover_image_url || '',
      status: post.status
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Archiving this chronicle will silence its voice. Proceed?")) return;
    try {
      await api.deleteBlogPost(id);
      toast.success("Chronicle silenced");
      fetchPosts();
    } catch (e) {
      toast.error("Failed to silence chronicle");
    }
  };

  if (loading) return (
    <div className="p-32 text-center space-y-4">
      <RefreshCw className="animate-spin mx-auto w-12 h-12 text-atelier-clay" />
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-atelier-taupe">Translating Thoughts...</p>
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            Ritual <span className="font-bold text-atelier-clay italic">Chronicles</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em] mt-2">Writing the legacy of PAWA for the digital void</p>
        </div>
        <button 
          onClick={() => { setIsEditing(true); setCurrentPost(null); setForm({ title: '', slug: '', content: '', excerpt: '', cover_image_url: '', status: 'draft' }); }}
          className="bg-atelier-charcoal text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-atelier-clay transition-all uppercase text-[10px] tracking-widest shadow-2xl"
        >
          <Plus className="w-4 h-4" /> New Chronicle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div 
              layout
              key={post.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-[40px] border border-atelier-sand p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-atelier-clay transition-all shadow-sm hover:shadow-2xl"
            >
              <div className="flex items-center gap-8 flex-1">
                <div className="w-24 h-24 rounded-3xl bg-atelier-cream overflow-hidden border border-atelier-sand flex-shrink-0">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-atelier-sand">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${post.status === 'published' ? 'bg-atelier-sage/30 text-atelier-charcoal' : 'bg-atelier-nude text-atelier-clay'}`}>
                      {post.status}
                    </span>
                    <span className="text-[10px] text-atelier-sand font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-atelier-charcoal uppercase tracking-widest leading-tight">{post.title}</h3>
                  <p className="text-[10px] text-atelier-taupe font-bold flex items-center gap-2 uppercase tracking-widest">
                    <Globe className="w-3 h-3 text-atelier-clay" /> /{post.slug}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleEdit(post)}
                  className="p-5 bg-atelier-cream text-atelier-taupe rounded-2xl hover:bg-atelier-clay hover:text-white transition-all shadow-sm"
                >
                  <PenTool className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDelete(post.id)}
                  className="p-5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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

      {posts.length === 0 && (
        <div className="text-center py-40 bg-atelier-cream/30 rounded-[60px] border-2 border-dashed border-atelier-sand">
          <FileText className="w-16 h-16 text-atelier-sand mx-auto mb-6" />
          <p className="text-[10px] font-black text-atelier-taupe uppercase tracking-[0.4em]">The chronicles are yet to be written</p>
          <button onClick={() => setIsEditing(true)} className="mt-8 text-atelier-clay font-bold text-[10px] uppercase tracking-widest hover:underline">Start the Flow</button>
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-atelier-charcoal/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[60px] p-12 max-w-5xl w-full shadow-2xl space-y-10 border border-atelier-sand relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsEditing(false)}
                className="absolute top-10 right-10 p-4 bg-atelier-cream hover:bg-atelier-nude rounded-full transition-all border border-atelier-sand"
              >
                <X className="w-5 h-5 text-atelier-charcoal" />
              </button>

              <div className="flex items-center gap-6">
                <div className="bg-atelier-clay/10 p-5 rounded-3xl"><PenTool className="w-8 h-8 text-atelier-clay" /></div>
                <div>
                  <h3 className="text-2xl font-light text-atelier-charcoal uppercase tracking-[0.2em]">Chronicling <span className="font-bold text-atelier-clay">ritual</span></h3>
                  <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest mt-1">SEO Alchemy & Content Flow</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Chronicle Title</label>
                      <input 
                        required
                        type="text" 
                        value={form.title}
                        onChange={handleTitleChange}
                        placeholder="e.g. The Art of the Minimalist Ritual"
                        className="w-full bg-atelier-cream p-5 rounded-2xl outline-none text-sm font-bold border-2 border-transparent focus:border-atelier-sand transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">SEO Ritual Path (Slug)</label>
                      <div className="flex items-center gap-2 bg-atelier-cream p-5 rounded-2xl border-2 border-transparent">
                        <Hash className="w-4 h-4 text-atelier-sand" />
                        <input 
                          required
                          type="text" 
                          value={form.slug}
                          onChange={e => setForm({...form, slug: e.target.value})}
                          className="flex-1 bg-transparent outline-none text-sm font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Chronicle Excerpt (SEO Snippet)</label>
                      <textarea 
                        rows={3}
                        value={form.excerpt}
                        onChange={e => setForm({...form, excerpt: e.target.value})}
                        className="w-full bg-atelier-cream p-5 rounded-2xl outline-none text-sm font-bold resize-none border-2 border-transparent focus:border-atelier-sand transition-all"
                        placeholder="A brief summary for the digital search spirits..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Cover Visual (Ritual Iconography)</label>
                       <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[16/9] bg-atelier-cream rounded-3xl border-2 border-dashed border-atelier-sand flex flex-col items-center justify-center cursor-pointer hover:bg-atelier-nude transition-all overflow-hidden relative group"
                       >
                        {form.cover_image_url ? (
                          <>
                            <img src={form.cover_image_url} alt="Cover Preview" className="w-full h-full object-cover" />
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
                                <ImageIcon className="w-10 h-10 text-atelier-sand mb-3" />
                                <span className="text-[9px] font-black text-atelier-sand uppercase tracking-widest">Select Narrative Visual</span>
                              </>
                            )}
                          </>
                        )}
                       </div>
                       <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                       />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">Visibility Flux</label>
                      <div className="flex gap-4">
                        {['draft', 'published'].map(s => (
                          <button 
                            key={s}
                            type="button"
                            onClick={() => setForm({...form, status: s})}
                            className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${form.status === s ? 'bg-atelier-charcoal text-white shadow-xl' : 'bg-atelier-cream text-atelier-sand border border-atelier-sand hover:border-atelier-clay'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-atelier-clay uppercase tracking-widest ml-4">The Infinite Scroll (Content)</label>
                  <textarea 
                    required
                    rows={12}
                    value={form.content}
                    onChange={e => setForm({...form, content: e.target.value})}
                    className="w-full bg-atelier-cream p-8 rounded-[40px] outline-none text-sm leading-relaxed font-medium resize-none border-2 border-transparent focus:border-atelier-sand transition-all"
                    placeholder="Pour the ritual essence here... (Markdown supported mentally)"
                  />
                </div>

                <div className="flex gap-6">
                  <button 
                    type="submit"
                    className="flex-1 py-6 bg-atelier-charcoal text-white rounded-3xl font-bold uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-atelier-clay transition-all flex items-center justify-center gap-4"
                  >
                    <Save className="w-4 h-4" /> Commit Chronicle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlogManager;
