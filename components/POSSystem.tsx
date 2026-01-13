import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  X, 
  Package,
  RefreshCw,
  DollarSign,
  User as UserIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import Pagination from './Shared/Pagination';
import { History as HistoryIcon, LayoutGrid } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  sell_price: number;
  quantity: number;
  current_stock: number;
  image_url?: string;
}

const POSSystem: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('card');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [lastSale, setLastSale] = useState<{ items: CartItem[], total: number, sscl: number, subtotal: number, date: Date, received?: number, balance?: number } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string, full_name: string } | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [view, setView] = useState<'terminal' | 'history'>('terminal');
  const [sales, setSales] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (view === 'terminal') {
      fetchInventory();
    } else {
      fetchSales();
    }
  }, [view, currentPage]);

  useEffect(() => {
    if (customerSearch.length > 1) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  const searchCustomers = async () => {
    try {
      const { data } = await api.getCustomers(1, 10);
      // Client-side filter for simplicity since getCustomers is simple
      const filtered = (data || []).filter((c: any) => 
        c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(customerSearch.toLowerCase())
      );
      setCustomers(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInventory = async () => {
    try {
      const data = await api.getInventory(1, 100);
      setItems(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, count } = await api.getSales(currentPage, pageSize);
      setSales(data || []);
      setTotalItems(count || 0);
    } catch (e) {
      toast.error("Failed to summon the sales history");
    } finally {
      setLoading(false);
    }
  };

  // Helper to get available stock considering items already in cart
  const getAvailableStock = (productId: string): number => {
    const product = items.find(i => i.id === productId);
    if (!product) return 0;
    const cartItem = cart.find(ci => ci.id === productId);
    return product.current_stock - (cartItem ? cartItem.quantity : 0);
  };

  const addToCart = (product: any) => {
    if (getAvailableStock(product.id) <= 0) {
      toast.error("Product out of stock");
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (getAvailableStock(product.id) <= 0) {
          toast.error("Cannot exceed available stock");
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (delta > 0 && getAvailableStock(id) <= 0) {
          toast.error("Cannot exceed available stock");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);
  const sscl = subtotal * 0.025; // 2.5% SSCL
  const total = subtotal + sscl;
  const balance = paymentMethod === 'cash' && receivedAmount ? parseFloat(receivedAmount) - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0 || processing) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const sale = {
        total_amount: total,
        sscl: sscl,
        discount: 0,
        payment_method: paymentMethod,
        customer_id: selectedCustomer?.id || user?.id,
        received_amount: paymentMethod === 'cash' ? parseFloat(receivedAmount) : total,
        balance_amount: balance
      };

      const saleData = {
        items: [...cart],
        total,
        sscl,
        subtotal,
        date: new Date(),
        received: paymentMethod === 'cash' ? parseFloat(receivedAmount) : total,
        balance: balance
      };

      await api.createSale(sale, cart);
      
      setLastSale(saleData);
      
      // Show success modal FIRST to ensure UI is ready
      setShowSuccess(true);
      setCart([]);
      setReceivedAmount('');
      setSelectedCustomer(null);
      setCustomerSearch('');
      
      // Wait a bit to ensure the DB trigger has finished processing
      setTimeout(async () => {
        await fetchInventory();
      }, 1000);
      
      // Then trigger PDF generation and print if autoPrint is enabled
      if (autoPrint) {
        setTimeout(() => {
          generateReceiptPDF(saleData, true); // Pass true to auto-close
        }, 500);
      }
      
      toast.success("Sale Completed Successfully");
    } catch (e: any) {
      console.error("Checkout Error:", e);
      // If it's a schema cache error, we can hint to the user
      if (e.message?.includes("schema cache")) {
        toast.error("Database updating... Please try one more time.");
      } else {
        toast.error("Checkout failed. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const generateReceiptPDF = (saleDataOverride?: any, autoCloseModal: boolean = false) => {
    const sale = saleDataOverride || lastSale;
    if (!sale || !sale.date) {
      console.error("Missing sale data for receipt generation");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(60, 50, 45); // atelier-charcoal
    doc.text("PAWA SALON", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text("Professional Salon Management", pageWidth / 2, 28, { align: 'center' });
    doc.text("123 Artisan Way, Neural District", pageWidth / 2, 33, { align: 'center' });
    
    doc.setDrawColor(229, 211, 197); // atelier-sand
    doc.line(20, 40, pageWidth - 20, 40);

    // Sale Info
    doc.setFontSize(12);
    doc.text(`Receipt: #${Math.random().toString(36).substring(2, 9).toUpperCase()}`, 20, 50);
    doc.text(`Date: ${sale.date.toLocaleString()}`, 20, 57);
    doc.text(`Payment: ${paymentMethod.toUpperCase()}`, pageWidth - 20, 50, { align: 'right' });

    // Table
    const tableData = sale.items.map(item => [
      item.name,
      item.quantity.toString(),
      `Rs.${item.sell_price.toFixed(2)}`,
      `Rs.${(item.sell_price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Product', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'plain',
      headStyles: { 
        fillColor: [176, 141, 121], // atelier-clay
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      },
      styles: { fontSize: 10, cellPadding: 5 }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text("Subtotal:", pageWidth - 60, finalY);
    doc.text(`Rs.${sale.subtotal.toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });
    
    doc.text("SSCL (2.5%):", pageWidth - 60, finalY + 7);
    doc.text(`Rs.${sale.sscl.toFixed(2)}`, pageWidth - 20, finalY + 7, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", pageWidth - 60, finalY + 17);
    doc.text(`Rs.${sale.total.toFixed(2)}`, pageWidth - 20, finalY + 17, { align: 'right' });

    if (paymentMethod === 'cash') {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Received:", pageWidth - 60, finalY + 27);
      doc.text(`Rs.${(sale.received || 0).toFixed(2)}`, pageWidth - 20, finalY + 27, { align: 'right' });
      
      doc.setFont("helvetica", "bold");
      doc.text("Balance:", pageWidth - 60, finalY + 34);
      doc.text(`Rs.${(sale.balance || 0).toFixed(2)}`, pageWidth - 20, finalY + 34, { align: 'right' });
    }

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    const footerY = paymentMethod === 'cash' ? finalY + 55 : finalY + 40;
    doc.text("Thank you for choosing PAWA Salon.", pageWidth / 2, footerY, { align: 'center' });
    doc.text("We hope to see you again soon.", pageWidth / 2, footerY + 7, { align: 'center' });

    // Trigger Direct Printing via Hidden Iframe
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      iframe.contentWindow?.print();
      // Cleanup after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
        if (autoCloseModal) {
          setShowSuccess(false);
        }
      }, 1000);
    };
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center"><RefreshCw className="animate-spin mx-auto w-10 h-10 text-atelier-clay"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-light tracking-widest text-atelier-charcoal uppercase">
            Point of <span className="font-bold text-atelier-clay">Sale</span>
          </h2>
          <p className="text-atelier-taupe text-[10px] font-bold uppercase tracking-widest mt-1">Professional Transaction Terminal</p>
        </div>
        <div className="flex bg-atelier-cream p-1.5 rounded-2xl border border-atelier-sand">
          <button 
            onClick={() => setView('terminal')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'terminal' ? 'bg-white text-atelier-clay shadow-sm' : 'text-atelier-sand hover:text-atelier-taupe'}`}
          >
            <LayoutGrid className="w-4 h-4" /> Terminal
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'history' ? 'bg-white text-atelier-clay shadow-sm' : 'text-atelier-sand hover:text-atelier-taupe'}`}
          >
            <HistoryIcon className="w-4 h-4" /> History
          </button>
        </div>
      </div>

      {view === 'terminal' ? (
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 h-auto lg:h-[calc(100vh-240px)] animate-in fade-in duration-500">
      {/* Product Selection Area */}
      <div className="flex-1 flex flex-col space-y-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-atelier-sand" />
          <input 
            type="text" 
            placeholder="Scan SKU or search product name..." 
            className="w-full bg-white border border-atelier-sand rounded-2xl md:rounded-[30px] py-4 md:py-5 pl-14 md:pl-16 pr-8 text-sm focus:ring-2 focus:ring-atelier-clay outline-none shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredItems.map(item => {
              const available = getAvailableStock(item.id);
              return (
                <div 
                  key={item.id}
                  onClick={() => available > 0 && addToCart(item)}
                  className={`group bg-white p-4 md:p-6 rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-sm hover:shadow-xl hover:border-atelier-clay transition-all cursor-pointer relative overflow-hidden ${available <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                >
                <div className="aspect-square bg-atelier-nude rounded-[24px] md:rounded-[30px] mb-4 overflow-hidden flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <Package className="w-10 h-10 text-atelier-clay" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-atelier-charcoal text-sm uppercase tracking-widest truncate">{item.name}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-atelier-clay font-bold text-lg">Rs.{item.sell_price}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      available <= item.min_stock_level ? 'bg-red-50 text-red-500 border-red-100' : 'bg-atelier-cream text-atelier-sand border-atelier-sand/30'
                    }`}>
                      {available} available
                    </span>
                  </div>
                </div>
                {available > 0 && (
                  <div className="absolute top-4 right-4 bg-atelier-charcoal text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                )}
              </div>
            );})}
          </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-full lg:w-[450px] bg-white rounded-[32px] md:rounded-[50px] border border-atelier-sand shadow-2xl flex flex-col overflow-hidden">
        <div className="p-8 border-b border-atelier-sand flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-atelier-nude p-3 rounded-2xl">
              <ShoppingCart className="w-6 h-6 text-atelier-clay" />
            </div>
            <h3 className="text-lg font-bold text-atelier-charcoal uppercase tracking-widest">Current Cart</h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="bg-atelier-cream px-4 py-1.5 rounded-full text-[10px] font-black text-atelier-clay uppercase tracking-widest">
              {cart.length} Items
            </span>
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className="text-[9px] font-bold text-atelier-taupe uppercase tracking-widest group-hover:text-atelier-clay transition-colors">Auto-print</span>
              <div 
                onClick={() => setAutoPrint(!autoPrint)}
                className={`w-10 h-5 rounded-full transition-all relative ${autoPrint ? 'bg-atelier-clay' : 'bg-atelier-sand'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoPrint ? 'left-6' : 'left-1'}`} />
              </div>
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
              <Package className="w-16 h-16 text-atelier-sand" />
              <p className="text-xs font-bold uppercase tracking-widest text-atelier-sand">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 group animate-in slide-in-from-right-4">
                <div className="w-16 h-16 bg-atelier-nude rounded-2xl overflow-hidden shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-atelier-clay" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-atelier-charcoal text-xs uppercase tracking-widest truncate">{item.name}</h5>
                  <p className="text-atelier-clay font-bold text-sm">Rs.{item.sell_price}</p>
                </div>
                <div className="flex items-center gap-3 bg-atelier-cream rounded-xl p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Minus className="w-3 h-3 text-atelier-sand" /></button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-white rounded-lg transition-colors"><Plus className="w-3 h-3 text-atelier-sand" /></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="p-2 text-atelier-sand hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-atelier-cream/50 border-t border-atelier-sand space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-atelier-clay uppercase tracking-widest ml-1">Customer Selection</label>
            <div className="relative">
              {selectedCustomer ? (
                <div className="flex items-center justify-between bg-white border-2 border-atelier-clay rounded-2xl py-3 px-5 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="bg-atelier-clay/10 p-2 rounded-full">
                      <UserIcon className="w-4 h-4 text-atelier-clay" />
                    </div>
                    <span className="text-xs font-bold text-atelier-charcoal">{selectedCustomer.full_name}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1 hover:bg-atelier-cream rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-atelier-sand" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
                  <input 
                    type="text" 
                    placeholder="Search customer name or email..." 
                    className="w-full bg-white border-2 border-atelier-sand focus:border-atelier-clay rounded-2xl py-3 pl-12 pr-6 text-xs outline-none transition-all"
                    value={customerSearch}
                    onChange={e => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
                  {showCustomerDropdown && customers.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-atelier-sand rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2">
                      {customers.map(c => (
                        <div 
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setShowCustomerDropdown(false);
                            setCustomerSearch('');
                          }}
                          className="px-6 py-4 hover:bg-atelier-cream cursor-pointer border-b border-atelier-sand last:border-0 transition-colors"
                        >
                          <p className="text-xs font-bold text-atelier-charcoal">{c.full_name}</p>
                          <p className="text-[10px] text-atelier-taupe">{c.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-atelier-taupe uppercase tracking-widest">
              <span>Subtotal</span>
              <span>Rs.{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-atelier-taupe uppercase tracking-widest">
              <span>SSCL (2.5%)</span>
              <span>Rs.{sscl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-atelier-charcoal uppercase tracking-widest pt-2 border-t border-atelier-sand/30">
              <span>Total</span>
              <span className="text-atelier-clay">Rs.{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'card' ? 'bg-white border-atelier-clay text-atelier-clay shadow-md' : 'bg-transparent border-atelier-sand text-atelier-sand'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Card</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'cash' ? 'bg-white border-atelier-clay text-atelier-clay shadow-md' : 'bg-transparent border-atelier-sand text-atelier-sand'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Cash</span>
            </button>
          </div>

          {paymentMethod === 'cash' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-atelier-clay uppercase tracking-widest ml-4">Cash Received</label>
                <div className="relative">
                  <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
                  <input 
                    type="number" 
                    placeholder="0.00"
                    className="w-full bg-white border-2 border-atelier-sand focus:border-atelier-clay rounded-2xl py-4 pl-12 pr-6 text-sm outline-none transition-all"
                    value={receivedAmount}
                    onChange={e => setReceivedAmount(e.target.value)}
                  />
                </div>
              </div>
              {parseFloat(receivedAmount) >= total && (
                <div className="flex justify-between items-center p-4 bg-atelier-sage/10 rounded-2xl border border-atelier-sage/20">
                  <span className="text-[10px] font-black text-atelier-sage uppercase tracking-widest">Balance to Return</span>
                  <span className="text-lg font-black text-atelier-sage">Rs.{balance.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing || (paymentMethod === 'cash' && (!receivedAmount || parseFloat(receivedAmount) < total))}
            className="w-full py-5 bg-atelier-charcoal text-white rounded-[25px] font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-atelier-clay transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Complete Transaction
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-atelier-charcoal/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[40px] md:rounded-[60px] p-8 md:p-16 max-w-md w-full text-center space-y-6 md:space-y-8 shadow-2xl border border-atelier-sand animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-atelier-sage/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-atelier-sage" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-atelier-charcoal uppercase tracking-widest">Sale Completed</h3>
              <p className="text-atelier-taupe text-sm font-medium">The transaction has been recorded and inventory updated.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={() => generateReceiptPDF()}
                className="w-full py-5 bg-atelier-clay text-white rounded-3xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-atelier-charcoal transition-all flex items-center justify-center gap-3"
              >
                <DollarSign className="w-4 h-4" />
                Reprint Receipt
              </button>
              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full py-5 bg-atelier-charcoal text-white rounded-3xl font-bold uppercase tracking-widest text-[10px] shadow-xl hover:bg-atelier-clay transition-all"
              >
                Close & Next Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="bg-white rounded-[32px] md:rounded-[40px] border border-atelier-sand overflow-hidden shadow-sm animate-in fade-in duration-500">
      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-atelier-cream border-b border-atelier-sand">
              <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-widest">Transaction ID</th>
              <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-widest">Temporal Alignment</th>
              <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-widest">Customer</th>
              <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-widest">Method</th>
              <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-widest">Investment</th>
              <th className="px-8 py-6 text-[10px] font-black text-atelier-taupe uppercase tracking-widest text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-atelier-sand/30">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-atelier-cream/50 transition-colors group">
                <td className="px-8 py-6">
                  <span className="font-bold text-atelier-charcoal text-xs uppercase tracking-widest">#{sale.id.slice(0, 8)}</span>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">
                    {new Date(sale.created_at).toLocaleString()}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-4 h-4 text-atelier-clay" />
                    <span className="text-sm font-medium text-atelier-charcoal">{sale.profiles?.full_name || 'Guest Participant'}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-atelier-nude text-atelier-clay text-[8px] font-black uppercase tracking-widest rounded-full">
                    {sale.payment_method}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <p className="font-bold text-atelier-charcoal text-sm">Rs.{sale.total_amount.toLocaleString()}</p>
                </td>
                <td className="px-8 py-6 text-right">
                  <button 
                    onClick={() => {
                      setLastSale({
                        items: sale.sale_items?.map((si: any) => ({
                          name: si.inventory_items?.name,
                          quantity: si.quantity,
                          sell_price: si.unit_price
                        })) || [],
                        total: sale.total_amount,
                        subtotal: sale.total_amount - (sale.sscl || 0),
                        sscl: sale.sscl || 0,
                        date: new Date(sale.created_at),
                        received: sale.received_amount,
                        balance: sale.balance_amount
                      });
                      setPaymentMethod(sale.payment_method);
                      setTimeout(() => generateReceiptPDF(), 100);
                    }}
                    className="p-3 bg-atelier-cream text-atelier-taupe rounded-xl hover:bg-atelier-clay hover:text-white transition-all shadow-sm"
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="lg:hidden divide-y divide-atelier-sand/30">
        {sales.map((sale) => (
          <div key={sale.id} className="p-6 space-y-4 hover:bg-atelier-cream/50 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-atelier-clay uppercase tracking-widest mb-1">#{sale.id.slice(0, 8)}</p>
                <h4 className="font-bold text-atelier-charcoal text-sm uppercase tracking-widest">{sale.profiles?.full_name || 'Guest Participant'}</h4>
              </div>
              <span className="px-3 py-1 bg-atelier-nude text-atelier-clay text-[8px] font-black uppercase tracking-widest rounded-full">
                {sale.payment_method}
              </span>
            </div>
            
            <div className="flex justify-between items-center bg-atelier-cream/50 p-4 rounded-2xl">
              <div>
                <p className="text-[9px] font-bold text-atelier-taupe uppercase tracking-widest">Total Investment</p>
                <p className="font-bold text-atelier-charcoal text-lg">Rs.{sale.total_amount.toLocaleString()}</p>
              </div>
              <button 
                onClick={() => {
                  setLastSale({
                    items: sale.sale_items?.map((si: any) => ({
                      name: si.inventory_items?.name,
                      quantity: si.quantity,
                      sell_price: si.unit_price
                    })) || [],
                    total: sale.total_amount,
                    subtotal: sale.total_amount - (sale.sscl || 0),
                    sscl: sale.sscl || 0,
                    date: new Date(sale.created_at),
                    received: sale.received_amount,
                    balance: sale.balance_amount
                  });
                  setPaymentMethod(sale.payment_method);
                  setTimeout(() => generateReceiptPDF(), 100);
                }}
                className="p-3 bg-white text-atelier-taupe rounded-xl hover:bg-atelier-clay hover:text-white transition-all shadow-sm border border-atelier-sand"
              >
                <DollarSign className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-[9px] font-bold text-atelier-taupe uppercase tracking-widest">
              <RefreshCw className="w-3 h-3" />
              {new Date(sale.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <Pagination 
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />
    </div>
  )}
</div>
);
};

export default POSSystem;
