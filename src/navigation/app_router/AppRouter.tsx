
import React, { useEffect, useState } from 'react';
import { MerchantNavigator } from '../merchant_navigation/MerchantNavigator';
import { SuperAdminNavigator } from '../../super_admin/navigation/SuperAdminNavigator';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import { MerchantLoginScreen } from '../../merchant/auth/login/screens/MerchantLoginScreen';
import { MerchantRegisterScreen } from '../../merchant/auth/register/screens/MerchantRegisterScreen';
import { CustomerLoginScreen } from '../../customer_portal/login/screens/CustomerLoginScreen';
import { CustomerNavigator } from '../customer_navigation/CustomerNavigator';
import { getMerchantSession, setMerchantSession, getCustomerSession, setCustomerSession } from '../../shared/storage/session';
import { migrateLegacyDataToMerchant } from '../../shared/storage/tenantStorage';
import { AdminLoginScreen } from '../../super_admin/auth/AdminLoginScreen';
import { hardenLegacyCustomerAccounts } from '../../shared/auth/merchantAccounts';

export function AppRouter() {
  const [path, setPath] = useState(window.location.pathname);
  const [merchantSession, setMerchantSessionState] = useState(getMerchantSession());
  const [customerSession, setCustomerSessionState] = useState(getCustomerSession());
  const [adminSession, setAdminSession] = useState(sessionStorage.getItem('adminSession'));

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
    return adminSession ? <SuperAdminNavigator /> : <AdminLoginScreen onLogin={() => setAdminSession('active')} />;
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
      onLogin={async (merchantId) => { migrateLegacyDataToMerchant(merchantId); await hardenLegacyCustomerAccounts(merchantId); setMerchantSession(merchantId); setMerchantSessionState(merchantId); navigate('/'); }} 
      onBack={() => navigate('/')} 
      onGoToRegister={() => navigate('/merchant/register')}
    />;
  }

  if (path === '/merchant/register') {
    return <MerchantRegisterScreen 
      onRegister={(merchantId) => { setMerchantSession(merchantId); setMerchantSessionState(merchantId); navigate('/'); }} 
      onBack={() => navigate('/merchant/login')} 
    />;
  }

  if (path === '/customer/login') {
    return <CustomerLoginScreen 
      onLogin={(session) => { setCustomerSession(session); setCustomerSessionState(session); navigate('/'); }} 
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
