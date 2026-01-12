
import React from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import AIFeature from './AIFeature';
import Services from './Services';
import Portfolio from './Portfolio';
import Chronicles from './Chronicles';
import About from './About';
import { motion } from 'framer-motion';
import { MapPin, Phone, Instagram, Facebook, Twitter, Mail } from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="relative w-full overflow-x-hidden selection:bg-atelier-sand selection:text-atelier-charcoal scroll-smooth bg-atelier-cream">
      <Navbar onLogin={onEnterApp} />
      
      <main>
        <div id="home"><Hero /></div>
        <div id="ai-styler"><AIFeature /></div>
        <div id="services"><Services /></div>
        <div id="portfolio"><Portfolio /></div>
        <div id="chronicles"><Chronicles /></div>
        <div id="about"><About /></div>

        {/* Contact / Map Section */}
        <section id="contact" className="py-32 bg-white text-atelier-charcoal relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-atelier-sand/20 rounded-full blur-[120px] -z-10" />
          
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="space-y-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <p className="text-[10px] font-bold text-atelier-clay uppercase tracking-[0.4em]">The Studio</p>
                <h2 className="text-5xl font-light text-atelier-charcoal tracking-tighter">Enter the Sanctuary.</h2>
                <p className="text-atelier-taupe text-lg max-w-md">Our atelier in Soho is designed for complete sensory relaxation and stylistic precision.</p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="flex items-start gap-6">
                  <div className="bg-atelier-nude p-4 rounded-full text-atelier-clay border border-atelier-sand">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1 uppercase tracking-widest">Location</h4>
                    <p className="text-atelier-taupe text-sm">Pawa Atelier, No. 8 Esther Place<br />Colombo 05 </p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="bg-atelier-nude p-4 rounded-full text-atelier-clay border border-atelier-sand">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-1 uppercase tracking-widest">Inquiries</h4>
                    <p className="text-atelier-taupe text-sm">Direct: +94 755 232 677 PAWA<br />Email: saloon@pawa.atelier</p>
                  </div>
                </div>
              </div>

              <div className="bg-atelier-cream rounded-[50px] p-10 border border-atelier-sand shadow-sm">
                <h4 className="font-bold text-xs mb-8 text-atelier-clay uppercase tracking-[0.3em]">Atelier Schedule</h4>
                <div className="space-y-5">
                  {[
                    { day: 'Monday - Friday', hours: '10:00 AM - 8:00 PM' },
                    { day: 'Saturday', hours: '09:00 AM - 6:00 PM' },
                    { day: 'Sunday', hours: 'Curated Appointments' }
                  ].map((item) => (
                    <div key={item.day} className="flex justify-between items-center pb-4 border-b border-atelier-sand last:border-0 last:pb-0">
                      <span className="font-medium text-atelier-charcoal text-sm">{item.day}</span>
                      <span className="text-atelier-taupe text-xs">{item.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative rounded-[100px] overflow-hidden shadow-2xl h-[600px] lg:h-auto border-8 border-atelier-nude">
              <img 
                src="https://images.unsplash.com/photo-1563911302283-d2bc129e7570?q=80&w=1935&auto=format&fit=crop" 
                className="w-full h-full object-cover grayscale-[0.4] opacity-90"
                alt="Pawa atelier Studio"
              />
              <div className="absolute inset-0 bg-atelier-clay/5 mix-blend-overlay" />
              <div className="absolute bottom-10 left-10 right-10 bg-atelier-charcoal p-8 rounded-[40px] flex items-center justify-between shadow-2xl">
                <div>
                  <p className="text-[9px] font-black text-atelier-sand uppercase tracking-widest mb-1">Guided Path</p>
                  <p className="font-bold text-white text-sm">Navigate to Studio</p>
                </div>
                <button className="bg-white text-atelier-charcoal p-4 rounded-full shadow-lg hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-atelier-charcoal py-24 text-atelier-sand">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <span className="text-3xl font-light tracking-[0.3em] text-white uppercase">PAWA <span className="font-bold text-atelier-clay">ATELIER</span></span>
              <p className="text-atelier-sand/60 max-w-sm leading-relaxed text-sm">
                A sanctuary of style and silence. We blend ancient grooming traditions with futuristic intelligence to reveal your truest aesthetic.
              </p>
              <div className="flex gap-4">
                {[Instagram, Facebook, Twitter].map((Icon, i) => (
                  <button key={i} className="p-4 bg-white/5 rounded-full hover:bg-atelier-clay transition-all border border-white/5 text-white">
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-8">
              <h5 className="font-bold uppercase tracking-[0.3em] text-[10px] text-atelier-clay">Discovery</h5>
              <ul className="space-y-4 text-atelier-sand/50 font-medium text-xs uppercase tracking-widest">
                <li><a href="#" className="hover:text-white transition-colors">The Salon</a></li>
                <li><a href="#services" className="hover:text-white transition-colors">Menu of Rituals</a></li>
                <li><a href="#ai-styler" className="hover:text-white transition-colors">Neural Styling</a></li>
                <li><a href="#portfolio" className="hover:text-white transition-colors">Lookbook</a></li>
              </ul>
            </div>

            <div className="space-y-8">
              <h5 className="font-bold uppercase tracking-[0.3em] text-[10px] text-atelier-clay">Concierge</h5>
              <p className="text-[10px] text-atelier-sand/50 font-bold uppercase tracking-widest leading-loose">Join our private circle</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Inquiry@domain.com" 
                  className="w-full bg-white/5 border border-white/10 rounded-full py-5 px-8 text-xs focus:outline-none focus:border-atelier-clay transition-all placeholder:text-atelier-sand/30"
                />
                <button className="absolute right-2 top-2 bg-atelier-clay p-3 rounded-full shadow-lg hover:bg-white hover:text-atelier-charcoal transition-all">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-bold uppercase tracking-[0.4em] text-atelier-sand/30 text-center md:text-left">
            <p>&copy; 2024 PAWA ATELIER LUXURY. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-10">
              <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
              <span className="cursor-pointer hover:text-white transition-colors">Legal</span>
              <span className="cursor-pointer hover:text-white transition-colors">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
