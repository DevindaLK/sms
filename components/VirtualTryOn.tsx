import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, RefreshCw, X, Download, Share2, Info } from 'lucide-react';
import { geminiService } from '../geminiService';
import toast from 'react-hot-toast';

const VirtualTryOn: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState('Classic Pompadour');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    try {
      const base64 = image.split(',')[1];
      const generated = await geminiService.generateHairstyle(base64, style);
      if (generated) {
        setResult(generated);
      } else {
        throw new Error("No image generated");
      }
    } catch (err: any) {
      console.error(err);
      const isQuota = err.message?.includes('429') || err.message?.includes('quota');
      const msg = isQuota 
        ? 'The AI Oracle is currently recharging its neural energy (Quota exceeded). Please try again shortly.'
        : 'The AI Oracle is currently in deep meditation. Please try again in a moment.';
      
      // Attempt to use toast if available, otherwise fallback to alert
      try {
        toast.error(msg);
      } catch {
        alert(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = [
    'Classic Pompadour', 
    'Modern Low Fade', 
    'Textured Buzz Cut', 
    'Sleek Long Bob', 
    'French Crop', 
    'Layered Shag',
    'Curated Taper',
    'Artisan Undercut'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            AI <span className="font-bold text-atelier-clay italic">Oracle</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em]">
            Neural styling & aesthetic visualization
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-atelier-sand shadow-sm">
          <Info className="w-4 h-4 text-atelier-clay" />
          <p className="text-[9px] font-bold text-atelier-taupe uppercase tracking-widest">Front-facing, well-lit portraits yield the truest results</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Input Area */}
        <div className="space-y-10">
          <div className="relative aspect-[4/5] bg-white rounded-[60px] border border-atelier-sand shadow-sm overflow-hidden group">
            <div className="absolute inset-0 bg-atelier-cream/30 -z-10" />
            
            {image ? (
              <>
                <img src={image} className="w-full h-full object-cover animate-in fade-in duration-700" alt="Source" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => { setImage(null); setResult(null); }}
                    className="bg-white/90 p-5 rounded-full hover:bg-white hover:scale-110 transition-all shadow-2xl"
                  >
                    <X className="w-6 h-6 text-atelier-clay" />
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-atelier-nude rounded-full flex items-center justify-center shadow-sm border border-atelier-sand">
                  <Camera className="w-10 h-10 text-atelier-clay" />
                </div>
                <div className="space-y-3">
                  <p className="text-lg font-light text-atelier-charcoal uppercase tracking-widest">Initiate Visualization</p>
                  <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-[0.2em] max-w-[200px] mx-auto leading-relaxed">
                    Upload your essence to begin the neural transformation
                  </p>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-atelier-charcoal text-white px-10 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-atelier-clay transition-all shadow-xl flex items-center gap-3"
                >
                  <Upload className="w-4 h-4" /> Select Portrait
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            )}
          </div>

          <AnimatePresence>
            {image && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[50px] p-10 border border-atelier-sand shadow-sm space-y-8"
              >
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.4em]">Select Desired Aesthetic</p>
                  <div className="grid grid-cols-2 gap-3">
                    {styles.map(s => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`px-5 py-4 text-[9px] font-bold rounded-2xl border transition-all uppercase tracking-widest ${
                          style === s 
                          ? 'bg-atelier-charcoal border-atelier-charcoal text-white shadow-lg' 
                          : 'bg-atelier-cream border-atelier-sand text-atelier-taupe hover:border-atelier-clay'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-atelier-clay text-white py-6 rounded-3xl font-bold flex items-center justify-center gap-4 shadow-2xl hover:bg-atelier-charcoal disabled:opacity-50 transition-all uppercase text-[10px] tracking-[0.4em]"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {loading ? 'Consulting Oracle...' : 'Invoke Transformation'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Output Area */}
        <div className="space-y-10">
          <div className="relative aspect-[4/5] bg-atelier-charcoal rounded-[60px] overflow-hidden shadow-2xl flex items-center justify-center border-8 border-atelier-nude">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            
            {result ? (
              <motion.img 
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                src={result} 
                className="w-full h-full object-cover relative z-10" 
                alt="Transformation"
              />
            ) : (
              <div className="text-center space-y-6 p-12 relative z-10">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                  <Sparkles className="w-10 h-10 text-atelier-clay" />
                </div>
                <div className="space-y-2">
                  <p className="text-atelier-sand/40 text-[10px] font-bold uppercase tracking-[0.5em]">Neural Canvas</p>
                  <p className="text-atelier-sand/20 text-[9px] font-medium uppercase tracking-widest max-w-[180px] mx-auto">
                    Transformations will materialize within this sanctuary
                  </p>
                </div>
              </div>
            )}
            
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-atelier-charcoal/90 backdrop-blur-md z-20 flex flex-col items-center justify-center text-white space-y-8"
                >
                  <div className="relative">
                    <div className="w-24 h-24 border-2 border-atelier-clay/30 rounded-full animate-ping absolute inset-0" />
                    <div className="w-24 h-24 border-t-2 border-atelier-clay rounded-full animate-spin" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xl font-light tracking-[0.3em] uppercase">Sculpting Aesthetic</p>
                    <p className="text-[9px] text-atelier-clay font-bold uppercase tracking-[0.4em] animate-pulse">Gemini AI is analyzing facial geometry</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence>
            {result && !loading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <button 
                  onClick={() => setResult(null)}
                  className="flex-1 bg-white border border-atelier-sand py-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-atelier-charcoal hover:bg-atelier-cream transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <X className="w-4 h-4" /> Clear Vision
                </button>
                <button 
                  className="flex-1 bg-atelier-charcoal text-white py-5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-atelier-clay transition-all flex items-center justify-center gap-2 shadow-xl"
                  onClick={() => alert('Ritual saved to your private lookbook.')}
                >
                  <Share2 className="w-4 h-4" /> Archive Look
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-atelier-nude/30 rounded-[40px] p-8 border border-atelier-sand/50">
            <h4 className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.3em] mb-4">Oracle Wisdom</h4>
            <p className="text-[11px] text-atelier-taupe leading-relaxed italic">
              "True style is the intersection of neural precision and individual essence. The Oracle visualizes possibilities, but the Artisan brings them to life."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;
