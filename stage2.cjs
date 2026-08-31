const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir('src/shared/storage');
ensureDir('src/navigation/app_router/screens');
ensureDir('src/merchant/auth/screens');
ensureDir('src/customer_portal/login/screens');
ensureDir('src/navigation/customer_navigation');

// 1. session.ts
fs.writeFileSync('src/shared/storage/session.ts', `
export const getSession = (): 'merchant' | 'customer' | null => {
  return localStorage.getItem('app_session') as 'merchant' | 'customer' | null;
};
export const setSession = (type: 'merchant' | 'customer') => {
  localStorage.setItem('app_session', type);
};
export const clearSession = () => {
  localStorage.removeItem('app_session');
};
`);

// 2. RoleSelectionScreen.tsx
fs.writeFileSync('src/navigation/app_router/screens/RoleSelectionScreen.tsx', `
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
`);

// 3. MerchantLoginScreen.tsx
fs.writeFileSync('src/merchant/auth/screens/MerchantLoginScreen.tsx', `
import React from 'react';
import { ChevronRight, Store } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onBack: () => void;
}

export function MerchantLoginScreen({ onLogin, onBack }: Props) {
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <div className="p-4">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-600 hover:bg-gray-100">
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center p-6 max-w-md w-full mx-auto -mt-10">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
          <Store size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول</h1>
        <p className="text-sm text-gray-500 mb-8">أهلاً بك مجدداً في نظام إدارة المحل</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">رقم الهاتف</label>
            <input type="tel" placeholder="07XX XXX XXXX" className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" required />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">كلمة المرور</label>
            <input type="password" placeholder="••••••••" className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" dir="ltr" required />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-4 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200">
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
`);

// 4. CustomerLoginScreen.tsx
fs.writeFileSync('src/customer_portal/login/screens/CustomerLoginScreen.tsx', `
import React from 'react';
import { ChevronRight, User } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onBack: () => void;
}

export function CustomerLoginScreen({ onLogin, onBack }: Props) {
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <div className="p-4">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-600 hover:bg-gray-100">
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center p-6 max-w-md w-full mx-auto -mt-10">
        <div className="w-20 h-20 bg-teal-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-teal-200">
          <User size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">بوابة الزبائن</h1>
        <p className="text-sm text-gray-500 mb-8">تابع حسابك وديونك بسهولة</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">رقم الهاتف</label>
            <input type="tel" placeholder="07XX XXX XXXX" className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all text-left" dir="ltr" required />
          </div>
          <button type="submit" className="w-full bg-teal-600 text-white font-bold rounded-xl p-4 mt-4 hover:bg-teal-700 active:scale-[0.98] transition-all shadow-md shadow-teal-200">
            طلب رمز الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
`);

// 5. CustomerNavigator.tsx
fs.writeFileSync('src/navigation/customer_navigation/CustomerNavigator.tsx', `
import React from 'react';
import { LogOut } from 'lucide-react';
import { clearSession } from '../../shared/storage/session';

export function CustomerNavigator() {
  const handleLogout = () => {
    clearSession();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <h1 className="text-2xl font-bold text-teal-700 mb-2">بوابة الزبون</h1>
      <p className="text-gray-500 text-sm mb-8">سيتم بناء واجهات الزبون في المرحلة القادمة.</p>
      
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-600 font-bold bg-red-50 px-6 py-3 rounded-xl"
      >
        <LogOut size={20} /> تسجيل خروج
      </button>
    </div>
  );
}
`);

// 6. AppRouter.tsx
fs.writeFileSync('src/navigation/app_router/AppRouter.tsx', `
import React, { useEffect, useState } from 'react';
import { MerchantNavigator } from '../merchant_navigation/MerchantNavigator';
import { AdminDashboardScreen } from '../../super_admin/dashboard/screens/AdminDashboardScreen';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import { MerchantLoginScreen } from '../../merchant/auth/screens/MerchantLoginScreen';
import { CustomerLoginScreen } from '../../customer_portal/login/screens/CustomerLoginScreen';
import { CustomerNavigator } from '../customer_navigation/CustomerNavigator';
import { getSession, setSession } from '../../shared/storage/session';

export function AppRouter() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSessionState] = useState(getSession());

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
      setSessionState(getSession());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  if (path === '/11') {
    return <AdminDashboardScreen />;
  }

  if (path === '/merchant/login') {
    return <MerchantLoginScreen 
      onLogin={() => { setSession('merchant'); setSessionState('merchant'); navigate('/'); }} 
      onBack={() => navigate('/')} 
    />;
  }

  if (path === '/customer/login') {
    return <CustomerLoginScreen 
      onLogin={() => { setSession('customer'); setSessionState('customer'); navigate('/'); }} 
      onBack={() => navigate('/')} 
    />;
  }

  if (session === 'merchant') {
    return <MerchantNavigator />;
  }

  if (session === 'customer') {
    return <CustomerNavigator />;
  }

  return (
    <RoleSelectionScreen 
      onSelectMerchant={() => navigate('/merchant/login')} 
      onSelectCustomer={() => navigate('/customer/login')} 
    />
  );
}
`);

console.log('Stage 2 completed successfully.');
