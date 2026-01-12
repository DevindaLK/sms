
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles, LogIn, UserPlus } from 'lucide-react';

interface NavbarProps {
  onLogin: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'AI Makeover', href: '#ai-styler' },
    { name: 'Services', href: '#services' },
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Chronicles', href: '#chronicles' },
    { name: 'About', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
      scrolled ? 'py-4 bg-atelier-cream/80 backdrop-blur-xl border-b border-atelier-sand shadow-sm' : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="bg-atelier-clay p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-[0.2em] text-atelier-charcoal uppercase">PAWA ATELIER</span>
        </motion.div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.name}
              href={link.href}
              onClick={(e) => scrollToSection(e, link.href)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-xs font-bold text-atelier-taupe hover:text-atelier-clay transition-colors uppercase tracking-widest"
            >
              {link.name}
            </motion.a>
          ))}
          
          <div className="flex items-center gap-4 ml-4">
            {/* <button
              onClick={onLogin}
              className="text-xs font-bold text-atelier-charcoal hover:text-atelier-clay flex items-center gap-2 px-4 py-2 transition-colors uppercase tracking-widest"
            >
              <LogIn className="w-4 h-4 text-atelier-clay" /> Portal
            </button> */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogin} // Triggers the unified auth entry which handles login/signup
              className="bg-atelier-charcoal text-white px-8 py-3 rounded-full font-bold text-[10px] shadow-lg hover:bg-atelier-clay transition-all uppercase tracking-[0.2em] flex items-center gap-2"
            >
             <LogIn className="w-4 h-4 text-atelier-clay" />  Sign In
            </motion.button>
          </div>
        </div>

        {/* Mobile Toggle */}
        <button className="lg:hidden p-2 text-atelier-charcoal" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-atelier-cream border-b border-atelier-sand overflow-hidden"
          >
            <div className="p-6 space-y-4">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="block text-sm font-bold text-atelier-charcoal uppercase tracking-widest"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-atelier-sand space-y-3">
                <button 
                  onClick={onLogin}
                  className="w-full bg-atelier-sand text-atelier-charcoal py-4 rounded-xl font-bold flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                >
                  <LogIn className="w-5 h-5 text-atelier-clay" /> Portal Access
                </button>
                <button 
                  onClick={onLogin}
                  className="w-full bg-atelier-charcoal text-white py-4 rounded-xl font-bold shadow-lg uppercase text-xs tracking-widest flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Join Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
