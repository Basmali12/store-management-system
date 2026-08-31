const fs = require('fs');

fs.mkdirSync('src/merchant/auth/login/screens', { recursive: true });
fs.mkdirSync('src/merchant/auth/register/screens', { recursive: true });

// 1. session.ts
fs.writeFileSync('src/shared/storage/session.ts', `
export const getMerchantSession = () => localStorage.getItem('merchantSession');
export const setMerchantSession = () => localStorage.setItem('merchantSession', 'active');
export const clearMerchantSession = () => localStorage.removeItem('merchantSession');

export const getCustomerSession = () => localStorage.getItem('customerSession');
export const setCustomerSession = () => localStorage.setItem('customerSession', 'active');
export const clearCustomerSession = () => localStorage.removeItem('customerSession');
`);

// 2. MerchantLoginScreen.tsx
fs.writeFileSync('src/merchant/auth/login/screens/MerchantLoginScreen.tsx', `
import React, { useState } from 'react';
import { ChevronRight, Store } from 'lucide-react';

interface Props {
  onLogin: () => void;
  onBack: () => void;
  onGoToRegister: () => void;
}

export function MerchantLoginScreen({ onLogin, onBack, onGoToRegister }: Props) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check mock registered users
    const localUsers = JSON.parse(localStorage.getItem('mock_merchants') || '[]');
    const isValidLocal = localUsers.find((u: any) => (u.phone === id || u.id === id) && u.password === password);
    
    // Accept hardcoded 1001/1234 OR locally registered users
    if ((id === '1001' && password === '1234') || isValidLocal) {
      setError('');
      onLogin();
    } else {
      setError('رقم الهاتف/ID أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]" dir="rtl">
      <div className="p-4">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-600 hover:bg-gray-100 transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="flex-1 flex flex-col justify-center p-6 max-w-md w-full mx-auto -mt-10">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
          <Store size={40} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول للمحل</h1>
        <p className="text-sm text-gray-500 mb-8">أدخل رقم الهاتف أو ID وكلمة المرور للمتابعة</p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">رقم الهاتف أو ID</label>
            <input 
              type="text" 
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="مثال: 1001 أو 07XXXXXXXX" 
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" 
              dir="ltr" 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">كلمة المرور</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl p-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-left" 
              dir="ltr" 
              required 
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-4 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200">
            تسجيل الدخول
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">ليس لديك حساب؟</p>
          <button onClick={onGoToRegister} className="text-indigo-600 font-bold mt-2 hover:underline">
            إنشاء حساب محل جديد
          </button>
        </div>
      </div>
    </div>
  );
}
`);

// 3. MerchantRegisterScreen.tsx
fs.writeFileSync('src/merchant/auth/register/screens/MerchantRegisterScreen.tsx', `
import React, { useState } from 'react';
import { ChevronRight, StorePlus } from 'lucide-react';

interface Props {
  onRegister: () => void;
  onBack: () => void;
}

export function MerchantRegisterScreen({ onRegister, onBack }: Props) {
  const [ownerName, setOwnerName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    
    // Mock local saving
    const localUsers = JSON.parse(localStorage.getItem('mock_merchants') || '[]');
    const exists = localUsers.find((u: any) => u.phone === phone);
    if (exists) {
      setError('رقم الهاتف مسجل مسبقاً');
      return;
    }

    localUsers.push({
      id: Date.now().toString(),
      ownerName,
      storeName,
      phone,
      password
    });
    localStorage.setItem('mock_merchants', JSON.stringify(localUsers));
    
    onRegister();
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
          <StorePlus size={32} />
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
`);

// 4. AppRouter.tsx
fs.writeFileSync('src/navigation/app_router/AppRouter.tsx', `
import React, { useEffect, useState } from 'react';
import { MerchantNavigator } from '../merchant_navigation/MerchantNavigator';
import { AdminDashboardScreen } from '../../super_admin/dashboard/screens/AdminDashboardScreen';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import { MerchantLoginScreen } from '../../merchant/auth/login/screens/MerchantLoginScreen';
import { MerchantRegisterScreen } from '../../merchant/auth/register/screens/MerchantRegisterScreen';
import { CustomerLoginScreen } from '../../customer_portal/login/screens/CustomerLoginScreen';
import { CustomerNavigator } from '../customer_navigation/CustomerNavigator';
import { getMerchantSession, setMerchantSession, getCustomerSession, setCustomerSession } from '../../shared/storage/session';

export function AppRouter() {
  const [path, setPath] = useState(window.location.pathname);
  const [merchantSession, setMerchantSessionState] = useState(getMerchantSession());
  const [customerSession, setCustomerSessionState] = useState(getCustomerSession());

  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
      setMerchantSessionState(getMerchantSession());
      setCustomerSessionState(getCustomerSession());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  // 1. Super Admin Route
  if (path === '/11') {
    return <AdminDashboardScreen />;
  }

  // 2. Merchant Session
  if (merchantSession) {
    return <MerchantNavigator />;
  }

  // 3. Customer Session
  if (customerSession) {
    return <CustomerNavigator />;
  }

  // 4. Fallbacks when NO session is present
  if (path === '/merchant/login') {
    return <MerchantLoginScreen 
      onLogin={() => { setMerchantSession(); setMerchantSessionState('active'); navigate('/'); }} 
      onBack={() => navigate('/')} 
      onGoToRegister={() => navigate('/merchant/register')}
    />;
  }

  if (path === '/merchant/register') {
    return <MerchantRegisterScreen 
      onRegister={() => { setMerchantSession(); setMerchantSessionState('active'); navigate('/'); }} 
      onBack={() => navigate('/merchant/login')} 
    />;
  }

  if (path === '/customer/login') {
    return <CustomerLoginScreen 
      onLogin={() => { setCustomerSession(); setCustomerSessionState('active'); navigate('/'); }} 
      onBack={() => navigate('/')} 
    />;
  }

  // Default: Role Selection
  return (
    <RoleSelectionScreen 
      onSelectMerchant={() => navigate('/merchant/login')} 
      onSelectCustomer={() => navigate('/customer/login')} 
    />
  );
}
`);

// 5. Update MoreScreen.tsx for correct logout
let more = fs.readFileSync('src/merchant/settings/screens/MoreScreen.tsx', 'utf8');
more = more.replace(/import \{ clearSession \} from '\.\.\/\.\.\/\.\.\/shared\/storage\/session';/g, "import { clearMerchantSession } from '../../../shared/storage/session';");
more = more.replace(/clearSession\(\);/g, "clearMerchantSession();");
fs.writeFileSync('src/merchant/settings/screens/MoreScreen.tsx', more);

// 6. Update CustomerNavigator.tsx for correct logout
let custNav = fs.readFileSync('src/navigation/customer_navigation/CustomerNavigator.tsx', 'utf8');
custNav = custNav.replace(/import \{ clearSession \} from '\.\.\/\.\.\/shared\/storage\/session';/g, "import { clearCustomerSession } from '../../shared/storage/session';");
custNav = custNav.replace(/clearSession\(\);/g, "clearCustomerSession();");
fs.writeFileSync('src/navigation/customer_navigation/CustomerNavigator.tsx', custNav);

// Cleanup old login path if it exists
if (fs.existsSync('src/merchant/auth/screens/MerchantLoginScreen.tsx')) {
  fs.rmSync('src/merchant/auth/screens', { recursive: true, force: true });
}

console.log('Merchant auth updated.');
