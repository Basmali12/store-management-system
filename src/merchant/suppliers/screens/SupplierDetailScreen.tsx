import React, { useState, useEffect } from 'react';
import { ArrowRight, Wallet, History, ArrowDownToLine, HandCoins, Truck, Trash2 } from 'lucide-react';
import { Supplier, SupplierPayment } from '../models/types';
import { getSupplierById, addSupplierPayment, getSupplierPayments, deleteSupplierPayment } from '../services/supplierService';
import { getPurchases } from '../../purchases/services/purchasesService';
import { Purchase } from '../../purchases/models/types';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { cn } from '../../../shared/utils/utils';
import { Card } from '../../../shared/components/Card';

interface SupplierDetailScreenProps {
  supplierId: string;
  onBack: () => void;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function SupplierDetailScreen({ supplierId, onBack }: SupplierDetailScreenProps) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const loadData = () => {
    const s = getSupplierById(supplierId);
    if (s) setSupplier(s);
    setPayments(getSupplierPayments(supplierId));
    
    const allPurchases = getPurchases();
    // Only get CREDIT purchases for this supplier
    setPurchases(allPurchases.filter(p => p.supplierId === supplierId && p.paymentType === 'CREDIT'));
  };

  useEffect(() => {
    loadData();
  }, [supplierId]);

  if (!supplier) return null;

  const handlePayment = () => {
    const amount = Number(paymentAmount);
    if (amount > 0) {
      addSupplierPayment(supplierId, amount, paymentNote);
      setPaymentAmount('');
      setPaymentNote('');
      setShowPaymentModal(false);
      loadData();
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    if (!window.confirm('هل تريد حذف تسديد المورد وإعادة احتساب الرصيد؟')) return;
    deleteSupplierPayment(supplierId, paymentId);
    loadData();
  };

  // Combine payments and purchases into a single history log
  const history = [
    ...payments.map(p => ({
      id: p.supplierPaymentId,
      type: 'PAYMENT' as const,
      amount: p.amount,
      date: p.createdAt,
      note: p.note,
    })),
    ...purchases.map(p => ({
      id: p.purchaseId,
      type: 'PURCHASE' as const,
      amount: p.total,
      date: p.createdAt,
      note: p.items.length + ' منتجات',
      remaining: p.remainingAmount,
      status: p.status
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      <div className="bg-indigo-600 px-5 pt-4 pb-6 shadow-sm sticky top-0 z-10 text-white rounded-b-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="p-2 -mr-2 bg-indigo-500/30 rounded-full text-white hover:bg-indigo-500/50 transition-colors">
            <ArrowRight size={20} />
          </button>
          <h1 className="text-xl font-bold">ملف المورد</h1>
        </div>
        
        <div className="mb-4">
          <h2 className="text-2xl font-black">{supplier.name}</h2>
          <p className="text-indigo-200 text-sm mt-1" dir="ltr">{supplier.phone || 'لا يوجد رقم'}</p>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 flex justify-between items-center">
          <div>
            <p className="text-indigo-200 text-xs mb-1">المتبقي علينا له</p>
            <p className="text-2xl font-bold">{formatCurrency(supplier.balance)}</p>
          </div>
          <button 
            onClick={() => setShowPaymentModal(true)}
            disabled={supplier.balance <= 0}
            className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            <ArrowDownToLine size={16} />
            تسجيل تسديد
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4 bg-white border border-gray-100 shadow-sm">
            <p className="text-[11px] text-gray-500 mb-1">إجمالي المشتريات الآجلة</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalPurchases)}</p>
          </Card>
          <Card className="!p-4 bg-emerald-50 border border-emerald-100 shadow-sm">
            <p className="text-[11px] text-emerald-600 mb-1">إجمالي التسديدات</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          </Card>
        </div>

        <section>
          <h3 className="text-xs font-bold text-gray-500 mb-3 px-1 flex items-center gap-2">
            <History size={14} /> سجل الحركات
          </h3>
          <div className="space-y-3">
            {history.map(item => (
              <Card key={item.id} className="!p-4 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      item.type === 'PURCHASE' ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500"
                    )}>
                      {item.type === 'PURCHASE' ? <Truck size={16} /> : <HandCoins size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {item.type === 'PURCHASE' ? 'شراء آجل' : 'تسديد للمورد'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(item.date)}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-black",
                    item.type === 'PURCHASE' ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {item.type === 'PURCHASE' ? '+' : '-'}{formatCurrency(item.amount)}
                  </span>
                  {item.type === 'PAYMENT' && <button onClick={() => handleDeletePayment(item.id)} className="text-gray-400 hover:text-red-600" title="حذف التسديد"><Trash2 size={15}/></button>}
                </div>
                
                {item.type === 'PURCHASE' && item.status !== undefined && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[11px] text-gray-500">حالة السداد:</span>
                    {item.status === 'PAID' ? (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">تم السداد بالكامل</span>
                    ) : (
                      <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        المتبقي: {formatCurrency(item.remaining ?? 0)}
                      </span>
                    )}
                  </div>
                )}
                {item.type === 'PAYMENT' && item.note && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-500">{item.note}</p>
                  </div>
                )}
              </Card>
            ))}
            {history.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                لا توجد حركات حتى الآن
              </div>
            )}
          </div>
        </section>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900">تسجيل تسديد</h2>
              <p className="text-xs text-gray-500 mt-1">
                الرصيد المطلوب: <span className="font-bold text-rose-600">{formatCurrency(supplier.balance)}</span>
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">المبلغ (د.ع)</label>
                <input 
                  type="number" 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg font-bold outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-indigo-600 text-center"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">ملاحظات (اختياري)</label>
                <textarea 
                  value={paymentNote} 
                  onChange={e => setPaymentNote(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-20 resize-none"
                  placeholder="رقم الحوالة، اسم المستلم..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handlePayment}
                  disabled={!paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > supplier.balance}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm disabled:bg-gray-300 disabled:text-gray-500 active:scale-95 transition-all"
                >
                  حفظ التسديد
                </button>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm active:scale-95 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
