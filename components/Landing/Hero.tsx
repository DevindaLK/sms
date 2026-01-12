
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play, Star } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-atelier-cream">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-atelier-nude rounded-l-[300px] -z-10 hidden lg:block opacity-50" />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 2, 0],
        }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-atelier-sage/20 rounded-full blur-[120px] -z-10" 
      />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-atelier-sand/30 px-4 py-2 rounded-full mb-8">
              <Star className="w-3 h-3 text-atelier-clay fill-atelier-clay" />
              <span className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.2em]">Crafted for the Modern Soul</span>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-light text-atelier-charcoal leading-tight tracking-tighter">
              Artisan Style <br /> 
              <span className="font-bold italic text-atelier-clay">Curated by AI.</span>
            </h1>
            <p className="text-lg text-atelier-taupe mt-8 max-w-lg leading-relaxed">
              Step into a sanctuary where master artisan craftsmanship meets intuitive predictive technology. Define your aesthetic with Pawa atelier.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={() => document.getElementById('ai-styler')?.scrollIntoView({ behavior: 'smooth'})}
              className="bg-atelier-charcoal text-white px-10 py-5 rounded-full font-bold text-xs uppercase tracking-widest shadow-2xl hover:bg-atelier-clay transition-all flex items-center gap-2 group"
            >
              The AI Experience <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth'})}
              className="bg-white border border-atelier-sand text-atelier-charcoal px-10 py-5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-atelier-nude transition-all flex items-center gap-3 shadow-sm"
            >
              <div className="bg-atelier-sand/40 p-2 rounded-full text-atelier-clay">
                <Play className="w-3 h-3 fill-atelier-clay" />
              </div>
              Our Menu
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-12 pt-12 border-t border-atelier-sand"
          >
            <div>
              <p className="text-3xl font-bold text-atelier-charcoal">5k+</p>
              <p className="text-[10px] font-bold text-atelier-taupe uppercase tracking-widest">Global Clients</p>
            </div>
            <div className="w-px h-12 bg-atelier-sand" />
            <div>
              <p className="text-3xl font-bold text-atelier-charcoal">12+</p>
              <p className="text-[10px] font-bold text-atelier-taupe uppercase tracking-widest">Master Artists</p>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative px-4 lg:px-0"
        >
          <div className="relative z-10 rounded-[100px] lg:rounded-[200px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(176,141,121,0.2)] border-[16px] border-white">
            <img 
              src="https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2069&auto=format&fit=crop" 
              alt="Artisan Styling" 
              className="w-full aspect-[4/5] object-cover hover:scale-105 transition-transform duration-1000"
            />
          </div>
          
          {/* Subtle Floating Elements */}
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-6 top-20 z-20 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-atelier-nude"
          >
            <div className="flex items-center gap-4">
              <div className="bg-atelier-sage/40 p-2 rounded-lg text-atelier-charcoal font-bold text-[10px] uppercase">98% Match</div>
              <p className="text-xs font-bold text-atelier-charcoal">Bespoke Recommendation</p>
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 7, repeat: Infinity, delay: 1, ease: "easeInOut" }}
            className="absolute -left-6 bottom-20 z-20 bg-atelier-charcoal p-6 rounded-3xl shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-atelier-clay rounded-full flex items-center justify-center text-white font-black italic text-sm">P</div>
              <div>
                <p className="text-[8px] font-black text-atelier-sand uppercase tracking-widest">Next Available</p>
                <p className="text-xs font-bold text-white">Today, 4:00 PM</p>
              </div>
            </div>
          </motion.div>
          {/* Fixed: correctly closed motion.div tag to maintain JSX structural integrity */}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
