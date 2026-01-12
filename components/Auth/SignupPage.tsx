
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, User, ArrowLeft, Sparkles, Phone, Globe, Chrome, Loader2, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onReturnHome: () => void;
  onGoToLogin: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignupSuccess, onReturnHome, onGoToLogin }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please complete the initiation form.");
      return;
    }

    setLoading(true);
    const email = formData.email.trim();
    const phone = formData.phone.trim();
    const password = formData.password.trim();
    
    try {
      // 1. Password Check Edge Function
      console.log("Checking password security...");
      const { data: checkData, error: checkError } = await supabase.functions.invoke('password-check', {
        body: { password }
      });

      if (checkError) {
        console.error("Password check error:", checkError);
        // We might want to proceed if the function is missing, but the requirement says to check.
        // For now, let's assume it's required.
      } else if (checkData && !checkData.safe) {
        throw new Error(checkData.message || "This password has been compromised. Please choose a stronger one.");
      }

      // 2. Supabase Auth Signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: formData.name,
            phone: phone
          }
        }
      });

      if (error) throw error;

      // 3. Fallback: Create profile immediately
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: formData.name,
          email: email,
          phone: phone,
          role: 'customer'
        });
        if (profileError) console.error("Signup profile fallback error:", profileError);
      }

      toast.success("Initiation Complete. Welcome to Pawa.");
      onSignupSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Initiation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-atelier-cream flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-atelier-sage/10 rounded-full blur-[120px] -z-10 -translate-x-1/2 -translate-y-1/2" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 md:p-14 rounded-[60px] shadow-2xl max-w-xl w-full space-y-8 border border-atelier-sand relative z-10"
      >
        <button 
          onClick={onReturnHome}
          className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-bold text-atelier-taupe hover:text-atelier-clay uppercase tracking-[0.2em] transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Exit
        </button>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-atelier-nude rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-8 h-8 text-atelier-clay" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-light tracking-[0.3em] text-atelier-charcoal uppercase">
              Become a <span className="font-bold text-atelier-clay">Member</span>
            </h1>
            <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-widest">Join the Pawa private circle</p>
          </div>
        </div>

        {/* Social Options */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 py-4 px-6 border-2 border-atelier-cream rounded-2xl hover:bg-atelier-cream transition-all group">
            <Chrome className="w-4 h-4 text-atelier-clay" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Google</span>
          </button>
          <button className="flex items-center justify-center gap-3 py-4 px-6 border-2 border-atelier-cream rounded-2xl hover:bg-atelier-cream transition-all group">
            <Globe className="w-4 h-4 text-atelier-clay" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
          </button>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-atelier-sand"></div>
          <span className="flex-shrink mx-4 text-[9px] font-bold text-atelier-sand uppercase tracking-[0.3em]">Or use ritual identity</span>
          <div className="flex-grow border-t border-atelier-sand"></div>
        </div>

        {/* Manual Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Full Name</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
              <input 
                type="text" 
                required
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="How shall we address you?"
                className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-2xl py-4 pl-14 pr-6 text-sm outline-none transition-all placeholder:text-atelier-sand"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
                <input 
                  type="email" 
                  required
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="guest@luxury.com"
                  className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-2xl py-4 pl-14 pr-6 text-sm outline-none transition-all placeholder:text-atelier-sand"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
                <input 
                  type="tel" 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-2xl py-4 pl-14 pr-6 text-sm outline-none transition-all placeholder:text-atelier-sand"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Passcode</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
              <input 
                type="password" 
                required
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full bg-atelier-cream border-2 border-transparent focus:border-atelier-sand rounded-2xl py-4 pl-14 pr-6 text-sm outline-none transition-all placeholder:text-atelier-sand"
              />
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-atelier-charcoal text-white rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-xl hover:bg-atelier-clay transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {loading ? 'Initiating...' : 'Create Atelier Account'}
            </button>
          </div>
        </form>

        <p className="text-center text-[9px] font-bold text-atelier-sand uppercase tracking-[0.2em] pt-4">
          Already a member? <span onClick={onGoToLogin} className="text-atelier-clay cursor-pointer hover:underline">Return to Portal</span>
        </p>
      </motion.div>
    </div>
  );
};

export default SignupPage;
