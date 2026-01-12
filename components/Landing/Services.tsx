import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Scissors, Zap, Sparkles, Heart, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Service } from '../../types';

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await api.getServices(1, 100);
        setServices(data || []);
      } catch (err) {
        console.error("Failed to manifest rituals:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <section id="services" className="py-32 bg-atelier-cream overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-atelier-clay uppercase tracking-[0.4em]">The Menu</p>
            <h2 className="text-5xl md:text-7xl font-light text-atelier-charcoal tracking-tighter">Our Services.</h2>
          </div>
          <p className="text-atelier-taupe max-w-md text-lg leading-relaxed">Each session is a personalized consultation designed around your individual anatomy and lifestyle.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <RefreshCw className="w-10 h-10 text-atelier-clay animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-atelier-taupe">Summoning Rituals...</p>
        </div>
      ) : (
        <div className="relative">
          <div className="flex overflow-x-auto pb-10 px-6 md:px-[calc(50vw-640px+24px)] gap-8 scroll-smooth no-scrollbar snap-x">
            {services.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className="snap-center min-w-[320px] md:min-w-[400px] group p-12 bg-white rounded-[60px] border border-atelier-nude hover:border-atelier-clay transition-all duration-700 hover:-translate-y-2 cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-atelier-clay/10"
              >
                <div className="w-14 h-14 bg-atelier-nude rounded-2xl flex items-center justify-center mb-10 shadow-sm group-hover:scale-110 group-hover:bg-atelier-charcoal group-hover:text-white transition-all duration-500 text-atelier-clay">
                  <Scissors className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-atelier-charcoal transition-colors uppercase tracking-widest leading-tight h-14 line-clamp-2">{s.name}</h3>
                <p className="text-xs font-black text-atelier-clay mb-8 uppercase tracking-widest">Rs. {s.price.toLocaleString()}</p>
                <p className="text-atelier-taupe group-hover:text-atelier-charcoal transition-colors leading-relaxed text-sm mb-10 line-clamp-3 h-20">{s.description}</p>
                
                <div className="pt-8 border-t border-atelier-sand">
                  <span className="text-[10px] font-bold text-atelier-clay group-hover:translate-x-2 transition-transform uppercase tracking-[0.3em] flex items-center gap-2">
                    Book Now <Scissors className="w-3 h-3" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Custom refined scroll hints */}
          <div className="md:hidden flex justify-center gap-2 mt-4">
            <div className="w-10 h-1 bg-atelier-sand/30 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-atelier-clay"
                initial={{ width: "20%" }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Services;
