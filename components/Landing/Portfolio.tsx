import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { RefreshCw, ImageIcon } from 'lucide-react';

const Portfolio: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const { data } = await api.getGallery();
        setImages(data || []);
      } catch (e) {
        console.error("Failed to load gallery", e);
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  return (
    <section id="portfolio" className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-24 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[10px] font-bold text-atelier-clay uppercase tracking-[0.4em] mb-4">Lookbook</p>
            <h2 className="text-5xl md:text-7xl font-light text-atelier-charcoal tracking-tighter">The Atelier Gallery.</h2>
          </motion.div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <RefreshCw className="animate-spin w-10 h-10 text-atelier-clay" />
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-atelier-taupe">Illuminating the Lookbook...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.8 }}
                whileHover={{ y: -10 }}
                className="relative aspect-[3/4] rounded-[80px] overflow-hidden shadow-sm group"
              >
                <img 
                  src={img.image_url} 
                  className="w-full h-full object-cover grayscale-[0.6] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-[1.5s] ease-out opacity-80 group-hover:opacity-100" 
                  alt={img.caption || "Lookbook Image"} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-atelier-charcoal/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 p-10 flex flex-col justify-end items-center text-center">
                  <p className="text-atelier-sand text-[8px] font-bold uppercase tracking-[0.3em] mb-2">{img.category || 'Pawa Signature'}</p>
                  <p className="text-white text-lg font-light italic tracking-tight">{img.caption}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && images.length === 0 && (
          <div className="text-center py-40 bg-atelier-cream/30 rounded-[60px] border-2 border-dashed border-atelier-sand">
            <ImageIcon className="w-12 h-12 text-atelier-sand mx-auto mb-6" />
            <p className="text-[10px] font-black text-atelier-taupe uppercase tracking-[0.4em]">The lookbook is currently being curated</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolio;
