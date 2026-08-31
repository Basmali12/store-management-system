import React, { useState } from 'react';
import { ChevronRight, User } from 'lucide-react';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import { getMerchantAccounts } from '../../../shared/auth/merchantAccounts';
import { tenantGetItem, tenantStorageKey } from '../../../shared/storage/tenantStorage';
import { CustomerSession } from '../../../shared/storage/session';
import { normalizePhone } from '../../../shared/utils/phone';

interface Props {
  onLogin: (session: CustomerSession) => void;
  onBack: () => void;
}

export function CustomerLoginScreen({ onLogin, onBack }: Props) {
  const [loginNumber, setLoginNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedPhone = normalizePhone(loginNumber);
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      setError('أدخل رقم الهاتف المسجل بشكل صحيح.');
      return;
    }
    setIsLoading(true);
    setError('');

    for (const merchant of getMerchantAccounts()) {
      const local = tenantGetItem('merchant_customers', merchant.id);
      if (!local) continue;
      const customers = JSON.parse(local);
      const found = customers.find((customer: { phone?: string }) =>
        normalizePhone(customer.phone || '') === normalizedPhone);
      if (!found) continue;
      setError('');
      onLogin({ merchantId: merchant.id, customerId: found.id });
      return;
    }

    try {
      const convexUrl = import.meta.env.VITE_CONVEX_URL?.trim();
      if (convexUrl && navigator.onLine) {
        const client = new ConvexHttpClient(convexUrl);
        const result = await client.query(api.storeData.customerPortalByPhone, { phone: normalizedPhone });
        if (result) {
          const merchantId = 'merchant_official';
          localStorage.setItem(tenantStorageKey('merchant_customers', merchantId), JSON.stringify([result.customer]));
          localStorage.setItem(tenantStorageKey('merchant_debts', merchantId), JSON.stringify({ [result.customer.id]: result.debts }));
          localStorage.setItem(tenantStorageKey('merchant_payments', merchantId), JSON.stringify({ [result.customer.id]: result.payments }));
          onLogin({ merchantId, customerId: result.customer.id });
          return;
        }
      }
      setError('رقم الهاتف غير مسجل في النظام. تأكد من الرقم وحاول مرة أخرى.');
    } catch {
      setError(navigator.onLine
        ? 'تعذر الاتصال بالنظام الآن. حاول مرة أخرى.'
        : 'لا يوجد اتصال، وهذا الرقم غير محفوظ على هذا الجهاز بعد.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]" dir="rtl">
      <div className="p-4 sticky top-0 bg-gray-50 z-10">
        <button type="button" onClick={onBack} aria-label="العودة لاختيار نوع الدخول" className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-600 hover:bg-gray-100 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center p-6 max-w-md w-full mx-auto -mt-10">
        <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-teal-200">
          <User size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">تسجيل دخول الزبون</h1>
        <p className="text-sm text-gray-500 mb-8">أدخل رقم هاتفك المسجل لمشاهدة ديونك وتسديداتك</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="customer-phone" className="block text-xs font-bold text-gray-700 mb-2">رقم الهاتف المسجل</label>
            <input 
              id="customer-phone"
              type="text" 
              value={loginNumber}
              onChange={(e) => setLoginNumber(e.target.value)}
              placeholder="07xxxxxxxxx"
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all text-left" 
              dir="ltr" 
              required 
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-teal-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-teal-700 active:scale-[0.98] transition-all shadow-md shadow-teal-200 disabled:cursor-wait disabled:opacity-60">
            {isLoading ? 'جاري التحقق...' : 'دخول إلى حسابي'}
          </button>
        </form>
      </div>
    </div>
  );
}
