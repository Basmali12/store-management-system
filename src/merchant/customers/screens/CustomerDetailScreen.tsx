
import React, { useState } from 'react';
import { ChevronRight, Phone, MessageCircle, HandCoins, ArrowDownToLine, ReceiptText, X, Trash2, AlertTriangle } from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { cn } from '../../../shared/utils/utils';
import { getCustomer, getDebts, addDebt, Debt, addPayment, Payment, getPayments, deleteDebt, deletePayment } from '../../debts/services/debtService';
import { openWhatsApp } from '../../whatsapp/services/whatsappService';
import { generateDebtReminder, generatePaymentReceipt, generateAccountSummary } from '../../whatsapp/templates/messageTemplates';
import { getMerchantSession } from '../../../shared/storage/session';
import { getMerchantAccount } from '../../../shared/auth/merchantAccounts';

interface CustomerDetailScreenProps {
  customerId: string;
  onBack: () => void;
  initialAction?: 'add_debt' | 'add_payment' | null;
}

export function CustomerDetailScreen({ customerId, onBack, initialAction = null }: CustomerDetailScreenProps) {
  const [customer, setCustomer] = useState(getCustomer(customerId));
  const [debts, setDebts] = useState<Debt[]>(getDebts(customerId));
  const [payments, setPayments] = useState<Payment[]>(getPayments(customerId));
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(initialAction === 'add_debt');
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(initialAction === 'add_payment');

  React.useEffect(() => {
    if (initialAction === 'add_debt') setIsAddDebtOpen(true);
    if (initialAction === 'add_payment') setIsAddPaymentOpen(true);
  }, [initialAction]);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState<{amount: number, balanceBefore: number, balanceAfter: number} | null>(null);
  const [paymentError, setPaymentError] = useState('');

  // Form State
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [debtError, setDebtError] = useState('');

  const [deleteDebtId, setDeleteDebtId] = useState<string | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteDebt = () => {
    if (!deleteDebtId) return;
    try {
      deleteDebt(customerId, deleteDebtId);
      setDeleteDebtId(null);
      setDeleteError('');
      setCustomer(getCustomer(customerId));
      setDebts(getDebts(customerId));
      setPayments(getPayments(customerId));
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'تعذر حذف الدين');
    }
  };

  const handleDeletePayment = () => {
    if (!deletePaymentId) return;
    deletePayment(customerId, deletePaymentId);
    setDeletePaymentId(null);
    setCustomer(getCustomer(customerId));
    setDebts(getDebts(customerId));
    setPayments(getPayments(customerId));
  };

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    setDebtError('');
    if (!description || !amount) return;

    const parsedQty = parseInt(quantity);
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setDebtError('يرجى إدخال مبلغ صالح أكبر من صفر.');
      return;
    }

    if (isNaN(parsedQty) || parsedQty < 0) {
      setDebtError('يرجى إدخال كمية صالحة.');
      return;
    }
    
    addDebt(customerId, {
      description,
      quantity: parsedQty || 1,
      amount: parsedAmount,
      note,
      ...(dueDate ? { dueDate } : {})
    });

    // Refresh state
    setCustomer(getCustomer(customerId));
    setDebts(getDebts(customerId));
    setPayments(getPayments(customerId));
    
    // Reset and close
    setDescription('');
    setQuantity('1');
    setAmount('');
    setNote('');
    setDueDate('');
    setIsAddDebtOpen(false);
  };

  
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    const amt = parseFloat(paymentAmount);
    
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('يرجى إدخال مبلغ صالح أكبر من صفر.');
      return;
    }
    
    if (customer && amt > customer.balance) {
      setPaymentError('مبلغ التسديد أكبر من المبلغ المتبقي.');
      return;
    }
    
    const res = addPayment(customerId, amt, paymentNote);
    
    setCustomer(getCustomer(customerId));
    setDebts(getDebts(customerId));
    setPayments(getPayments(customerId));
    
    setPaymentAmount('');
    setPaymentNote('');
    setIsAddPaymentOpen(false);
    
    if (res) {
      setPaymentSuccess({ amount: amt, balanceBefore: res.balanceBefore, balanceAfter: res.balanceAfter });
    }
  };
  
  const handleSendReminder = () => {
    if (!customer?.phone) return;
    const date = new Date().toLocaleDateString('ar-IQ');
    const storeName = getMerchantAccount(getMerchantSession() || '')?.storeName || 'متجرنا';
    const msg = generateDebtReminder(customer.name, storeName, customer.balance, date);
    openWhatsApp(customer.phone, msg);
  };
  
  const handleSendSummary = () => {
    if (!customer?.phone) return;
    const storeName = getMerchantAccount(getMerchantSession() || '')?.storeName || 'متجرنا';
    const msg = generateAccountSummary(customer.name, storeName, customer.totalTaken, customer.totalPaid, customer.balance);
    openWhatsApp(customer.phone, msg);
  };
  
  const handleSendReceipt = () => {
    if (!customer?.phone || !paymentSuccess) return;
    const date = new Date().toLocaleDateString('ar-IQ');
    const storeName = getMerchantAccount(getMerchantSession() || '')?.storeName || 'متجرنا';
    const msg = generatePaymentReceipt(customer.name, storeName, paymentSuccess.amount, paymentSuccess.balanceBefore, paymentSuccess.balanceAfter, date);
    openWhatsApp(customer.phone, msg);
    setPaymentSuccess(null);
  };


  if (!customer) return <div>غير موجود</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      
      {/* Header */}
      <div className="bg-gray-50 px-6 pt-10 pb-6 border-b border-gray-100 sticky top-0 z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -mr-2 bg-white rounded-full text-gray-600 hover:bg-gray-100 shadow-sm transition-colors">
            <ChevronRight size={24} />
          </button>
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            {customer.name.substring(0, 2)}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800 leading-tight">{customer.name}</h1>
            <p className="text-xs text-gray-500 mt-0.5" dir="ltr">{customer.phone}</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mt-16 blur-xl pointer-events-none"></div>
          <p className="text-xs opacity-80 mb-1">المبلغ المتبقي</p>
          <h2 className="text-2xl font-bold mb-4">{formatCurrency(customer.balance)}</h2>
          
          <div className="flex pt-4 border-t border-white/20 text-center">
            <div className="flex-1 border-l border-white/20">
              <p className="text-[10px] opacity-80">إجمالي الأخذ</p>
              <p className="font-bold text-sm">{formatCurrency(customer.totalTaken)}</p>
            </div>
            <div className="flex-1">
              <p className="text-[10px] opacity-80">إجمالي التسديد</p>
              <p className="font-bold text-sm">{formatCurrency(customer.totalPaid)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto bg-gray-50">
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setIsAddDebtOpen(true)} className="bg-indigo-600 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all">
            <HandCoins size={18} /> إضافة دين
          </button>
          <button onClick={() => setIsAddPaymentOpen(true)} className="bg-green-600 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-green-100 flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all">
            <ArrowDownToLine size={18} /> تسجيل تسديد
          </button>
          
          {customer?.phone && (
            <>
              <button onClick={handleSendReminder} className="bg-blue-50 text-blue-700 border border-blue-100 rounded-xl py-2.5 text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-blue-100 active:scale-95 transition-all">
                <MessageCircle size={16} /> تذكير بالدين
              </button>
              <button onClick={handleSendSummary} className="bg-blue-50 text-blue-700 border border-blue-100 rounded-xl py-2.5 text-xs font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-blue-100 active:scale-95 transition-all">
                <ReceiptText size={16} /> ملخص الحساب
              </button>
            </>
          )}
        </div>

        {/* Unpaid Items (Debts) */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 px-1 mb-2">الديون الحالية</h3>
          <div className="space-y-2">
            {debts.filter(d => d.status === 'OPEN').map(d => (
              <div key={d.debtId} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center relative pr-10">
                <button
                  onClick={() => setDeleteDebtId(d.debtId)}
                  className="absolute right-2 top-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex-1 pl-2 mr-2">
                  <p className="text-sm font-bold text-gray-900">{d.description}</p>
                  <p className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span>الكمية: {d.quantity}</span>
                    <span className="text-gray-300">|</span>
                    <span>{d.createdAt}</span>
                  </p>
                  {d.note && <p className="text-[10px] text-gray-400 mt-1">{d.note}</p>}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-red-600">{formatCurrency(d.remainingAmount)}</p>
                </div>
              </div>
            ))}
            {debts.filter(d => d.status === 'OPEN').length === 0 && (
              <div className="text-center py-12 flex flex-col items-center gap-3 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-400 text-sm">لا توجد ديون حتى الآن</p>
                <button 
                  onClick={() => setIsAddDebtOpen(true)}
                  className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                >
                  إضافة أول دين
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Payments History */}
        <section className="mt-6">
          <h3 className="text-xs font-bold text-gray-500 px-1 mb-2">سجل التسديدات</h3>
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.paymentId} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center relative pr-10">
                <button
                  onClick={() => setDeletePaymentId(p.paymentId)}
                  className="absolute right-2 top-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <div className="flex-1 pl-2 mr-2">
                  <p className="text-sm font-bold text-gray-900">تسديد دفعة</p>
                  <p className="text-xs text-gray-500 mt-1">{p.createdAt}</p>
                  {p.note && <p className="text-[10px] text-gray-400 mt-1">{p.note}</p>}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-green-600">{formatCurrency(p.amount)}</p>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="text-center py-6 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-400 text-sm">لا توجد تسديدات مسجلة</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add Debt Modal */}
      {isAddDebtOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-[Cairo]">
          <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">إضافة دين جديد</h2>
              <button onClick={() => setIsAddDebtOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddDebt} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">اسم المادة أو الوصف</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} required placeholder="مثال: بيبسي عائلي" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">الكمية</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">السعر الإجمالي</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="1000" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">ملاحظة اختياري</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="أي تفاصيل إضافية..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">تاريخ الاستحقاق (اختياري)</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" />
              </div>
              
              {debtError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold">
                  {debtError}
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200">
                حفظ الدين
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Add Payment Modal */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-[Cairo]">
          <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">تسجيل تسديد</h2>
              <button onClick={() => setIsAddPaymentOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddPayment} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">مبلغ التسديد</label>
                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required placeholder="مثال: 50000" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">ملاحظة اختياري</label>
                <input type="text" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="أي تفاصيل إضافية..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" />
              </div>
              
              {paymentError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold">
                  {paymentError}
                </div>
              )}

              <button type="submit" className="w-full bg-green-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-green-700 active:scale-[0.98] transition-all shadow-md shadow-green-200">
                تأكيد التسديد
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 font-[Cairo]">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden flex flex-col p-6 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowDownToLine size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">تم تسجيل التسديد!</h2>
            <p className="text-sm text-gray-500 mb-6">المبلغ: {formatCurrency(paymentSuccess.amount)}</p>
            
            <div className="space-y-3">
              {customer?.phone && (
                <button onClick={handleSendReceipt} className="w-full bg-green-600 text-white font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all shadow-md shadow-green-200">
                  <MessageCircle size={20} /> إرسال إشعار التسديد
                </button>
              )}
              <button onClick={() => setPaymentSuccess(null)} className="w-full bg-gray-100 text-gray-700 font-bold rounded-xl p-4 hover:bg-gray-200 active:scale-95 transition-all">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Debt Modal */}
      {deleteDebtId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 p-5 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">هل أنت متأكد؟</h2>
            <p className="text-gray-500 text-sm mb-6">
              سيتم حذف الدين ويتم إنقاص المبلغ من رصيد الزبون.
            </p>
            {deleteError && <p className="text-red-600 text-xs font-bold mb-4">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteDebtId(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold rounded-xl py-3">إلغاء</button>
              <button onClick={handleDeleteDebt} className="flex-1 bg-red-600 text-white font-bold rounded-xl py-3">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Payment Modal */}
      {deletePaymentId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 p-5 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">هل أنت متأكد؟</h2>
            <p className="text-gray-500 text-sm mb-6">
              سيتم حذف التسديد وإرجاع المبلغ كدين على الزبون (وإعادة توزيعه على الديون المفتوحة).
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletePaymentId(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold rounded-xl py-3">إلغاء</button>
              <button onClick={handleDeletePayment} className="flex-1 bg-red-600 text-white font-bold rounded-xl py-3">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
