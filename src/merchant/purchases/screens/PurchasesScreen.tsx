import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingBag, ArrowRight, Minus, Check, Clock, X, Trash2, AlertTriangle, RotateCcw } from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { cn } from '../../../shared/utils/utils';
import { getPurchases, createPurchase, deletePurchase, returnPurchase } from '../services/purchasesService';
import { Purchase, PurchaseItem } from '../models/types';
import { getProducts, addProduct } from '../../inventory/services/inventoryService';
import { getSuppliers } from '../../suppliers/services/supplierService';
import { Product } from '../../inventory/models/types';
import { Supplier } from '../../suppliers/models/types';
import { todayLocalDateKey, toLocalDateKey } from '../../../shared/utils/date';

function NewPurchaseView({ onBack }: { onBack: () => void }) {
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [supplierId, setSupplierId] = useState('');
  const [error, setError] = useState('');
  const [showNewProduct, setShowNewProduct] = useState(false);
  
  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState('عام');
  const [newProdSalePrice, setNewProdSalePrice] = useState('');

  useEffect(() => {
    setProducts(getProducts());
    setSuppliers(getSuppliers());
  }, []);

  const filteredProducts = products.filter(p => p.name.includes(search));
  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const addToCart = (product: Product) => {
    setError('');
    const existing = cart.find(i => i.productId === product.productId);
    if (existing) {
      setCart(cart.map(i => i.productId === product.productId ? {
        ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPurchasePrice
      } : i));
    } else {
      setCart([...cart, {
        productId: product.productId,
        productName: product.name,
        quantity: 1,
        unitPurchasePrice: product.purchasePrice,
        totalPrice: product.purchasePrice
      }]);
    }
  };

  const decrement = (productId: string) => {
    setError('');
    const existing = cart.find(i => i.productId === productId);
    if (!existing) return;
    if (existing.quantity === 1) {
      setCart(cart.filter(i => i.productId !== productId));
    } else {
      setCart(cart.map(i => i.productId === productId ? {
        ...i, quantity: i.quantity - 1, totalPrice: (i.quantity - 1) * i.unitPurchasePrice
      } : i));
    }
  };

  const updateItemPrice = (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setCart(cart.map(i => i.productId === productId ? {
      ...i, unitPurchasePrice: newPrice, totalPrice: i.quantity * newPrice
    } : i));
  };
  
  const updateItemQuantity = (productId: string, newQty: number) => {
    if (isNaN(newQty) || newQty < 0) return;
    setCart(cart.map(i => i.productId === productId ? {
      ...i, quantity: newQty, totalPrice: newQty * i.unitPurchasePrice
    } : i));
  };

  const handleAddNewProduct = () => {
    if (!newProdName || !newProdSalePrice) {
      setError('يرجى إدخال اسم المنتج وسعر البيع');
      return;
    }
    const created = addProduct({
      name: newProdName,
      category: newProdCat,
      purchasePrice: 0,
      salePrice: Number(newProdSalePrice),
      quantity: 0,
      lowStockLimit: 5
    });
    setProducts(getProducts());
    addToCart(created);
    setShowNewProduct(false);
    setSearch('');
    setNewProdName('');
    setNewProdSalePrice('');
  };

  const handleSubmit = () => {
    setError('');
    if (cart.length === 0) return setError('السلة فارغة');
    if (paymentType === 'CREDIT' && !supplierId) return setError('اختر المورد للشراء الآجل');
    
    try {
      createPurchase(paymentType, cart, supplierId);
      onBack();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col font-[Cairo]" dir="rtl">
      <div className="bg-white px-5 pt-4 pb-3 shadow-sm border-b border-gray-100 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -mr-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowRight size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">عملية شراء جديدة</h1>
      </div>

      <div className="p-4 bg-white border-b border-gray-100 shrink-0">
        <div className="relative">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="ابحث عن منتج بالاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pr-10 p-3 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filteredProducts.map(p => (
            <div key={p.productId} onClick={() => addToCart(p)} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm cursor-pointer active:scale-95 transition-all flex flex-col justify-between h-28">
              <div>
                <p className="font-bold text-sm text-gray-900 line-clamp-1">{p.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{p.category}</p>
              </div>
              <div className="flex justify-between items-end mt-2">
                <p className="font-bold text-indigo-600 text-sm">شراء: {formatCurrency(p.purchasePrice)}</p>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && search && !showNewProduct && (
            <div className="col-span-2 flex flex-col items-center justify-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-sm mb-3">المنتج غير موجود</p>
              <button onClick={() => { setNewProdName(search); setShowNewProduct(true); }} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                <Plus size={16} /> إضافة كمنتج جديد
              </button>
            </div>
          )}
          {showNewProduct && (
            <div className="col-span-2 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3 relative">
              <button onClick={() => setShowNewProduct(false)} className="absolute top-2 left-2 p-1 text-gray-400 hover:text-gray-600"><X size={16}/></button>
              <h3 className="font-bold text-gray-900 text-sm">منتج جديد</h3>
              <input type="text" placeholder="اسم المنتج" value={newProdName} onChange={e=>setNewProdName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
              <div className="flex gap-2">
                <input type="text" placeholder="التصنيف" value={newProdCat} onChange={e=>setNewProdCat(e.target.value)} className="w-1/2 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
                <input type="number" placeholder="سعر البيع للزبون" value={newProdSalePrice} onChange={e=>setNewProdSalePrice(e.target.value)} className="w-1/2 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none" />
              </div>
              <button onClick={handleAddNewProduct} className="w-full bg-indigo-600 text-white rounded-lg p-2.5 text-sm font-bold">حفظ وإضافة للسلة</button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-gray-100 flex flex-col max-h-[55vh] shrink-0">
        <div className="p-4 border-b border-gray-100 overflow-y-auto max-h-[35vh]">
          <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
            <ShoppingBag size={16} /> المنتجات المشتراة ({cart.length})
          </h3>
          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.productId} className="flex flex-col bg-gray-50 p-3 rounded-xl border border-gray-100 gap-2">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                  <button onClick={() => setCart(cart.filter(i => i.productId !== item.productId))} className="text-red-500 p-1"><X size={14}/></button>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 font-bold mb-1 block">سعر الشراء (للوحدة)</label>
                    <input 
                      type="number" 
                      value={item.unitPurchasePrice || ''} 
                      onChange={e => updateItemPrice(item.productId, Number(e.target.value))} 
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none text-indigo-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold mb-1 block text-center">الكمية</label>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200 h-[38px]">
                      <button onClick={() => decrement(item.productId)} className="p-1 text-gray-500 hover:text-red-500"><Minus size={14}/></button>
                      <input 
                        type="number" 
                        value={item.quantity || ''} 
                        onChange={e => updateItemQuantity(item.productId, Number(e.target.value))} 
                        className="w-10 text-center text-sm font-bold outline-none"
                      />
                      <button onClick={() => addToCart(products.find(p=>p.productId===item.productId)!)} className="p-1 text-gray-500 hover:text-green-500"><Plus size={14}/></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && <p className="text-xs text-center text-gray-400 py-2">لم يتم إضافة منتجات</p>}
          </div>
        </div>
        
        <div className="p-4 space-y-4 bg-white pb-6">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-600 text-sm">الإجمالي النهائي:</span>
            <span className="text-2xl font-black text-indigo-600">{formatCurrency(total)}</span>
          </div>
          
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button onClick={() => setPaymentType('CASH')} className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all", paymentType === 'CASH' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>شراء نقدي</button>
            <button onClick={() => setPaymentType('CREDIT')} className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all", paymentType === 'CREDIT' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>شراء آجل (دين)</button>
          </div>

          {paymentType === 'CREDIT' && (
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-sm">
              <option value="">-- اختر المورد --</option>
              {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.name}</option>)}
            </select>
          )}
          
          {error && <p className="text-xs text-red-500 text-center font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
          
          <button onClick={handleSubmit} disabled={cart.length === 0} className="w-full bg-indigo-600 disabled:bg-gray-300 disabled:scale-100 text-white font-bold rounded-xl p-4 active:scale-[0.98] transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2">
            <Check size={20} />
            تأكيد وحفظ الشراء
          </button>
        </div>
      </div>
    </div>
  );
}

export function PurchasesScreen({ onBack, initialView = 'LIST' }: { onBack?: () => void, initialView?: 'LIST' | 'NEW' }) {
  const [view, setView] = useState<'LIST'|'NEW'>(initialView);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deletePurchaseState, setDeletePurchaseState] = useState<Purchase | null>(null);
  const [actionError, setActionError] = useState('');
  const [returnPurchaseState, setReturnPurchaseState] = useState<Purchase | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (view === 'LIST') {
      setPurchases(getPurchases());
      setSuppliers(getSuppliers());
    }
  }, [view]);

  if (view === 'NEW') {
    return <NewPurchaseView onBack={() => setView('LIST')} />;
  }

  const todayStr = todayLocalDateKey();
  const todayPurchases = purchases.filter(p => toLocalDateKey(p.createdAt) === todayStr);
  const todayTotal = todayPurchases.reduce((sum, p) => sum + p.total - (p.returnedTotal || 0), 0);

  const handleDeleteClick = (e: React.MouseEvent, purchase: Purchase) => {
    e.stopPropagation();
    setDeletePurchaseState(purchase);
  };

  const handleConfirmDelete = () => {
    if (!deletePurchaseState) return;
    try {
      deletePurchase(deletePurchaseState.purchaseId);
      setDeletePurchaseState(null);
      setPurchases(getPurchases());
      setSuppliers(getSuppliers());
      setActionError('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر إلغاء الشراء');
    }
  };

  const handleReturn = () => {
    if (!returnPurchaseState) return;
    try {
      returnPurchase(returnPurchaseState.purchaseId, returnQuantities);
      setReturnPurchaseState(null);
      setReturnQuantities({});
      setPurchases(getPurchases());
      setSuppliers(getSuppliers());
      setActionError('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر تسجيل مرتجع المشتريات');
    }
  };

  const getSupplierName = (id?: string) => {
    if (!id) return '';
    const s = suppliers.find(s => s.supplierId === id);
    return s ? s.name : 'مورد غير معروف';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      <div className="bg-white px-5 pt-4 pb-4 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -mr-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
              <ArrowRight size={20} />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900">المشتريات</h1>
        </div>
        <button onClick={() => setView('NEW')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100">
          <Plus size={18} />
          عملية شراء
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        {actionError && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl">{actionError}</div>}
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4 bg-indigo-600 text-white border-none shadow-md shadow-indigo-200">
            <p className="text-[11px] text-indigo-100 mb-1">مشتريات اليوم</p>
            <p className="text-lg font-bold">{formatCurrency(todayTotal)}</p>
          </Card>
          <Card className="!p-4 bg-white border border-gray-100 shadow-sm">
            <p className="text-[11px] text-gray-500 mb-1">عمليات اليوم</p>
            <p className="text-lg font-bold text-gray-900">{todayPurchases.length} عملية</p>
          </Card>
        </div>

        <section>
          <h3 className="text-xs font-bold text-gray-500 mb-3 px-1 flex items-center gap-2">
            <Clock size={14} /> آخر المشتريات
          </h3>
          <div className="space-y-3">
            {purchases.map(purchase => (
              <Card key={purchase.purchaseId} className="!p-4 border border-gray-100 shadow-sm relative">
                <button 
                  onClick={(e) => handleDeleteClick(e, purchase)}
                  className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <button onClick={() => { setReturnPurchaseState(purchase); setReturnQuantities({}); setActionError(''); }} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="مرتجع مشتريات"><RotateCcw size={16}/></button>
                <div className="flex justify-between items-start mb-2 pr-10">
                  <div>
                    <span className="text-[10px] text-gray-400">#{purchase.purchaseId.substring(purchase.purchaseId.length - 6)}</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {purchase.paymentType === 'CASH' ? 'شراء نقدي' : `آجل: ${getSupplierName(purchase.supplierId)}`}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded",
                    purchase.paymentType === 'CASH' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {purchase.paymentType === 'CASH' ? 'نقدي' : 'آجل'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-500">{purchase.items.length} منتجات</p>
                  <p className="text-sm font-black text-indigo-600">{formatCurrency(purchase.total)}</p>
                </div>
              </Card>
            ))}
            {purchases.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center gap-3 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-sm">لا توجد مشتريات حتى الآن</p>
                <button 
                  onClick={() => setView('NEW')}
                  className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                >
                  إضافة أول شراء
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Delete Purchase Modal */}
      {deletePurchaseState && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 p-5 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">هل أنت متأكد؟</h2>
            
            <p className="text-gray-500 text-sm mb-6">
              سيتم حذف عملية الشراء وتحديث المخزون (إنقاص الكميات) وتعديل رصيد المورد إن كان الشراء آجلاً.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletePurchaseState(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold rounded-xl py-3"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 text-white font-bold rounded-xl py-3"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
      {returnPurchaseState && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5">
            <h2 className="text-xl font-bold mb-2">مرتجع مشتريات</h2>
            <p className="text-xs text-gray-500 mb-4">حدد الكميات التي ستُعاد إلى المورد.</p>
            <div className="space-y-3 max-h-64 overflow-auto">{returnPurchaseState.items.map(item => { const available = item.quantity - (item.returnedQuantity || 0); return <label key={item.productId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl"><span className="text-sm font-bold">{item.productName} <small className="text-gray-400">متاح {available}</small></span><input type="number" min="0" max={available} value={returnQuantities[item.productId] || 0} onChange={event => setReturnQuantities({...returnQuantities, [item.productId]: Number(event.target.value)})} className="w-20 border rounded-lg p-2"/></label>; })}</div>
            {actionError && <p className="text-xs text-red-600 mt-3">{actionError}</p>}
            <div className="flex gap-3 mt-5"><button onClick={() => { setReturnPurchaseState(null); setActionError(''); }} className="flex-1 bg-gray-100 rounded-xl py-3 font-bold">إلغاء</button><button onClick={handleReturn} className="flex-1 bg-orange-600 text-white rounded-xl py-3 font-bold">تأكيد المرتجع</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
