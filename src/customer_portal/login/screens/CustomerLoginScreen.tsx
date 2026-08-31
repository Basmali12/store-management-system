import React, { useState } from 'react';
import { ChevronRight, User } from 'lucide-react';
import { getMerchantAccounts } from '../../../shared/auth/merchantAccounts';
import { createPasswordCredential, verifyPassword } from '../../../shared/security/password';
import { tenantGetItem, tenantSetItem } from '../../../shared/storage/tenantStorage';
import { CustomerSession } from '../../../shared/storage/session';

interface Props {
  onLogin: (session: CustomerSession) => void;
  onBack: () => void;
}

export function CustomerLoginScreen({ onLogin, onBack }: Props) {
  const [loginNumber, setLoginNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    for (const merchant of getMerchantAccounts()) {
      const local = tenantGetItem('merchant_customers', merchant.id);
      if (!local) continue;
      const customers = JSON.parse(local);
      const found = customers.find((c: any) => c.customerLoginNumber === loginNumber);
      const valid = found && (found.customerPasswordCredential
        ? await verifyPassword(password, found.customerPasswordCredential)
        : found.customerPassword === password);
      if (!valid) continue;
      if (!found.customerPasswordCredential) {
        found.customerPasswordCredential = await createPasswordCredential(password);
        delete found.customerPassword;
        tenantSetItem('merchant_customers', JSON.stringify(customers), merchant.id);
      }
      setError('');
      onLogin({ merchantId: merchant.id, customerId: found.id });
      return;
    }
    
    setError('رقم الزبون أو كلمة السر غير صحيحة. يرجى التأكد والمحاولة مرة أخرى.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]" dir="rtl">
      <div className="p-4 sticky top-0 bg-gray-50 z-10">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-600 hover:bg-gray-100 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center p-6 max-w-md w-full mx-auto -mt-10">
        <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-teal-200">
          <User size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">تسجيل دخول الزبون</h1>
        <p className="text-sm text-gray-500 mb-8">تابع ديونك ومدفوعاتك بكل سهولة</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">رقم الزبون</label>
            <input 
              type="text" 
              value={loginNumber}
              onChange={(e) => setLoginNumber(e.target.value)}
              placeholder="مثال: 58372194" 
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all text-left" 
              dir="ltr" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">كلمة السر</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••" 
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all text-left" 
              dir="ltr" 
              required 
            />
          </div>

          <button type="submit" className="w-full bg-teal-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-teal-700 active:scale-[0.98] transition-all shadow-md shadow-teal-200">
            دخول إلى حسابي
          </button>
        </form>
      </div>
    </div>
  );
}
