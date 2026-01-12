
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Sparkles, BrainCircuit, Cpu, Camera, Upload, RefreshCw, X, Check } from 'lucide-react';
import { geminiService } from '../../geminiService';
import toast from 'react-hot-toast';

const AIFeature: React.FC = () => {
  const [currentAutoStyle, setCurrentAutoStyle] = useState(0);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoStyles = [
    { name: 'Textured Crop', img: 'https://images.unsplash.com/photo-1621605815841-aa33c6ce6626?w=600&auto=format&fit=crop' },
    { name: 'Classic Pomp', img: 'https://images.unsplash.com/photo-1599351431247-f10f2042739a?w=600&auto=format&fit=crop' },
    { name: 'Modern Fade', img: 'https://images.unsplash.com/photo-1503910368127-b459c72b55ce?w=600&auto=format&fit=crop' }
  ];

  const suggestedStyles = [
    'Textured Crop', 'Classic Pomp', 'Modern Fade', 
    'Long Bob', 'Buzz Cut', 'French Crop'
  ];

  useEffect(() => {
    if (userImage || isAnalyzing) return;
    const timer = setInterval(() => {
      setCurrentAutoStyle((prev) => (prev + 1) % autoStyles.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [userImage, isAnalyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUserImage(ev.target?.result as string);
        setGeneratedImage(null);
        setSelectedStyle(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (style: string) => {
    if (!userImage) return;
    setSelectedStyle(style);
    setIsAnalyzing(true);
    try {
      const base64 = userImage.split(',')[1];
      const result = await geminiService.generateHairstyle(base64, style);
      setGeneratedImage(result);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        toast.error('The AI Oracle is resting to preserve its power (Limit reached). Please try again in a few moments.');
      } else {
        toast.error('The Atelier oracle is temporarily busy. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setUserImage(null);
    setGeneratedImage(null);
    setSelectedStyle(null);
    setIsAnalyzing(false);
  };

  return (
    <section id="ai-styler" className="py-32 bg-atelier-charcoal text-white overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-atelier-clay/10 rounded-full blur-[140px]" />
      
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 text-atelier-sand">
              <BrainCircuit className="w-8 h-8" />
              <span className="text-xs font-bold uppercase tracking-[0.4em]">Future Visualization</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-light leading-tight tracking-tighter">
              Aesthetics <br /> 
              <span className="font-bold text-atelier-sand italic underline decoration-atelier-clay">Engineered by AI.</span>
            </h2>
            <p className="text-lg text-atelier-sand/70 leading-relaxed max-w-lg">
              Experience the Pawa Mirror. Upload your portrait and explore six signature rituals curated for your unique geometry.
            </p>
          </motion.div>

          {!userImage ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 hover:border-atelier-clay transition-colors group">
                <Cpu className="w-8 h-8 text-atelier-sand mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-bold mb-2 uppercase tracking-widest text-xs">Biometric Mapping</h4>
                <p className="text-sm text-atelier-sand/50">Mathematical analysis of your facial symmetry for the perfect fit.</p>
              </div>
              <div className="p-8 bg-white/5 rounded-[40px] border border-white/10 hover:border-atelier-clay transition-colors group">
                <Scan className="w-8 h-8 text-atelier-sand mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-lg font-bold mb-2 uppercase tracking-widest text-xs">Neural Rendering</h4>
                <p className="text-sm text-atelier-sand/50">Experience high-fidelity virtual previews of artisan cuts.</p>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-white/5 rounded-[40px] border border-atelier-clay/30 space-y-6"
            >
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold uppercase tracking-widest text-atelier-sand">Select a Ritual Suggestion</p>
                <button onClick={reset} className="text-atelier-clay hover:text-white transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {suggestedStyles.map(style => (
                  <button
                    key={style}
                    onClick={() => handleGenerate(style)}
                    disabled={isAnalyzing}
                    className={`py-3 px-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-between ${
                      selectedStyle === style 
                      ? 'bg-atelier-clay border-atelier-clay text-white shadow-lg' 
                      : 'bg-white/5 border-white/10 text-atelier-sand hover:border-atelier-clay'
                    }`}
                  >
                    {style}
                    {selectedStyle === style && !isAnalyzing && <Check className="w-3 h-3"/>}
                    {selectedStyle === style && isAnalyzing && <RefreshCw className="w-3 h-3 animate-spin"/>}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {!userImage && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-atelier-clay text-white px-10 py-5 rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-atelier-sand hover:text-atelier-charcoal transition-all shadow-2xl"
            >
              <Camera className="w-5 h-5" /> Activate AI Mirror
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>

        <div className="relative justify-self-center lg:justify-self-end">
          {/* Phone Mockup UI */}
          <div className="relative w-[340px] h-[680px] bg-atelier-charcoal rounded-[60px] p-4 border-8 border-white/10 shadow-[0_0_100px_rgba(176,141,121,0.3)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-atelier-charcoal rounded-b-3xl z-30" />
            
            <div className="relative w-full h-full bg-atelier-charcoal rounded-[45px] overflow-hidden border border-white/5">
              <AnimatePresence mode="wait">
                {generatedImage ? (
                  <motion.img 
                    key="generated"
                    src={generatedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full object-cover"
                  />
                ) : userImage ? (
                  <motion.img 
                    key="user"
                    src={userImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full object-cover opacity-60"
                  />
                ) : (
                  <motion.img 
                    key={currentAutoStyle}
                    src={autoStyles[currentAutoStyle].img}
                    initial={{ opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 0.7, filter: 'blur(0px)' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="w-full h-full object-cover"
                  />
                )}
              </AnimatePresence>

              {/* Scanning Line Animation - Active during analysis */}
              {(isAnalyzing || (!userImage)) && (
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: isAnalyzing ? 2 : 6, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-atelier-clay to-transparent z-20 shadow-[0_0_30px_#B08D79]"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-atelier-charcoal via-transparent to-transparent z-10" />
              
              <div className="absolute bottom-12 left-8 right-8 z-20 space-y-4 text-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.3em]">
                    {isAnalyzing ? 'Processing Anatomy' : generatedImage ? 'Atelier Transformation' : userImage ? 'Portrait Locked' : 'Neural Pick'}
                  </p>
                  <p className="text-3xl font-light italic text-white tracking-tight">
                    {isAnalyzing ? 'Analyzing...' : generatedImage ? selectedStyle : userImage ? 'Ready' : autoStyles[currentAutoStyle].name}
                  </p>
                </div>
                {!generatedImage && !userImage && (
                  <div className="flex justify-between items-center text-[8px] font-bold text-atelier-sand border-t border-white/10 pt-4 uppercase tracking-widest">
                    <span>Confidence: 94%</span>
                    <span>Match: Perfect</span>
                  </div>
                )}
              </div>

              {/* Status Indicator Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-atelier-charcoal/60 backdrop-blur-md flex flex-col items-center justify-center z-30">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-2 border-atelier-clay/30 rounded-full animate-ping absolute inset-0" />
                    <div className="w-16 h-16 border-t-2 border-atelier-clay rounded-full animate-spin" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-atelier-sand animate-pulse">
                      {selectedStyle ? `Sculpting ${selectedStyle}...` : 'Mapping Geometry...'}
                    </p>
                    <p className="text-[8px] text-atelier-sand/40 uppercase tracking-[0.2em]">Neural Rendering in progress</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="absolute -bottom-6 -right-6 bg-atelier-clay p-6 rounded-full shadow-2xl animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIFeature;
