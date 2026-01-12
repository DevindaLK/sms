
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Package, AlertTriangle, Plus, Search, RefreshCw, X, Trash2, History, ArrowUpRight, ArrowDownRight, Upload, Image as ImageIcon, TrendingUp, DollarSign, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Pagination from './Shared/Pagination';

const InventoryManager: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newItem, setNewItem] = useState({ 
    name: '', 
    category_id: '', 
    current_stock: 0, 
    min_stock_level: 5, 
    buy_price: 0,
    sell_price: 0,
    sku: '',
    unit: 'pcs',
    image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    try {
      const [inventoryRes, categoryData, logData] = await Promise.all([
        api.getInventory(currentPage, pageSize),
        api.getInventoryCategories(),
        api.getInventoryLogs()
      ]);
      setItems(inventoryRes.data || []);
      setTotalItems(inventoryRes.count || 0);
      setCategories(categoryData || []);
      setLogs(logData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const publicUrl = await api.uploadInventoryImage(file);
      
      if (editingItem) {
        setEditingItem({ ...editingItem, image_url: publicUrl });
      } else {
        setNewItem({ ...newItem, image_url: publicUrl });
      }
    } catch (e) {
      console.error(e);
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!newItem.name || !newItem.category_id) {
        toast.error("Please provide a name and category.");
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Auto-generate SKU: GLW-XXXXXX
      const autoSKU = `GLW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Insert with 0 stock to avoid doubling if a trigger exists
      const createdItem = await api.createInventoryItem({
        ...newItem,
        sku: newItem.sku || autoSKU,
        current_stock: 0
      });
      
      // Log initial stock - this will trigger the stock update in the DB
      if (newItem.current_stock > 0) {
        await api.logInventoryMovement({
          item_id: createdItem.id,
          user_id: user.id,
          type: 'in',
          quantity: newItem.current_stock,
          reason: 'Initial stock'
        });
      }

      setIsAdding(false);
      setNewItem({ 
        name: '', 
        category_id: '', 
        current_stock: 0, 
        min_stock_level: 5, 
        buy_price: 0,
        sell_price: 0,
        sku: '',
        unit: 'pcs',
        image_url: ''
      });
      fetchData();
      toast.success("Product Added Successfully");
    } catch (e) {
      console.error(e);
      toast.error("Error adding item");
    }
  };

  const handleAdjustStock = async (item: any, amount: number, type: 'in' | 'out') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newStock = type === 'in' ? item.current_stock + amount : item.current_stock - amount;
      if (newStock < 0) {
        toast.error("Stock cannot be negative.");
        return;
      }

      // Remove manual update to avoid doubling (handled by logs/trigger)
      // await api.updateInventoryItem(item.id, { current_stock: newStock });

      await api.logInventoryMovement({
        item_id: item.id,
        user_id: user.id,
        type,
        quantity: amount,
        reason: type === 'in' ? 'Restock' : 'Used in service'
      });
      
      fetchData();
      toast.success("Stock Adjusted");
    } catch (e) {
      console.error(e);
      toast.error("Error adjusting stock");
    }
  };
  
  const handleUpdateProduct = async () => {
    try {
      if (!editingItem) return;
      if (!editingItem.name || !editingItem.category_id) {
        toast.error("Please provide a name and category.");
        return;
      }

      await api.updateInventoryItem(editingItem.id, {
        name: editingItem.name,
        category_id: editingItem.category_id,
        buy_price: editingItem.buy_price,
        sell_price: editingItem.sell_price,
        min_stock_level: editingItem.min_stock_level,
        unit: editingItem.unit,
        image_url: editingItem.image_url,
        sku: editingItem.sku
      });

      setEditingItem(null);
      fetchData();
      toast.success("Product Updated Successfully");
    } catch (e) {
      console.error(e);
      toast.error("Error updating item");
    }
  };

  const handleEditClick = (item: any) => {
    setEditingItem({
      ...item,
      category_id: item.category_id || (item.category?.id)
    });
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteInventoryItem(deleteId);
      fetchData();
      toast.success("Item removed from inventory");
    } catch (e) {
      toast.error("Delete failed");
    } finally {
      setDeleteId(null);
    }
  };

  const totalValue = items.reduce((sum, item) => sum + (item.sell_price * item.current_stock), 0);
  const totalCost = items.reduce((sum, item) => sum + (item.buy_price * item.current_stock), 0);
  const lowStockCount = items.filter(i => i.current_stock <= i.min_stock_level).length;

  if (loading) return <div className="p-20 text-center"><RefreshCw className="animate-spin mx-auto w-10 h-10 text-atelier-clay"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-light tracking-widest text-atelier-charcoal uppercase">Inven<span className="font-bold text-atelier-clay">tory</span></h2>
          <p className="text-atelier-taupe text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Professional products and retail stock</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-4 w-full sm:w-auto">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="flex-1 sm:flex-none justify-center bg-white border-2 border-atelier-sand text-atelier-charcoal px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center gap-2 hover:bg-atelier-cream transition-all uppercase text-[9px] md:text-[10px] tracking-widest"
          >
            <History className="w-4 h-4" /> {showLogs ? 'View Inventory' : 'Logs'}
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex-1 sm:flex-none justify-center bg-atelier-charcoal text-white px-6 md:px-8 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold flex items-center gap-2 hover:bg-atelier-clay transition-all uppercase text-[9px] md:text-[10px] tracking-widest shadow-xl"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {!showLogs ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-sm">
              <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest mb-2">Total Retail Value</p>
              <p className="text-xl md:text-2xl font-bold text-atelier-charcoal tracking-tight">Rs.{totalValue.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-sm">
              <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest mb-2">Total Asset Cost</p>
              <p className="text-xl md:text-2xl font-bold text-atelier-taupe tracking-tight">Rs.{totalCost.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-sm">
              <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest mb-2">Potential Profit</p>
              <p className="text-xl md:text-2xl font-bold text-atelier-sage tracking-tight">Rs.{(totalValue - totalCost).toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-sm">
              <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest mb-2">Low Stock Items</p>
              <p className="text-xl md:text-2xl font-bold text-atelier-clay tracking-tight">{lowStockCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-atelier-cream border-b border-atelier-sand">
                    <th className="px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Product Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Category</th>
                    <th className="px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Stock Levels</th>
                    <th className="px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Financials</th>
                    <th className="px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-atelier-sand/30">
                  {items.map((product) => {
                    const isLow = product.current_stock <= product.min_stock_level;
                    const margin = product.sell_price - product.buy_price;
                    const marginPercent = product.buy_price > 0 ? (margin / product.buy_price) * 100 : 0;
                    
                    return (
                      <tr key={product.id} className="hover:bg-atelier-cream/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-atelier-nude rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-atelier-clay" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-atelier-charcoal text-sm uppercase tracking-widest">{product.name}</span>
                              <span className="text-[9px] text-atelier-sand font-bold uppercase tracking-widest">{product.sku || 'No SKU'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1.5 bg-atelier-cream text-atelier-taupe text-[9px] font-black uppercase rounded-full tracking-widest border border-atelier-sand">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="w-full max-w-[150px] space-y-2">
                            <div className="flex justify-between text-[9px] font-black text-atelier-sand uppercase tracking-widest">
                              <span className={isLow ? 'text-atelier-clay' : ''}>{product.current_stock} {product.unit}</span>
                              {isLow && <span className="text-atelier-clay flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Low</span>}
                            </div>
                            <div className="h-2 w-full bg-atelier-sand/30 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-700 ${isLow ? 'bg-atelier-clay' : 'bg-atelier-sage'}`} style={{ width: `${Math.min((product.current_stock / (product.min_stock_level * 4)) * 100, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-atelier-charcoal">Rs.{product.sell_price}</span>
                              <span className="text-[9px] text-atelier-sand font-bold uppercase tracking-widest">Retail</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-atelier-taupe">Rs.{product.buy_price}</span>
                              <span className="text-[8px] text-atelier-sand font-bold uppercase tracking-widest">Cost</span>
                            </div>
                            <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-atelier-sage">
                              <TrendingUp className="w-2 h-2" /> {marginPercent.toFixed(0)}% Margin
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end items-center gap-2">
                            <button 
                              onClick={() => handleAdjustStock(product, 1, 'in')}
                              className="p-2 hover:bg-atelier-sage/20 rounded-xl text-atelier-sage transition-all"
                              title="Restock"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleAdjustStock(product, 1, 'out')}
                              className="p-2 hover:bg-atelier-clay/20 rounded-xl text-atelier-clay transition-all"
                              title="Use"
                            >
                              <ArrowDownRight className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-atelier-sand mx-1"></div>
                            <button 
                              onClick={() => handleEditClick(product)}
                              className="p-2 hover:bg-atelier-sand/20 rounded-xl text-atelier-sand transition-all"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteClick(product.id)} className="p-2 hover:bg-red-50 rounded-xl text-atelier-sand hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="lg:hidden divide-y divide-atelier-sand/30">
              {items.map((product) => {
                const isLow = product.current_stock <= product.min_stock_level;
                return (
                  <div key={product.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-atelier-nude rounded-2xl flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-atelier-clay" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-atelier-charcoal uppercase tracking-widest">{product.name}</p>
                          <p className="text-[8px] text-atelier-sand font-bold uppercase tracking-widest">{product.sku || 'No SKU'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleAdjustStock(product, 1, 'in')} className="p-2 bg-atelier-sage/10 text-atelier-sage rounded-xl"><ArrowUpRight className="w-4 h-4" /></button>
                        <button onClick={() => handleAdjustStock(product, 1, 'out')} className="p-2 bg-atelier-clay/10 text-atelier-clay rounded-xl"><ArrowDownRight className="w-4 h-4" /></button>
                        <button onClick={() => handleEditClick(product)} className="p-2 bg-atelier-sand/10 text-atelier-taupe rounded-xl"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteClick(product.id)} className="p-2 bg-red-50 text-red-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[8px] text-atelier-sand font-bold uppercase tracking-widest">Financials</p>
                        <p className="text-xs font-bold text-atelier-charcoal">Rs.{product.sell_price} <span className="text-[8px] text-atelier-taupe font-normal">Retail</span></p>
                        <p className="text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">Rs.{product.buy_price} <span className="text-[8px] opacity-60">Cost</span></p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                          <span className="text-atelier-sand">Stock</span>
                          <span className={isLow ? 'text-atelier-clay' : 'text-atelier-sage'}>{product.current_stock} {product.unit}</span>
                        </div>
                        <div className="h-1.5 w-full bg-atelier-cream rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isLow ? 'bg-atelier-clay' : 'bg-atelier-sage'}`} style={{ width: `${Math.min((product.current_stock / (product.min_stock_level * 4)) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[32px] md:rounded-[40px] border border-atelier-sand shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] lg:min-w-0">
              <thead>
                <tr className="bg-atelier-cream border-b border-atelier-sand">
                  <th className="px-6 md:px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 md:px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Product</th>
                  <th className="px-6 md:px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Type</th>
                  <th className="px-6 md:px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Qty</th>
                  <th className="px-6 md:px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Stylist</th>
                  <th className="px-6 md:px-8 py-5 text-[10px] font-black text-atelier-sand uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-atelier-sand/30">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-atelier-cream/50 transition-colors">
                    <td className="px-6 md:px-8 py-6 text-[9px] md:text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 md:px-8 py-6 font-bold text-atelier-charcoal text-[11px] md:text-sm uppercase tracking-widest">
                      {log.item?.name}
                    </td>
                    <td className="px-6 md:px-8 py-6">
                      <span className={`px-3 md:px-4 py-1 text-[8px] md:text-[9px] font-black uppercase rounded-full tracking-widest border ${
                        log.type === 'in' ? 'bg-atelier-sage/30 text-atelier-charcoal border-atelier-sage/50' : 'bg-atelier-clay/30 text-atelier-charcoal border-atelier-clay/50'
                      }`}>
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 md:px-8 py-6 font-bold text-atelier-charcoal text-xs md:text-sm">
                      {log.type === 'in' ? '+' : '-'}{log.quantity}
                    </td>
                    <td className="px-6 md:px-8 py-6 text-[9px] md:text-[10px] text-atelier-taupe font-bold uppercase tracking-widest">
                      {log.user?.full_name?.split(' ')[0] || 'System'}
                    </td>
                    <td className="px-6 md:px-8 py-6 text-[9px] md:text-[10px] text-atelier-sand font-bold uppercase tracking-widest italic truncate max-w-[100px] md:max-w-none">
                      {log.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!showLogs && (
        <Pagination 
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {(isAdding || editingItem) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-atelier-charcoal/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white rounded-[48px] md:rounded-[60px] p-6 md:p-12 max-w-3xl w-full shadow-2xl space-y-6 md:space-y-8 border border-atelier-sand overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center">
              <h3 className="text-lg md:text-xl font-light tracking-widest uppercase">
                {editingItem ? 'Edit' : 'New'} <span className="font-bold text-atelier-clay">Product</span>
              </h3>
              <button onClick={() => { setIsAdding(false); setEditingItem(null); }} className="p-2 hover:bg-atelier-cream rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {/* Image Upload Area */}
              <div className="md:col-span-1 space-y-4">
                <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Product Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square bg-atelier-cream rounded-[32px] md:rounded-[40px] border-2 border-dashed border-atelier-sand flex flex-col items-center justify-center cursor-pointer hover:bg-atelier-nude transition-all overflow-hidden relative group"
                >
                  {(editingItem ? editingItem.image_url : newItem.image_url) ? (
                    <>
                      <img src={editingItem ? editingItem.image_url : newItem.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload className="text-white w-8 h-8" />
                      </div>
                    </>
                  ) : (
                    <>
                      {uploading ? (
                        <RefreshCw className="w-8 h-8 text-atelier-clay animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 md:w-10 md:h-10 text-atelier-sand mb-2" />
                          <span className="text-[9px] font-black text-atelier-sand uppercase tracking-widest text-center px-4">Upload Product Image</span>
                        </>
                      )}
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                />
                <p className="text-[8px] text-atelier-taupe text-center uppercase tracking-widest font-bold">Recommended: 800x800px PNG/JPG</p>
              </div>

              {/* Form Fields */}
              <div className="md:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Product Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Royal Oud Oil" 
                      className="w-full bg-atelier-cream p-4 md:p-5 rounded-xl md:rounded-2xl outline-none text-sm" 
                      value={editingItem ? editingItem.name : newItem.name} 
                      onChange={e => {
                        if (editingItem) setEditingItem({...editingItem, name: e.target.value});
                        else setNewItem({...newItem, name: e.target.value});
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Category</label>
                    <select 
                      className="w-full bg-atelier-cream p-4 md:p-5 rounded-xl md:rounded-2xl outline-none text-sm appearance-none" 
                      value={editingItem ? editingItem.category_id : newItem.category_id} 
                      onChange={e => {
                        if (editingItem) setEditingItem({...editingItem, category_id: e.target.value});
                        else setNewItem({...newItem, category_id: e.target.value});
                      }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Buying Price (Cost)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
                      <input 
                        type="number" 
                        className="w-full bg-atelier-cream p-4 md:p-5 pl-12 rounded-xl md:rounded-2xl outline-none text-sm" 
                        value={editingItem ? editingItem.buy_price : newItem.buy_price} 
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          if (editingItem) setEditingItem({...editingItem, buy_price: val});
                          else setNewItem({...newItem, buy_price: val});
                        }} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Selling Price (Retail)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-atelier-sand" />
                      <input 
                        type="number" 
                        className="w-full bg-atelier-cream p-4 md:p-5 pl-12 rounded-xl md:rounded-2xl outline-none text-sm" 
                        value={editingItem ? editingItem.sell_price : newItem.sell_price} 
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          if (editingItem) setEditingItem({...editingItem, sell_price: val});
                          else setNewItem({...newItem, sell_price: val});
                        }} 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {!editingItem && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Initial Stock</label>
                      <input 
                        type="number" 
                        className="w-full bg-atelier-cream p-4 md:p-5 rounded-xl md:rounded-2xl outline-none text-sm" 
                        value={newItem.current_stock} 
                        onChange={e => setNewItem({...newItem, current_stock: parseInt(e.target.value)})} 
                      />
                    </div>
                  )}
                  <div className={`space-y-2 ${editingItem ? 'md:col-span-2' : ''}`}>
                    <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Min Stock Level</label>
                    <input 
                      type="number" 
                      className="w-full bg-atelier-cream p-4 md:p-5 rounded-xl md:rounded-2xl outline-none text-sm" 
                      value={editingItem ? editingItem.min_stock_level : newItem.min_stock_level} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        if (editingItem) setEditingItem({...editingItem, min_stock_level: val});
                        else setNewItem({...newItem, min_stock_level: val});
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-atelier-clay uppercase tracking-widest ml-4">Unit</label>
                    <input 
                      type="text" 
                      placeholder="pcs, ml, oz" 
                      className="w-full bg-atelier-cream p-4 md:p-5 rounded-xl md:rounded-2xl outline-none text-sm" 
                      value={editingItem ? editingItem.unit : newItem.unit} 
                      onChange={e => {
                        if (editingItem) setEditingItem({...editingItem, unit: e.target.value});
                        else setNewItem({...newItem, unit: e.target.value});
                      }} 
                    />
                  </div>
                </div>


                <button 
                  onClick={editingItem ? handleUpdateProduct : handleAddProduct} 
                  className="w-full py-4 md:py-5 bg-atelier-charcoal text-white rounded-2xl md:rounded-3xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] shadow-xl hover:bg-atelier-clay transition-all"
                >
                  {editingItem ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-atelier-charcoal/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white rounded-[32px] md:rounded-[40px] p-8 md:p-10 max-w-md w-full shadow-2xl space-y-6 border border-atelier-sand text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-bold text-atelier-charcoal uppercase tracking-widest">Confirm Deletion</h3>
              <p className="text-atelier-taupe text-xs md:text-sm">Are you sure you want to remove this product? This action cannot be undone.</p>
            </div>
            <div className="flex gap-4 pt-2 md:pt-4">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] border border-atelier-sand hover:bg-atelier-cream transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 md:py-4 bg-red-500 text-white rounded-xl md:rounded-2xl font-bold uppercase tracking-widest text-[9px] md:text-[10px] shadow-xl hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
