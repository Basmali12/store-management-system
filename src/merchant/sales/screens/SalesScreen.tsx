import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, ArrowRight, Minus, Check, Clock, Trash2, AlertTriangle, Printer, RotateCcw } from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { cn } from '../../../shared/utils/utils';
import { getSales, createSale, deleteSale, refundSale } from '../services/salesService';
import { Sale, SaleItem } from '../models/types';
import { getProducts } from '../../inventory/services/inventoryService';
import { getCustomers } from '../../debts/services/debtService';
import { Product } from '../../inventory/models/types';
import { Customer } from '../../../shared/models/types';
import { todayLocalDateKey, toLocalDateKey } from '../../../shared/utils/date';

function NewSaleView({ onBack }: { onBack: () => void }) {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [saleType, setSaleType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [customerId, setCustomerId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setProducts(getProducts());
    setCustomers(getCustomers());
  }, []);

  const filteredProducts = products.filter(p => p.name.includes(search));
  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const addToCart = (product: Product) => {
    setError('');
    if (product.quantity <= 0) {
      setError(`الكمية غير متوفرة في المخزون: ${product.name}`);
      return;
    }
    const existing = cart.find(i => i.productId === product.productId);
    if (existing) {
      if (existing.quantity >= product.quantity) {
        setError('الكمية المطلوبة أكبر من الكمية المتوفرة في المخزون.');
        return;
      }
      setCart(cart.map(i => i.productId === product.productId ? {
        ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice
      } : i));
    } else {
      setCart([...cart, {
        productId: product.productId,
        productName: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
        originalUnitPrice: product.salePrice,
        totalPrice: product.salePrice
      }]);
    }
  };

  const updateUnitPrice = (productId: string, value: number) => {
    if (!Number.isFinite(value) || value < 0) return;
    setCart(cart.map(item => item.productId === productId ? { ...item, unitPrice: value, totalPrice: value * item.quantity } : item));
  };

  const decrement = (productId: string) => {
    setError('');
    const existing = cart.find(i => i.productId === productId);
    if (!existing) return;
    if (existing.quantity === 1) {
      setCart(cart.filter(i => i.productId !== productId));
    } else {
      setCart(cart.map(i => i.productId === productId ? {
        ...i, quantity: i.quantity - 1, totalPrice: (i.quantity - 1) * i.unitPrice
      } : i));
    }
  };

  const handleSubmit = () => {
    setError('');
    if (cart.length === 0) return setError('السلة فارغة');
    if (saleType === 'CREDIT' && !customerId) return setError('اختر الزبون للبيع الآجل');
    
    try {
      createSale(saleType, cart, customerId);
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
        <h1 className="text-lg font-bold text-gray-900">عملية بيع جديدة</h1>
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
                <p className="font-bold text-indigo-600 text-sm">{formatCurrency(p.salePrice)}</p>
                <p className={cn("text-[10px] font-bold", p.quantity > 0 ? "text-emerald-600" : "text-red-500")}>
                  المتاح: {p.quantity}
                </p>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-2 text-center py-10 text-gray-400 text-sm">لا توجد منتجات مطابقة</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] border-t border-gray-100 flex flex-col max-h-[55vh] shrink-0">
        <div className="p-4 border-b border-gray-100 overflow-y-auto max-h-[30vh]">
          <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
            <ShoppingCart size={16} /> السلة ({cart.length})
          </h3>
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-indigo-600 font-bold mt-0.5">{formatCurrency(item.totalPrice)}</p>
                  <label className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">سعر الوحدة <input type="number" min="0" value={item.unitPrice} onChange={event => updateUnitPrice(item.productId, Number(event.target.value))} className="w-20 border rounded px-1 py-0.5 text-left" dir="ltr" /></label>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                  <button onClick={() => decrement(item.productId)} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"><Minus size={14}/></button>
                  <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                  <button onClick={() => addToCart(products.find(p=>p.productId===item.productId)!)} className="p-1.5 text-gray-500 hover:text-green-500 transition-colors"><Plus size={14}/></button>
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
            <button onClick={() => setSaleType('CASH')} className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all", saleType === 'CASH' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>بيع نقدي</button>
            <button onClick={() => setSaleType('CREDIT')} className={cn("flex-1 py-2.5 rounded-lg text-sm font-bold transition-all", saleType === 'CREDIT' ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>بيع آجل (دين)</button>
          </div>

          {saleType === 'CREDIT' && (
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-sm">
              <option value="">-- اختر الزبون --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          
          {error && <p className="text-xs text-red-500 text-center font-bold bg-red-50 p-2 rounded-lg">{error}</p>}
          
          <button onClick={handleSubmit} disabled={cart.length === 0} className="w-full bg-indigo-600 disabled:bg-gray-300 disabled:scale-100 text-white font-bold rounded-xl p-4 active:scale-[0.98] transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2">
            <Check size={20} />
            تأكيد وإتمام البيع
          </button>
        </div>
      </div>
    </div>
  );
}

export function SalesScreen({ onBack: _onBack }: { onBack?: () => void } = {}) {
  const [view, setView] = useState<'LIST'|'NEW'>('LIST');
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deleteSaleState, setDeleteSaleState] = useState<Sale | null>(null);
  const [refundSaleState, setRefundSaleState] = useState<Sale | null>(null);
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (view === 'LIST') {
      setSales(getSales());
      setCustomers(getCustomers());
    }
  }, [view]);

  if (view === 'NEW') {
    return <NewSaleView onBack={() => setView('LIST')} />;
  }

  const todayStr = todayLocalDateKey();
  const todaySales = sales.filter(s => toLocalDateKey(s.createdAt) === todayStr);
  const todayTotal = todaySales.reduce((sum, s) => sum + s.total - (s.refundedTotal || 0), 0);

  const handleDeleteClick = (e: React.MouseEvent, sale: Sale) => {
    e.stopPropagation();
    setDeleteSaleState(sale);
  };

  const handleConfirmDelete = () => {
    if (!deleteSaleState) return;
    try {
      deleteSale(deleteSaleState.saleId);
      setDeleteSaleState(null);
      setSales(getSales());
      setActionError('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر حذف البيع');
    }
  };

  const handleRefund = () => {
    if (!refundSaleState) return;
    try {
      refundSale(refundSaleState.saleId, refundQuantities);
      setRefundSaleState(null);
      setRefundQuantities({});
      setSales(getSales());
      setActionError('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تعذر تسجيل المرتجع');
    }
  };

  const printReceipt = (sale: Sale) => {
    const safe = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
    const popup = window.open('', '_blank', 'width=420,height=700');
    if (!popup) return setActionError('اسمح بالنوافذ المنبثقة لطباعة الإيصال');
    const rows = sale.items.map(item => `<tr><td>${safe(item.productName)}</td><td>${item.quantity}</td><td>${formatCurrency(item.totalPrice)}</td></tr>`).join('');
    popup.document.write(`<html dir="rtl"><head><title>إيصال بيع</title><style>body{font-family:Arial;padding:24px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:right}h1{text-align:center}</style></head><body><h1>إيصال بيع</h1><p>رقم العملية: ${safe(sale.saleId)}</p><p>التاريخ: ${new Date(sale.createdAt).toLocaleString('ar-IQ')}</p><table><thead><tr><th>المنتج</th><th>الكمية</th><th>المبلغ</th></tr></thead><tbody>${rows}</tbody></table><h2>الإجمالي: ${formatCurrency(sale.total)}</h2><script>window.print()</script></body></html>`);
    popup.document.close();
  };

  const getCustomerName = (id?: string) => {
    if (!id) return '';
    const c = customers.find(c => c.id === id);
    return c ? c.name : 'زبون غير معروف';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      <div className="bg-white px-5 pt-4 pb-4 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">المبيعات</h1>
        <button onClick={() => setView('NEW')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100">
          <Plus size={18} />
          عملية بيع
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        {actionError && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl">{actionError}</div>}
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4 bg-indigo-600 text-white border-none shadow-md shadow-indigo-200">
            <p className="text-[11px] text-indigo-100 mb-1">مبيعات اليوم</p>
            <p className="text-lg font-bold">{formatCurrency(todayTotal)}</p>
          </Card>
          <Card className="!p-4 bg-white border border-gray-100 shadow-sm">
            <p className="text-[11px] text-gray-500 mb-1">العمليات اليوم</p>
            <p className="text-lg font-bold text-gray-900">{todaySales.length} عملية</p>
          </Card>
        </div>

        <section>
          <h3 className="text-xs font-bold text-gray-500 mb-3 px-1 flex items-center gap-2">
            <Clock size={14} /> آخر المبيعات
          </h3>
          <div className="space-y-3">
            {sales.map(sale => (
              <Card key={sale.saleId} className="!p-4 border border-gray-100 shadow-sm relative">
                <button 
                  onClick={(e) => handleDeleteClick(e, sale)}
                  className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <div className="absolute top-4 right-4 flex gap-1">
                  <button onClick={() => printReceipt(sale)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="طباعة إيصال"><Printer size={16}/></button>
                  <button onClick={() => { setRefundSaleState(sale); setRefundQuantities({}); setActionError(''); }} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg" title="مرتجع"><RotateCcw size={16}/></button>
                </div>
                <div className="flex justify-between items-start mb-2 pr-10">
                  <div>
                    <span className="text-[10px] text-gray-400">#{sale.saleId.substring(sale.saleId.length - 6)}</span>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {sale.saleType === 'CASH' ? 'مبيعات نقدية' : `آجل: ${getCustomerName(sale.customerId)}`}
                    </p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded",
                    sale.saleType === 'CASH' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                  )}>
                    {sale.saleType === 'CASH' ? 'نقدي' : 'آجل'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                  <p className="text-xs text-gray-500">{sale.items.length} منتجات</p>
                  <p className="text-sm font-black text-indigo-600">{formatCurrency(sale.total)}</p>
                </div>
              </Card>
            ))}
            {sales.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center gap-3 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-sm">لا توجد مبيعات حتى الآن</p>
                <button 
                  onClick={() => setView('NEW')}
                  className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                >
                  إضافة أول بيع
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
      {/* Delete Sale Modal */}
      {deleteSaleState && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 p-5 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">هل أنت متأكد؟</h2>
            
            <p className="text-gray-500 text-sm mb-6">
              سيتم حذف عملية البيع وتحديث المخزون (إرجاع الكميات) وتعديل رصيد الزبون إن كان البيع آجلاً.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteSaleState(null)}
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
      {refundSaleState && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5">
            <h2 className="text-xl font-bold mb-2">مرتجع مبيعات</h2>
            <p className="text-xs text-gray-500 mb-4">حدد الكمية المراد إرجاعها للمخزون.</p>
            <div className="space-y-3 max-h-64 overflow-auto">
              {refundSaleState.items.map(item => {
                const available = item.quantity - (item.returnedQuantity || 0);
                return <label key={item.productId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl"><span className="text-sm font-bold">{item.productName} <small className="text-gray-400">متاح {available}</small></span><input type="number" min="0" max={available} value={refundQuantities[item.productId] || 0} onChange={event => setRefundQuantities({...refundQuantities, [item.productId]: Number(event.target.value)})} className="w-20 border rounded-lg p-2" /></label>;
              })}
            </div>
            {actionError && <p className="text-xs text-red-600 mt-3">{actionError}</p>}
            <div className="flex gap-3 mt-5"><button onClick={() => { setRefundSaleState(null); setActionError(''); }} className="flex-1 bg-gray-100 rounded-xl py-3 font-bold">إلغاء</button><button onClick={handleRefund} className="flex-1 bg-orange-600 text-white rounded-xl py-3 font-bold">تأكيد المرتجع</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
