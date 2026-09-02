
import React from 'react';
import { ChevronLeft, Store, User } from 'lucide-react';

interface Props {
  onSelectMerchant: () => void;
  onSelectCustomer: () => void;
}

export function RoleSelectionScreen({ onSelectMerchant, onSelectCustomer }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#07162b] via-[#10294a] to-[#f8fafc] flex flex-col items-center justify-center p-5 font-[Cairo]" dir="rtl">
      <div className="w-full max-w-md overflow-hidden rounded-[2.2rem] border border-white/20 bg-white/95 shadow-2xl shadow-slate-950/30">
        <div className="bg-[#0b1b33] px-6 pb-8 pt-7 text-center text-white">
          <img
            src={`${import.meta.env.BASE_URL}alnoor-logo.png`}
            alt="شعار تطبيق النور"
            className="mx-auto mb-4 h-24 w-24 rounded-[1.7rem] object-cover shadow-xl shadow-amber-400/20"
          />
          <h1 className="text-3xl font-black text-amber-300">أهلاً بك في النور للإدارة والديون</h1>
          <p className="mt-2 text-sm text-slate-300">اختر طريقة الدخول للمتابعة</p>
        </div>
        
        <div className="space-y-4 p-5">
          <button 
            onClick={onSelectMerchant}
            className="role-choice-card group flex w-full items-center gap-4 rounded-[1.5rem] border border-indigo-100 bg-indigo-50/70 p-5 text-right shadow-sm transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Store size={32} />
            </div>
            <div className="flex-1">
              <h2 className="role-choice-title text-lg font-bold text-gray-900">صاحب المحل</h2>
              <p className="role-choice-description text-xs text-gray-500 mt-1">إدارة المحل، الديون، والمخزون</p>
            </div>
            <ChevronLeft className="text-indigo-300 transition-transform group-hover:-translate-x-1" />
          </button>

          <button 
            onClick={onSelectCustomer}
            className="role-choice-card group flex w-full items-center gap-4 rounded-[1.5rem] border border-teal-100 bg-teal-50/70 p-5 text-right shadow-sm transition-all hover:border-teal-300 hover:shadow-md active:scale-[0.98]"
          >
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-200">
              <User size={32} />
            </div>
            <div className="flex-1">
              <h2 className="role-choice-title text-lg font-bold text-gray-900">دخول الزبون</h2>
              <p className="role-choice-description text-xs text-gray-500 mt-1">مشاهدة ديوني وتسديداتي برقم الهاتف</p>
            </div>
            <ChevronLeft className="text-teal-300 transition-transform group-hover:-translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
