const fs = require('fs');

const debtModal = `
import React, { useState } from 'react';
import { ChevronRight, Phone, MessageCircle, HandCoins, ArrowDownToLine, ReceiptText, X } from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { cn } from '../../../shared/utils/utils';
import { getCustomer, getDebts, addDebt, Debt } from '../../debts/services/debtService';

interface CustomerDetailScreenProps {
  customerId: string;
  onBack: () => void;
}

export function CustomerDetailScreen({ customerId, onBack }: CustomerDetailScreenProps) {
  const [customer, setCustomer] = useState(getCustomer(customerId));
  const [debts, setDebts] = useState<Debt[]>(getDebts(customerId));
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);

  // Form State
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    addDebt(customerId, {
      description,
      quantity: parseInt(quantity) || 1,
      amount: parseFloat(amount) || 0,
      note
    });

    // Refresh state
    setCustomer(getCustomer(customerId));
    setDebts(getDebts(customerId));
    
    // Reset and close
    setDescription('');
    setQuantity('1');
    setAmount('');
    setNote('');
    setIsAddDebtOpen(false);
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
          <button className="bg-gray-300 text-gray-500 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed">
            <ArrowDownToLine size={18} /> تسجيل تسديد
          </button>
        </div>

        {/* Unpaid Items (Debts) */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 px-1 mb-2">الديون الحالية</h3>
          <div className="space-y-2">
            {debts.filter(d => d.status === 'OPEN').map(d => (
              <div key={d.debtId} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex-1 pl-2">
                  <p className="text-sm font-bold text-gray-900">{d.description}</p>
                  <p className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span>الكمية: {d.quantity}</span>
                    <span className="text-gray-300">|</span>
                    <span>{d.createdAt}</span>
                  </p>
                  {d.note && <p className="text-[10px] text-gray-400 mt-1">{d.note}</p>}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-red-600">{formatCurrency(d.amount)}</p>
                </div>
              </div>
            ))}
            {debts.filter(d => d.status === 'OPEN').length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">لا توجد ديون حالية</div>
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
                  <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">السعر الإجمالي</label>
                  <input type="number" min="0" step="250" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="1000" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">ملاحظة اختياري</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="أي تفاصيل إضافية..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" />
              </div>
              
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200">
                حفظ الدين
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
`;

fs.writeFileSync('src/merchant/customers/screens/CustomerDetailScreen.tsx', debtModal);
