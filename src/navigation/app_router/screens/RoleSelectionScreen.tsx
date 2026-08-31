
import React from 'react';
import { Store, User } from 'lucide-react';

interface Props {
  onSelectMerchant: () => void;
  onSelectCustomer: () => void;
}

export function RoleSelectionScreen({ onSelectMerchant, onSelectCustomer }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">أهلاً بك</h1>
          <p className="text-gray-500 text-sm">اختر نوع الدخول للمتابعة</p>
        </div>
        
        <div className="space-y-4 mt-8">
          <button 
            onClick={onSelectMerchant}
            className="w-full bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all group active:scale-[0.98]"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Store size={32} />
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900">صاحب المحل</h2>
              <p className="text-xs text-gray-500 mt-1">إدارة المحل، الديون، والمخزون</p>
            </div>
          </button>

          <button 
            onClick={onSelectCustomer}
            className="w-full bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-4 hover:border-teal-200 hover:shadow-md transition-all group active:scale-[0.98]"
          >
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <User size={32} />
            </div>
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900">زبون</h2>
              <p className="text-xs text-gray-500 mt-1">متابعة حسابي والديون السابقة</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
