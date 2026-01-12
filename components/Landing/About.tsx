
import React from 'react';
import { motion } from 'framer-motion';
import { Star, Award, ShieldCheck, Heart } from 'lucide-react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-32 bg-atelier-cream">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 rounded-[120px] lg:rounded-[240px] overflow-hidden shadow-2xl border-[12px] border-white">
              <img 
                src="https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?q=80&w=2070&auto=format&fit=crop" 
                alt="The Atelier Curator" 
                className="w-full aspect-square object-cover"
              />
            </div>
            {/* Experience Badge */}
            <div className="absolute -bottom-10 -right-4 z-20 bg-atelier-charcoal text-white p-12 rounded-[60px] shadow-2xl border-8 border-atelier-cream">
              <p className="text-5xl font-light mb-1 tracking-tighter">10<span className="text-atelier-clay font-bold">+</span></p>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-tight text-atelier-sand/50">Years of <br /> Mastery</p>
            </div>
          </motion.div>

          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <p className="text-[10px] font-bold text-atelier-clay uppercase tracking-[0.4em]">Our Philosophy</p>
              <h2 className="text-5xl md:text-6xl font-light text-atelier-charcoal leading-none tracking-tighter">
                Revealing <br /> <span className="italic font-bold text-atelier-clay underline decoration-atelier-sand">Inherent Beauty.</span>
              </h2>
              <p className="text-lg text-atelier-taupe leading-relaxed">
                Founded on the principle that styling is a form of architectural curation, Pawa atelier merges silence, luxury, and intelligence. We do not just alter your appearance; we refine your identity.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              {[
                { icon: Award, title: "Artisan Certified", desc: "Our team possesses master certifications in structural geometry." },
                { icon: ShieldCheck, title: "Purity Focus", desc: "Bio-organic product lines and medical-grade sanctuary protocols." },
                { icon: Star, title: "The Suite Ritual", desc: "Private consultation suites with digital neural mapping." },
                { icon: Heart, title: "Ethical Sourcing", desc: "Active commitment to sustainable and fair-trade beauty." }
              ].map((item, i) => (
                <div key={i} className="flex gap-5">
                  <div className="shrink-0 w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-atelier-clay shadow-sm border border-atelier-nude">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-atelier-charcoal mb-2 uppercase text-[10px] tracking-widest">{item.title}</h4>
                    <p className="text-xs text-atelier-taupe leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
