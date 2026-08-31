import React, { useState, useEffect } from "react";
import { Card } from "../../../shared/components/Card";
import { formatCurrency } from "../../../data/mock/merchant/mockData";
import { Search, ChevronLeft, Plus, X, Edit, Trash2, AlertTriangle } from "lucide-react";
import { cn } from "../../../shared/utils/utils";
import { getCustomers, addCustomer, updateCustomer, canDeleteCustomer, deleteCustomer } from "../../debts/services/debtService";
import { Customer } from "../../../shared/models/types";

interface AccountsScreenProps {
  onCustomerSelect: (customerId: string) => void;
  initialShowAdd?: boolean;
  onAddClosed?: () => void;
}

export function AccountsScreen({
  onCustomerSelect,
  initialShowAdd = false,
  onAddClosed,
}: AccountsScreenProps) {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [isAddOpen, setIsAddOpen] = useState(initialShowAdd);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [deleteCustomerState, setDeleteCustomerState] = useState<Customer | null>(null);
  const [cannotDeleteMsg, setCannotDeleteMsg] = useState("");
  const [customerFormError, setCustomerFormError] = useState("");

  const refresh = () => setCustomers(getCustomers());

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (initialShowAdd) {
      setIsAddOpen(true);
    }
  }, [initialShowAdd]);

  const handleEditClick = (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation();
    setCustomerFormError("");
    setEditCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone);
  };

  const handleSaveEdit = () => {
    if (!editCustomer || !editName) return;
    try {
      updateCustomer(editCustomer.id, editName, editPhone);
      setCustomerFormError("");
      setEditCustomer(null);
      refresh();
    } catch (error) {
      setCustomerFormError(error instanceof Error ? error.message : "تعذر حفظ بيانات الزبون");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation();
    if (canDeleteCustomer(c.id)) {
      setDeleteCustomerState(c);
      setCannotDeleteMsg("");
    } else {
      setDeleteCustomerState(c);
      setCannotDeleteMsg("هذا الزبون لديه معاملات مرتبطة. يجب معالجة حسابه أولًا قبل الحذف.");
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteCustomerState) return;
    deleteCustomer(deleteCustomerState.id);
    setDeleteCustomerState(null);
    refresh();
  };

  const handleAddCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    try {
      await addCustomer(newName, newPhone);
      refresh();
      setNewName("");
      setNewPhone("");
      setCustomerFormError("");
      setIsAddOpen(false);
      onAddClosed?.();
    } catch (error) {
      setCustomerFormError(error instanceof Error ? error.message : "تعذر إضافة الزبون");
    }
  };

  const filteredCustomers = customers.filter(
    (c) => c.name.includes(search) || c.phone.includes(search),
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">حسابات الزبائن</h1>
          <button
            onClick={() => {
              setCustomerFormError("");
              setIsAddOpen(true);
            }}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="بحث عن زبون..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pr-10 p-3 outline-none transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredCustomers.map((customer) => (
          <Card
            key={customer.id}
            className="!p-4 cursor-pointer hover:border-indigo-200 transition-colors active:scale-[0.98]"
            onClick={() => onCustomerSelect(customer.id)}
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">{customer.name}</h3>
                <p className="text-xs text-gray-500 mt-1" dir="ltr">
                  {customer.phone}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button onClick={(e) => handleEditClick(e, customer)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                    <Edit size={16} />
                  </button>
                  <button onClick={(e) => handleDeleteClick(e, customer)} className="text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-left flex flex-col items-end gap-1">
                <div className="flex items-center text-sm gap-2">
                  <span className="text-gray-500 text-xs">عليه:</span>
                  <span
                    className={cn(
                      "font-bold",
                      customer.balance > 0
                        ? "text-orange-600"
                        : "text-emerald-600",
                    )}
                  >
                    {formatCurrency(customer.balance)}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  آخر حركة: {customer.lastActivity}
                  <ChevronLeft size={12} />
                </div>
              </div>
            </div>
          </Card>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center gap-3 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">لا يوجد زبائن حتى الآن</p>
            <button
              onClick={() => {
                setCustomerFormError("");
                setIsAddOpen(true);
              }}
              className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
            >
              إضافة أول زبون
            </button>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">إضافة زبون جديد</h2>
              <button
                onClick={() => {
                  setCustomerFormError("");
                  setIsAddOpen(false);
                  onAddClosed?.();
                }}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  اسم الزبون
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="اسم الزبون..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="07..."
                  dir="ltr"
                  required
                />
              </div>
              {customerFormError && (
                <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{customerFormError}</p>
              )}
              <button
                onClick={handleAddCustomer}
                disabled={!newName.trim() || !newPhone.trim()}
                className="w-full bg-indigo-600 text-white font-bold rounded-xl py-3 disabled:opacity-50"
              >
                حفظ الزبون
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">تعديل بيانات الزبون</h2>
              <button
                onClick={() => {
                  setCustomerFormError("");
                  setEditCustomer(null);
                }}
                className="p-2 text-gray-400 hover:bg-gray-50 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  اسم الزبون
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  dir="ltr"
                  required
                />
              </div>
              {customerFormError && (
                <p className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-600">{customerFormError}</p>
              )}
              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim() || !editPhone.trim()}
                className="w-full bg-indigo-600 text-white font-bold rounded-xl py-3 disabled:opacity-50"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Modal */}
      {deleteCustomerState && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 p-5 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">هل أنت متأكد؟</h2>
            
            {cannotDeleteMsg ? (
              <>
                <p className="text-gray-500 text-sm mb-6">{cannotDeleteMsg}</p>
                <button
                  onClick={() => setDeleteCustomerState(null)}
                  className="w-full bg-gray-100 text-gray-700 font-bold rounded-xl py-3"
                >
                  إغلاق
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-6">سيتم حذف الزبون ({deleteCustomerState.name}) نهائياً. لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteCustomerState(null)}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold rounded-xl py-3"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-600 text-white font-bold rounded-xl py-3"
                  >
                    نعم، احذف
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
