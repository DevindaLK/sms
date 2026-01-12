
import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { api } from '../lib/api';
import { geminiService } from '../geminiService';
import { ShoppingBag, TrendingUp, Users, DollarSign, Package, Sparkles, BrainCircuit, Image as ImageIcon, Plus, Upload, X, CheckCircle, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';


const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { label: 'Total Revenue', value: 'Rs.0', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Profit', value: 'Rs.0', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Active Stylists', value: '0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Low Stock Items', value: '0', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<{peakHours: string, suggestions: string[]} | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoadingStats(true);
    setLoadingInsights(true);
    try {
      const [artisans, inventoryRes, report] = await Promise.all([
        api.getArtisans(),
        api.getInventory(1, 1000),
        api.getSalesReport(),
      ]);

      const lowStock = (inventoryRes.data || []).filter((i: any) => i.current_stock <= i.min_stock_level).length;

      setStats([
        { label: 'Total Revenue', value: `Rs.${report.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Total Profit', value: `Rs.${report.totalProfit.toLocaleString()}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Active Stylists', value: artisans.length.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Low Stock Items', value: lowStock.toString(), icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
      ]);
      setSalesReport(report);
      setPerformanceData(report.performance);
      
      // Get insights based on real performance
      const insights = await geminiService.getSmartInsights(report.performance);
      setAiInsights(insights);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
      setLoadingInsights(false);
    }
  };

  const fetchInsights = async () => {
    if (!performanceData.length) return;
    setLoadingInsights(true);
    try {
      const insights = await geminiService.getSmartInsights(performanceData);
      setAiInsights(insights);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('429') || e.message?.includes('quota')) {
        toast.error('AI Insights are resting to preserve neural power (Limit reached).');
      }
    } finally {
      setLoadingInsights(false);
    }
  };

  const downloadReport = () => {
    if (!salesReport) return;
    
    setIsExporting(true);
    try {
      const boutiqueRows = (salesReport.allSales || []).map((sale: any) => ({
        date: new Date(sale.created_at),
        type: 'Product',
        customer: sale.customer?.full_name || 'Guest',
        reference: `${sale.items?.length || 0} Items`,
        total: sale.total_amount
      }));

      const ritualRows = (salesReport.allAppointments || []).map((apt: any) => ({
        date: new Date(apt.start_time),
        type: 'Service',
        customer: apt.customer?.full_name || 'Guest',
        reference: apt.service?.name || 'Ritual',
        total: apt.total_price || 0
      }));

      const mergedRows = [...boutiqueRows, ...ritualRows].sort((a, b) => b.date.getTime() - a.date.getTime());

      const headers = ['Date', 'Type', 'Customer', 'Reference', 'Amount (Rs.)'];
      const rows = mergedRows.map(r => [
        r.date.toLocaleString(),
        r.type,
        r.customer,
        r.reference,
        r.total
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((r: any) => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `GlowUp_Executive_Chronicle_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Executive Chronicle Exported Successfully");
    } catch (e) {
      toast.error("Failed to manifest executive report");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-atelier-sand shadow-sm flex items-center space-x-4">
            <div className={`p-3 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <p className="text-[8px] md:text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl md:text-2xl font-bold text-atelier-charcoal tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-[10px] md:text-sm font-bold text-atelier-charcoal uppercase tracking-[0.2em]">Revenue Performance</h3>
            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2 md:w-3 h-2 md:h-3 bg-atelier-clay rounded-full"></span>
                <span className="text-[8px] md:text-[10px] font-bold text-atelier-taupe uppercase">Boutique Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 md:w-3 h-2 md:h-3 bg-atelier-sage rounded-full"></span>
                <span className="text-[8px] md:text-[10px] font-bold text-atelier-taupe uppercase">Ritual Services</span>
              </div>
            </div>
          </div>
          <div className="h-60 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B08D79" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#B08D79" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSvc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8DA399" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8DA399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5D3C5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#8C7B6E', fontSize: 8, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8C7B6E', fontSize: 8, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px'}}
                  formatter={(value: any, name: string) => [
                    `Rs.${value.toLocaleString()}`, 
                    name === 'productRevenue' ? 'Boutique Sales' : 'Ritual Services'
                  ]}
                />
                <Area type="monotone" dataKey="productRevenue" name="productRevenue" stroke="#B08D79" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="serviceRevenue" name="serviceRevenue" stroke="#8DA399" strokeWidth={2} fillOpacity={1} fill="url(#colorSvc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-atelier-charcoal p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white shadow-xl relative overflow-hidden flex flex-col min-h-[400px]">
          <div className="absolute top-0 right-0 p-12 opacity-5 hidden md:block">
            <BrainCircuit className="w-64 h-64" />
          </div>
          
          <div className="relative space-y-6 flex-1">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-atelier-clay" />
              <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-[0.2em]">AI Insights</h3>
            </div>
            
            {loadingInsights ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-20 bg-white/5 rounded"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-atelier-sand/50 text-[10px] font-bold uppercase tracking-widest mb-2">Peak Forecast</p>
                  <p className="text-base md:text-lg font-light italic">{aiInsights?.peakHours || 'Analyzing patterns...'}</p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-atelier-sand/50 text-[10px] font-bold uppercase tracking-widest">Service Optimization</p>
                  <ul className="space-y-3">
                    {aiInsights?.suggestions.map((s, i) => (
                      <li key={i} className="bg-white/5 p-4 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] backdrop-blur-md border border-white/10 flex items-start space-x-3 group hover:bg-white/10 transition-all">
                        <span className="bg-atelier-clay text-white w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">{i+1}</span>
                        <span className="text-atelier-sand/90 leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={fetchInsights}
            disabled={loadingInsights}
            className="w-full py-3 md:py-4 mt-6 md:mt-8 bg-white/10 border border-white/20 text-white rounded-xl md:rounded-2xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-atelier-clay transition-all disabled:opacity-50"
          >
            Refresh Predictions
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-atelier-cream p-6 md:p-10 rounded-[40px] md:rounded-[60px] border border-atelier-sand flex flex-col justify-center items-center text-center space-y-6">
          <div className="bg-white p-4 md:p-6 rounded-full shadow-sm text-atelier-clay">
            <DollarSign className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg md:text-xl font-bold text-atelier-charcoal uppercase tracking-[0.2em]">Financial Chronicles</h3>
            <p className="text-[9px] md:text-[10px] text-atelier-taupe font-bold uppercase tracking-widest max-w-xs leading-relaxed">Manifest your business growth into a digital document for executive review.</p>
          </div>
          <button
            onClick={downloadReport}
            disabled={isExporting || !salesReport}
            className="px-8 md:px-10 py-4 md:py-5 bg-atelier-charcoal text-white rounded-[20px] md:rounded-3xl font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] shadow-2xl hover:bg-atelier-clay transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            {isExporting ? 'Exporting...' : 'Download Executive Report'}
          </button>
        </div>

        <div className="bg-white p-4 md:p-8 rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-sm space-y-6 md:space-y-8 flex flex-col">
          <div className="space-y-1">
            <h3 className="text-[10px] md:text-sm font-bold text-atelier-charcoal uppercase tracking-[0.2em]">Top Selling Products</h3>
            <p className="text-[8px] md:text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">Most sought after products</p>
          </div>

          <div className="flex-1 space-y-3 md:space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {salesReport && Object.entries(salesReport.itemSales).sort((a: any, b: any) => b[1].quantity - a[1].quantity).slice(0, 5).map(([id, data]: [string, any]) => (
              <div key={id} className="p-4 md:p-6 bg-atelier-cream rounded-[24px] md:rounded-[32px] border border-atelier-sand flex items-center justify-between group hover:border-atelier-clay transition-colors">
                <div className="flex items-center gap-3 md:gap-5">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-atelier-nude rounded-xl md:rounded-2xl flex items-center justify-center text-atelier-clay shadow-sm overflow-hidden">
                    <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] md:text-sm font-bold text-atelier-charcoal uppercase tracking-widest truncate max-w-[120px] md:max-w-none">{data.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[8px] md:text-[9px] text-atelier-taupe font-bold uppercase tracking-widest">{data.quantity} Sold • Rs.{data.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] md:text-[10px] font-black text-atelier-sage uppercase tracking-widest">+Rs.{data.profit.toLocaleString()}</p>
                  <p className="text-[7px] md:text-[8px] text-atelier-sand font-bold uppercase tracking-widest">Profit</p>
                </div>
              </div>
            ))}
            {!salesReport && (
              <div className="h-full flex items-center justify-center opacity-40">
                <p className="text-[10px] font-bold uppercase tracking-widest">No sales data yet</p>
              </div>
            )}
          </div>

          <div className="pt-4 md:pt-6 border-t border-atelier-sand flex justify-center">
            <button className="text-[9px] md:text-[10px] font-bold text-atelier-clay uppercase tracking-[0.4em] hover:underline underline-offset-8">
              View Full Sales Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
