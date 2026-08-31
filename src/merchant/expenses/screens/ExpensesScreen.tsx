import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Calendar, Edit2, Trash2, FileMinus, X } from 'lucide-react';
import { Expense, EXPENSE_CATEGORIES } from '../models/types';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../services/expenseService';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { cn } from '../../../shared/utils/utils';
import { Card } from '../../../shared/components/Card';
import { todayLocalDateKey, toLocalDateKey } from '../../../shared/utils/date';

interface ExpensesScreenProps {
  onBack?: () => void;
  initialShowForm?: boolean;
}

type FilterType = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

const formatExpenseDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function ExpensesScreen({ onBack, initialShowForm = false }: ExpensesScreenProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<FilterType>('MONTH');
  
  // Modals state
  const [showForm, setShowForm] = useState(initialShowForm);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [expenseError, setExpenseError] = useState('');

  const loadData = () => {
    setExpenses(getExpenses());
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialShowForm) {
      setShowForm(true);
    }
  }, [initialShowForm]);

  // Helpers for filtering and stats
  const now = new Date();
  const todayStr = todayLocalDateKey();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const filteredExpenses = expenses.filter(e => {
    const eDate = new Date(e.createdAt);
    if (filter === 'TODAY') {
      return toLocalDateKey(e.createdAt) === todayStr;
    }
    if (filter === 'WEEK') {
      return eDate >= sevenDaysAgo;
    }
    if (filter === 'MONTH') {
      return eDate.getMonth() === thisMonth && eDate.getFullYear() === thisYear;
    }
    return true; // ALL
  });

  const todayTotal = expenses
    .filter(e => toLocalDateKey(e.createdAt) === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const monthTotal = expenses
    .filter(e => {
      const d = new Date(e.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const handleSave = () => {
    setExpenseError('');
    const val = Number(amount);
    if (!category) return;
    
    if (isNaN(val) || val <= 0) {
      setExpenseError('يرجى إدخال مبلغ صالح أكبر من صفر.');
      return;
    }
    
    if (editingId) {
      updateExpense(editingId, category, val, note);
    } else {
      addExpense(category, val, note);
    }
    
    closeForm();
    loadData();
  };

  const closeForm = () => {
    setShowForm(false);
    setExpenseError('');
    setEditingId(null);
    setCategory(EXPENSE_CATEGORIES[0]);
    setAmount('');
    setNote('');
  };

  const openEdit = (e: Expense) => {
    setEditingId(e.expenseId);
    setCategory(e.category);
    setAmount(e.amount.toString());
    setNote(e.note || '');
    setShowForm(true);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteExpense(showDeleteConfirm);
      setShowDeleteConfirm(null);
      loadData();
    }
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
          <h1 className="text-xl font-bold text-gray-900">المصروفات</h1>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-700 active:scale-95 transition-all shadow-md shadow-rose-200"
        >
          <Plus size={18} />
          إضافة مصروف
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4 bg-rose-600 text-white border-none shadow-md shadow-rose-200">
            <p className="text-[11px] text-rose-100 mb-1">مصروفات اليوم</p>
            <p className="text-lg font-bold">{formatCurrency(todayTotal)}</p>
          </Card>
          <Card className="!p-4 bg-white border border-gray-100 shadow-sm">
            <p className="text-[11px] text-gray-500 mb-1">مصروفات هذا الشهر</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(monthTotal)}</p>
          </Card>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 overflow-x-auto hide-scrollbar">
          {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap min-w-[70px]",
                filter === f ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:bg-gray-200"
              )}
            >
              {f === 'TODAY' ? 'اليوم' : f === 'WEEK' ? 'أسبوع' : f === 'MONTH' ? 'الشهر' : 'الكل'}
            </button>
          ))}
        </div>

        <section>
          <div className="space-y-3 mt-2">
            {filteredExpenses.map(expense => (
              <Card key={expense.expenseId} className="!p-4 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                      <FileMinus size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{expense.category}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar size={10} />
                        {formatExpenseDate(expense.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-left flex flex-col items-end">
                    <span className="font-black text-rose-600 text-sm">
                      {formatCurrency(expense.amount)}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => openEdit(expense)} className="text-gray-400 hover:text-indigo-600 p-1">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setShowDeleteConfirm(expense.expenseId)} className="text-gray-400 hover:text-rose-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                {expense.note && (
                  <div className="pt-3 border-t border-gray-50 text-xs text-gray-500">
                    {expense.note}
                  </div>
                )}
              </Card>
            ))}
            {filteredExpenses.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center gap-3 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-sm">لا توجد مصروفات حتى الآن</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                >
                  إضافة أول مصروف
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
              </h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">المبلغ (د.ع)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-lg font-bold outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all text-rose-600 text-center"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">نوع المصروف</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">ملاحظات (اختياري)</label>
                <textarea 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all h-20 resize-none"
                  placeholder="تفاصيل المصروف..."
                />
              </div>
              
              {expenseError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mt-2">
                  {expenseError}
                </div>
              )}

              <div className="pt-2">
                <button 
                  onClick={handleSave}
                  className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-md shadow-rose-200"
                >
                  حفظ المصروف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 text-center shadow-2xl">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-500 mb-6">هل أنت متأكد من حذف هذا المصروف نهائياً؟ سيتم تحديث التقارير وصافي الأرباح بناءً على هذا التعديل.</p>
            <div className="flex gap-2">
              <button 
                onClick={handleDelete}
                className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-md shadow-rose-200"
              >
                نعم، احذف
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
