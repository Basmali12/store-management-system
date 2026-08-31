
import React, { useState } from 'react';
import { ChevronRight, Store } from 'lucide-react';
import { registerMerchant } from '../../../../shared/auth/merchantAccounts';

interface Props {
  onRegister: (merchantId: string) => void;
  onBack: () => void;
}

export function MerchantRegisterScreen({ onRegister, onBack }: Props) {
  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    
    if (password.length < 8) return setError('كلمة المرور يجب أن تكون 8 أحرف أو أرقام على الأقل');
    try {
      const account = await registerMerchant({ ownerName, storeName, phone, password });
      onRegister(account.id);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'تعذر إنشاء الحساب');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]" dir="rtl">
      <div className="p-4 sticky top-0 bg-gray-50 z-10">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-600 hover:bg-gray-100 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col p-6 max-w-md w-full mx-auto">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
          <Store size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">إنشاء حساب جديد</h1>
        <p className="text-sm text-gray-500 mb-8">قم بتعبئة بيانات المحل للبدء</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 pb-10">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">اسم صاحب المحل</label>
            <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="مثال: أحمد محمد" className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">اسم المحل</label>
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="مثال: متجر الأمل" className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">رقم الهاتف</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">تأكيد كلمة المرور</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200">
            إنشاء حساب
          </button>
        </form>
      </div>
    </div>
  );
}
