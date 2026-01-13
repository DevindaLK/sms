import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, RefreshCw, X, Share2, Info, AlertCircle } from 'lucide-react';
import { geminiService } from '../geminiService';
import { Hairstyle, AnalysisResult } from '../types';
import toast from 'react-hot-toast';

const VirtualTryOn: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookbook, setLookbook] = useState<string[]>([]);
  const [loadingStep, setLoadingStep] = useState(0);
  const [recommendations, setRecommendations] = useState<Hairstyle[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setImage(base64);
        setResult(null);
        setRecommendations([]);
        setAnalysisResult(null);
        handleRecommend(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecommend = async (base64Image: string) => {
    setIsAnalyzing(true);
    try {
      const rawBase64 = base64Image.split(',')[1];
      const res = await geminiService.analyzeFaceImage(rawBase64);
      
      if (!res.faceDetected) {
        window.alert("Error: No face detected. Please upload a clear portrait showing your face.");
        setImage(null);
        return;
      }

      setAnalysisResult(res);
      setRecommendations(res.recommendations || []);
      toast.success("The Oracle has found your perfect matches!");
    } catch (err) {
      console.error("Recommendation failed:", err);
      toast.error("The Oracle is momentarily clouded. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerTransformation = async (selectedStyle: Hairstyle) => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setLoadingStep(0);

    const steps = [
      "Analyzing facial geometry...",
      "Identifying hair boundaries...",
      "Sculpting neural aesthetic...",
      "Applying studio lighting...",
      "Finalizing manifestation..."
    ];

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      // Use the imagePrompt for the generation and pass the original image as reference
      const generated = await geminiService.generateHairstylePreview(selectedStyle.imagePrompt, image);
      if (generated) {
        setResult(generated);
        setLookbook(prev => [generated, ...prev].slice(0, 4));
        toast.success(`Manifested: ${selectedStyle.name}`);
      } else {
        throw new Error("No image generated");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("The Oracle is currently in deep meditation. Please try again.");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-light tracking-[0.2em] text-atelier-charcoal uppercase leading-tight">
            AI <span className="font-bold text-atelier-clay italic">Oracle</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-[0.4em]">
            Neural gender-aware styling & aesthetic visualization
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-atelier-sand shadow-sm">
          <Info className="w-4 h-4 text-atelier-clay" />
          <p className="text-[9px] font-bold text-atelier-taupe uppercase tracking-widest">
            {isAnalyzing ? "Oracle is analyzing..." : "Front-facing, well-lit portraits yield the truest results"}
          </p>
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
                    onClick={() => { setImage(null); setResult(null); setRecommendations([]); setAnalysisResult(null); }}
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
                    Upload your essence for gender-aware transformation
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
                className="space-y-6"
              >
                {analysisResult && (
                  <div className="bg-white rounded-[40px] p-8 border border-atelier-sand shadow-sm space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black text-atelier-clay uppercase tracking-[0.3em]">
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        {analysisResult.gender?.toUpperCase()} {analysisResult.faceShape} Analysis
                      </span>
                      <span className="text-atelier-charcoal">{analysisResult.skinTone} Tone</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.features.map((f, i) => (
                        <span key={i} className="px-3 py-1 bg-atelier-cream rounded-full text-[8px] font-bold text-atelier-taupe uppercase tracking-widest border border-atelier-sand">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.4em] px-4">AI Recommended Rituals (Select to Manifest)</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.length > 0 ? (
                      recommendations.map(hair => (
                        <motion.button
                          key={hair.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => triggerTransformation(hair)}
                          className="text-left bg-white p-6 rounded-[30px] border border-atelier-sand shadow-sm hover:border-atelier-clay hover:shadow-md transition-all group relative overflow-hidden"
                          disabled={loading}
                        >
                          <div className="space-y-2 relative z-10">
                            <h4 className="text-[11px] font-bold text-atelier-charcoal uppercase tracking-widest group-hover:text-atelier-clay transition-colors">{hair.name}</h4>
                            <p className="text-[9px] text-atelier-taupe leading-relaxed line-clamp-2">{hair.description}</p>
                            <div className="pt-2 flex items-center gap-2 text-[8px] font-bold text-atelier-clay uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                              <Sparkles className="w-3 h-3" /> Invoke Style
                            </div>
                          </div>
                          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-atelier-cream rounded-full blur-2xl group-hover:bg-atelier-nude transition-colors" />
                        </motion.button>
                      ))
                    ) : (
                      [1,2,3,4,5,6].map(i => (
                        <div key={i} className="h-32 bg-atelier-cream/50 rounded-[30px] animate-pulse border border-atelier-sand/50" />
                      ))
                    )}
                  </div>
                </div>
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
                  <div className="text-center space-y-2 px-8">
                    <p className="text-xl font-light tracking-[0.3em] uppercase">Sculpting Aesthetic</p>
                    <p className="text-[9px] text-atelier-clay font-bold uppercase tracking-[0.4em] animate-pulse">
                      {[
                        "Analyzing facial geometry...",
                        "Identifying hair boundaries...",
                        "Sculpting neural aesthetic...",
                        "Applying studio lighting...",
                        "Finalizing manifestation..."
                      ][loadingStep]}
                    </p>
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

          {lookbook.length > 0 && (
            <div className="bg-white rounded-[40px] p-8 border border-atelier-sand shadow-sm space-y-6">
              <h4 className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.3em]">Session Lookbook</h4>
              <div className="grid grid-cols-4 gap-4">
                {lookbook.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-atelier-sand cursor-pointer hover:border-atelier-clay transition-all" onClick={() => setResult(img)}>
                    <img src={img} className="w-full h-full object-cover" alt={`Look ${idx}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-atelier-nude/30 rounded-[40px] p-8 border border-atelier-sand/50">
            <h4 className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.3em] mb-4">Oracle Wisdom</h4>
            <p className="text-[11px] text-atelier-taupe leading-relaxed italic">
              "True style is the intersection of neural precision and individual essence. The Oracle predicts, but the manifestation is your destiny."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;
