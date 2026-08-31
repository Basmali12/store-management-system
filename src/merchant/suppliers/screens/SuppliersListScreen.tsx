import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronLeft } from 'lucide-react';
import { Supplier } from '../models/types';
import { getSuppliers, addSupplier } from '../services/supplierService';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { cn } from '../../../shared/utils/utils';
import { Card } from '../../../shared/components/Card';
import { SupplierDetailScreen } from './SupplierDetailScreen';

interface SuppliersListScreenProps {
  initialShowAdd?: boolean;
  onAddClosed?: () => void;
}

export function SuppliersListScreen({ initialShowAdd = false, onAddClosed }: SuppliersListScreenProps = {}) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(initialShowAdd);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const loadSuppliers = () => {
    setSuppliers(getSuppliers());
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (initialShowAdd) {
      setShowAddModal(true);
    }
  }, [initialShowAdd]);

  const handleCloseAdd = () => {
    setShowAddModal(false);
    if (onAddClosed) onAddClosed();
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    addSupplier(newName.trim(), newPhone.trim(), newNotes.trim());
    setNewName('');
    setNewPhone('');
    setNewNotes('');
    handleCloseAdd();
    loadSuppliers();
  };

  const filtered = suppliers.filter(s => 
    s.name.includes(search) || s.phone.includes(search)
  );

  const totalDebt = suppliers.reduce((sum, s) => sum + s.balance, 0);

  if (selectedSupplierId) {
    return (
      <SupplierDetailScreen 
        supplierId={selectedSupplierId} 
        onBack={() => {
          setSelectedSupplierId(null);
          loadSuppliers();
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      <div className="bg-white px-5 pt-4 pb-4 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">الموردين</h1>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100"
        >
          <Plus size={18} />
          إضافة مورد
        </button>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4 bg-indigo-600 text-white border-none shadow-md shadow-indigo-200">
            <p className="text-[11px] text-indigo-100 mb-1">إجمالي الديون علينا</p>
            <p className="text-lg font-bold">{formatCurrency(totalDebt)}</p>
          </Card>
          <Card className="!p-4 bg-white border border-gray-100 shadow-sm">
            <p className="text-[11px] text-gray-500 mb-1">عدد الموردين</p>
            <p className="text-lg font-bold text-gray-900">{suppliers.length} مورد</p>
          </Card>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="بحث عن مورد بالاسم أو الرقم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 block pr-10 p-3 outline-none transition-all shadow-sm"
          />
        </div>

        <div className="space-y-3 mt-4">
          {filtered.map(supplier => (
            <Card 
              key={supplier.supplierId} 
              className="!p-4 cursor-pointer hover:border-indigo-200 transition-colors active:scale-[0.98]"
              onClick={() => setSelectedSupplierId(supplier.supplierId)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900">{supplier.name}</h3>
                  <p className="text-xs text-gray-500 mt-1" dir="ltr">{supplier.phone || 'لا يوجد رقم'}</p>
                </div>
                <div className="text-left flex flex-col items-end gap-1">
                  <div className="flex items-center text-sm gap-2">
                    <span className="text-gray-500 text-xs">علينا له:</span>
                    <span className={cn("font-bold", supplier.balance > 0 ? "text-rose-600" : "text-emerald-600")}>
                      {formatCurrency(supplier.balance)}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    التفاصيل / آخر حركة
                    <ChevronLeft size={12} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 flex flex-col items-center gap-3 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-400 text-sm">لا يوجد موردون حتى الآن</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
              >
                إضافة أول مورد
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900">إضافة مورد جديد</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">اسم المورد</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="شركة الأمل..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">رقم الهاتف</label>
                <input 
                  type="tel" 
                  value={newPhone} 
                  onChange={e => setNewPhone(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="07..."
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">ملاحظات (اختياري)</label>
                <textarea 
                  value={newNotes} 
                  onChange={e => setNewNotes(e.target.value)} 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-20 resize-none"
                  placeholder="ملاحظات حول المورد..."
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm disabled:bg-gray-300 disabled:text-gray-500 active:scale-95 transition-all"
                >
                  حفظ المورد
                </button>
                <button 
                  onClick={handleCloseAdd}
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
