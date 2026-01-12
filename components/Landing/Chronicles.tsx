
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { RefreshCw, BookOpen, Clock, ChevronRight } from 'lucide-react';

const Chronicles: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data } = await api.getBlogPosts(false); // Only published
        setPosts(data || []);
      } catch (e) {
        console.error("Failed to load chronicles", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section id="chronicles" className="py-32 bg-atelier-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-atelier-clay uppercase tracking-[0.4em]">The Journals</p>
            <h2 className="text-5xl md:text-7xl font-light text-atelier-charcoal tracking-tighter">Ritual Chronicles.</h2>
          </div>
          <p className="text-atelier-taupe max-w-md text-lg leading-relaxed italic">
            "Chronicles are the preserved echoes of our rituals, translating aesthetic precision into digital wisdom."
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="animate-spin w-10 h-10 text-atelier-clay" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-atelier-taupe">Whispering the archives...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {posts.slice(0, 3).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col h-full bg-white rounded-[60px] border border-atelier-nude hover:border-atelier-clay transition-all duration-700 shadow-sm hover:shadow-2xl overflow-hidden"
              >
                <div className="aspect-[16/9] overflow-hidden grayscale-[0.4] group-hover:grayscale-0 transition-all duration-700">
                  <img 
                    src={post.cover_image_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1674&auto=format&fit=crop'} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                </div>
                
                <div className="p-10 flex flex-col flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-atelier-nude text-atelier-clay text-[8px] font-black uppercase tracking-widest">
                      Wisdom
                    </span>
                    <span className="text-[10px] text-atelier-sand font-bold flex items-center gap-1 uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-atelier-charcoal leading-tight group-hover:text-atelier-clay transition-colors">
                    {post.title}
                  </h3>
                  
                  <p className="text-atelier-taupe text-sm leading-relaxed line-clamp-3">
                    {post.excerpt || 'A profound exploration into the nuances of PAWA rituals and the evolution of modern aesthetic standards.'}
                  </p>
                  
                  <div className="pt-6 border-t border-atelier-sand flex justify-between items-center mt-auto">
                    <button className="text-[10px] font-bold text-atelier-clay uppercase tracking-[0.3em] flex items-center gap-2 group-hover:gap-4 transition-all">
                      Read Chronicle <ChevronRight className="w-4 h-4" />
                    </button>
                    <BookOpen className="w-5 h-5 text-atelier-sand group-hover:text-atelier-clay transition-colors" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Chronicles;
