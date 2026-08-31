const fs = require('fs');

fs.mkdirSync('src/customer_portal/home/screens', { recursive: true });

// 1. CustomerLoginScreen.tsx
fs.writeFileSync('src/customer_portal/login/screens/CustomerLoginScreen.tsx', `
import React, { useState } from 'react';
import { ChevronRight, User } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onBack: () => void;
}

export function CustomerLoginScreen({ onLogin, onBack }: Props) {
  const [merchantCode, setMerchantCode] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate against mock data
    if (merchantCode.toUpperCase() === 'M1001' && customerId === '25' && pin === '1234') {
      setError('');
      onLogin();
    } else {
      setError('البيانات المدخلة غير صحيحة. يرجى التأكد والمحاولة مرة أخرى.');
    }
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
            <label className="block text-xs font-bold text-gray-700 mb-2">كود صاحب المحل</label>
            <input 
              type="text" 
              value={merchantCode}
              onChange={(e) => setMerchantCode(e.target.value)}
              placeholder="مثال: M1001" 
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all text-left uppercase" 
              dir="ltr" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">رقم الزبون أو Customer ID</label>
            <input 
              type="text" 
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="مثال: 25" 
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all text-left" 
              dir="ltr" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">رمز الدخول PIN</label>
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••" 
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
`);

// 2. CustomerHomeScreen.tsx
fs.writeFileSync('src/customer_portal/home/screens/CustomerHomeScreen.tsx', `
import React from 'react';
import { LogOut, Store, CreditCard, ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import { Card } from '../../../shared/components/Card';

interface Props {
  onLogout: () => void;
}

export function CustomerHomeScreen({ onLogout }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]" dir="rtl">
      <div className="bg-teal-600 px-5 pt-8 pb-12 shadow-sm relative overflow-hidden">
        {/* Decorative BG Elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-900 opacity-20 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-xl font-bold text-white">حسابي</h1>
            <p className="text-teal-100 text-sm mt-1 flex items-center gap-1">
              <Store size={14} /> متجر باسم
            </p>
          </div>
          <button 
            onClick={onLogout}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-20 space-y-4 pb-10">
        
        {/* Main Balance Card */}
        <Card className="border-none shadow-xl shadow-teal-900/5 bg-white relative overflow-hidden !p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
              <CreditCard size={20} />
            </div>
            <p className="text-sm font-bold text-gray-500">المبلغ المتبقي</p>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mt-2">75,000 <span className="text-lg text-gray-500 font-bold">د.ع</span></h2>
          
          <button className="w-full mt-6 bg-teal-50 text-teal-700 font-bold py-3 rounded-xl hover:bg-teal-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <History size={18} /> عرض تفاصيل الحساب
          </button>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-md shadow-gray-200/40 !p-4 bg-white">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
              <ArrowUpRight size={18} />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">إجمالي الأخذ</p>
            <p className="text-lg font-bold text-gray-900">125,000 <span className="text-xs text-gray-500">د.ع</span></p>
          </Card>
          
          <Card className="border-none shadow-md shadow-gray-200/40 !p-4 bg-white">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3">
              <ArrowDownRight size={18} />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">إجمالي التسديد</p>
            <p className="text-lg font-bold text-gray-900">50,000 <span className="text-xs text-gray-500">د.ع</span></p>
          </Card>
        </div>

      </div>
    </div>
  );
}
`);

// 3. CustomerNavigator.tsx
fs.writeFileSync('src/navigation/customer_navigation/CustomerNavigator.tsx', `
import React from 'react';
import { CustomerHomeScreen } from '../../customer_portal/home/screens/CustomerHomeScreen';
import { clearCustomerSession } from '../../shared/storage/session';

export function CustomerNavigator() {
  const handleLogout = () => {
    clearCustomerSession();
    window.location.reload();
  };

  return (
    <CustomerHomeScreen onLogout={handleLogout} />
  );
}
`);

console.log('Customer portal updated.');
