
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, User, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onReturnHome: () => void;
  onGoToSignup: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onReturnHome, onGoToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both credentials to access the portal.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      toast.success("Welcome back to the Atelier");
      onLoginSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-atelier-cream flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-atelier-nude rounded-full blur-[120px] -z-10 opacity-60 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-atelier-sage/20 rounded-full blur-[120px] -z-10 opacity-60 -translate-x-1/2 translate-y-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-10 md:p-14 rounded-[60px] shadow-2xl max-w-md w-full space-y-10 border border-atelier-sand relative z-10"
      >
        <button 
          onClick={onReturnHome}
          className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-bold text-atelier-taupe hover:text-atelier-clay uppercase tracking-[0.2em] transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Return Home
        </button>

        <div className="text-center space-y-4 pt-4">
          <div className="w-20 h-20 bg-atelier-nude rounded-3xl flex items-center justify-center mx-auto shadow-sm rotate-3">
            <Sparkles className="w-10 h-10 text-atelier-clay" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-light tracking-[0.3em] text-atelier-charcoal uppercase">
              The <span className="font-bold text-atelier-clay">Portal</span>
            </h1>
            <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-widest">Identify yourself to the atelier</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Identifier</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Atelier Key / Email"
                className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-2xl py-4 pl-14 pr-6 text-sm outline-none transition-all placeholder:text-atelier-sand"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Passcode</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-2xl py-4 pl-14 pr-6 text-sm outline-none transition-all placeholder:text-atelier-sand"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-atelier-charcoal text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl hover:bg-atelier-clay transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Verifying...' : 'Enter Atelier'}
            </button>
          </div>
        </form>

        <p className="text-center text-[9px] font-bold text-atelier-sand uppercase tracking-[0.2em] pt-4">
          Not a member yet? <span onClick={onGoToSignup} className="text-atelier-clay cursor-pointer hover:underline">Become a Member</span>
        </p>

        <p className="text-center text-[9px] font-bold text-atelier-sand uppercase tracking-[0.2em]">
          Lost your credentials? <span className="text-atelier-clay cursor-pointer hover:underline">Contact Concierge</span>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
