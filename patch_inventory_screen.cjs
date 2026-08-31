const fs = require('fs');

const screenCode = `
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, X, ArrowUpCircle, ArrowDownCircle, Edit3 } from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { cn } from '../../../shared/utils/utils';
import { getProducts, addProduct, updateProduct, addStockMovement, Product } from '../services/inventoryService';

export function InventoryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Add Product State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('');

  // Stock Adjust State
  const [adjustType, setAdjustType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'EDIT' | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  useEffect(() => {
    refreshProducts();
  }, []);

  const refreshProducts = () => {
    setProducts(getProducts());
  };

  const categories = ['الكل', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.includes(search);
    const matchesCategory = activeCategory === 'الكل' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = products.filter(p => p.quantity <= p.lowStockLimit).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) return;
    
    addProduct({
      name,
      category,
      purchasePrice: parseFloat(purchasePrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      quantity: parseInt(quantity) || 0,
      lowStockLimit: parseInt(lowStockLimit) || 0,
    });
    
    // Reset
    setName(''); setCategory(''); setPurchasePrice(''); setSalePrice(''); setQuantity(''); setLowStockLimit('');
    setIsAddOpen(false);
    refreshProducts();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !name || !category) return;
    
    updateProduct(selectedProduct.productId, {
      name,
      category,
      purchasePrice: parseFloat(purchasePrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      lowStockLimit: parseInt(lowStockLimit) || 0,
    });
    
    setAdjustType(null);
    setSelectedProduct(null);
    refreshProducts();
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustType) return;
    const qty = parseInt(adjustQuantity);
    if (!qty || qty <= 0) return;
    
    addStockMovement(selectedProduct.productId, adjustType as any, qty, adjustNote);
    
    setAdjustQuantity('');
    setAdjustNote('');
    setAdjustType(null);
    setSelectedProduct(null);
    refreshProducts();
  };

  const openEdit = (p: Product) => {
    setSelectedProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPurchasePrice(p.purchasePrice.toString());
    setSalePrice(p.salePrice.toString());
    setLowStockLimit(p.lowStockLimit.toString());
    setAdjustType('EDIT');
  };

  const openAdjust = (p: Product, type: 'STOCK_IN' | 'STOCK_OUT') => {
    setSelectedProduct(p);
    setAdjustType(type);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-2 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex flex-col gap-4">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">المخزون</h1>
            <p className="text-xs text-gray-500 mt-1">{products.length} منتجات • {lowStockCount} تنبيهات</p>
          </div>
          <button onClick={() => setIsAddOpen(true)} className="bg-indigo-600 text-white p-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100">
            <Plus size={20} />
            <span className="hidden sm:inline">إضافة منتج</span>
          </button>
        </div>

        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pr-10 p-3 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                activeCategory === cat ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredProducts.map(product => {
          const isLowStock = product.quantity <= product.lowStockLimit;
          
          return (
            <Card key={product.productId} className="!p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{product.category}</span>
                    {isLowStock && <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded font-bold">مخزون منخفض</span>}
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold text-center min-w-[3.5rem] flex flex-col items-center justify-center",
                  isLowStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                )}>
                  <span className="block text-[10px] opacity-70 font-normal">الكمية</span>
                  <span className="text-sm">{product.quantity}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-50 mb-3">
                <div>
                  <span className="text-gray-400 text-xs ml-1">شراء:</span>
                  <span className="font-semibold text-gray-600">{formatCurrency(product.purchasePrice)}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs ml-1">بيع:</span>
                  <span className="font-bold text-indigo-600">{formatCurrency(product.salePrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button onClick={() => openAdjust(product, 'STOCK_IN')} className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors">
                  <ArrowUpCircle size={14} /> زيادة
                </button>
                <button onClick={() => openAdjust(product, 'STOCK_OUT')} className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors">
                  <ArrowDownCircle size={14} /> إنقاص
                </button>
                <button onClick={() => openEdit(product)} className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors">
                  <Edit3 size={14} /> تعديل
                </button>
              </div>
            </Card>
          )
        })}
        {filteredProducts.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">لا توجد منتجات</div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">إضافة منتج جديد</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">اسم المنتج</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">التصنيف</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} required placeholder="مثال: مشروبات" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">سعر الشراء</label>
                  <input type="number" min="0" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">سعر البيع</label>
                  <input type="number" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">الكمية الحالية</label>
                  <input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">حد التنبيه</label>
                  <input type="number" min="0" value={lowStockLimit} onChange={e => setLowStockLimit(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                حفظ المنتج
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Adjust/Edit Modal */}
      {selectedProduct && adjustType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {adjustType === 'EDIT' ? 'تعديل المنتج' : adjustType === 'STOCK_IN' ? 'إضافة كمية' : 'إنقاص كمية'}
              </h2>
              <button onClick={() => { setSelectedProduct(null); setAdjustType(null); }} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            {adjustType === 'EDIT' ? (
              <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">اسم المنتج</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">التصنيف</label>
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">سعر الشراء</label>
                    <input type="number" min="0" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">سعر البيع</label>
                    <input type="number" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">حد التنبيه</label>
                  <input type="number" min="0" value={lowStockLimit} onChange={e => setLowStockLimit(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                  حفظ التعديلات
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">الكمية الحالية:</span>
                  <span className="text-lg font-bold text-gray-900">{selectedProduct.quantity}</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">الكمية المراد {adjustType === 'STOCK_IN' ? 'إضافتها' : 'إنقاصها'}</label>
                  <input type="number" min="1" value={adjustQuantity} onChange={e => setAdjustQuantity(e.target.value)} required className={cn("w-full bg-gray-50 border text-gray-900 rounded-xl p-3 outline-none focus:ring-2 text-left", adjustType === 'STOCK_IN' ? 'border-green-200 focus:ring-green-200' : 'border-rose-200 focus:ring-rose-200')} dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">ملاحظة (اختياري)</label>
                  <input type="text" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="السبب..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <button type="submit" className={cn("w-full text-white font-bold rounded-xl p-4 mt-6 active:scale-[0.98] transition-all", adjustType === 'STOCK_IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-rose-600 hover:bg-rose-700')}>
                  تأكيد
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
`;
fs.writeFileSync('src/merchant/inventory/screens/InventoryScreen.tsx', screenCode);
console.log('InventoryScreen updated.');
