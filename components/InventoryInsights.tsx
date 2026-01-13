import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, ArrowUpRight, RefreshCw, Package, TrendingUp } from 'lucide-react';
import { geminiService } from '../geminiService';
import { api } from '../lib/api';

const InventoryInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data } = await api.getInventory(1, 100);
      setInventory(data || []);
      const result = await geminiService.getInventoryInsights(data);
      setInsights(result);
    } catch (err) {
      console.error("Failed to manifest inventory insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="bg-white rounded-[40px] border border-atelier-sand overflow-hidden shadow-sm">
      <div className="p-8 border-b border-atelier-sand flex justify-between items-center bg-atelier-cream/30">
        <div className="flex items-center gap-3">
          <div className="bg-atelier-clay/10 p-3 rounded-2xl">
            <Sparkles className="w-6 h-6 text-atelier-clay" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-atelier-charcoal uppercase tracking-widest">Inventory Oracle</h3>
            <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">Neural Stock Optimization</p>
          </div>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="p-3 bg-white border border-atelier-sand rounded-xl shadow-sm hover:border-atelier-clay transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-atelier-clay ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-8 space-y-8">
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-atelier-clay/20 border-t-atelier-clay rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-black text-atelier-clay uppercase tracking-[0.3em] animate-pulse">Consulting Neural Inventory...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Reorder Alerts */}
              <div className="space-y-4">
                <h4 className="flex items-center gap-2 text-[10px] font-black text-atelier-clay uppercase tracking-[0.3em]">
                  <AlertTriangle className="w-4 h-4" /> Priority Reorders
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights?.reorderAlerts?.map((alert: any, idx: number) => (
                    <div key={idx} className="p-6 bg-atelier-cream rounded-3xl border border-atelier-sand/50 space-y-3 group hover:border-atelier-clay transition-all">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-atelier-charcoal uppercase tracking-widest">{alert.itemName}</span>
                        <span className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-atelier-clay border border-atelier-sand">
                          Order +{alert.suggestedQty}
                        </span>
                      </div>
                      <p className="text-[11px] text-atelier-taupe italic leading-relaxed">"{alert.reasoning}"</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Insight */}
              <div className="bg-atelier-charcoal rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <TrendingUp className="w-24 h-24" />
                </div>
                <div className="relative z-10 space-y-4">
                  <h4 className="text-[10px] font-black text-atelier-nude uppercase tracking-[0.4em]">Oracle Strategy</h4>
                  <p className="text-sm font-light leading-relaxed tracking-wide italic">
                    {insights?.stockStrategy}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="w-8 h-px bg-atelier-nude/30" />
                    <span className="text-[9px] font-bold text-atelier-nude/50 uppercase tracking-widest">Manifested by Gemini AI</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-atelier-sand flex items-center gap-4 bg-white hover:bg-atelier-cream transition-colors cursor-pointer group">
                  <div className="bg-atelier-nude p-2 rounded-xl group-hover:bg-white transition-colors">
                    <Package className="w-4 h-4 text-atelier-clay" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-atelier-clay uppercase tracking-widest">Total SKU's</p>
                    <p className="text-lg font-bold text-atelier-charcoal">{inventory.length}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-atelier-sand flex items-center gap-4 bg-white hover:bg-atelier-cream transition-colors cursor-pointer group">
                  <div className="bg-atelier-sage/10 p-2 rounded-xl group-hover:bg-white transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-atelier-sage" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-atelier-sage uppercase tracking-widest">Active Alerts</p>
                    <p className="text-lg font-bold text-atelier-charcoal">{insights?.reorderAlerts?.length || 0}</p>
                  </div>
                </div>
                <button className="p-4 rounded-2xl bg-atelier-clay text-white flex items-center justify-center gap-2 hover:bg-atelier-charcoal transition-all shadow-lg text-[10px] font-bold uppercase tracking-widest">
                  Generate Purchase Orders
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default InventoryInsights;
