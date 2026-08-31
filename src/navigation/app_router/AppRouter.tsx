
import React, { useState } from 'react';
import { MerchantNavigator } from '../merchant_navigation/MerchantNavigator';
import { MerchantLoginScreen } from '../../merchant/auth/login/screens/MerchantLoginScreen';
import { CustomerLoginScreen } from '../../customer_portal/login/screens/CustomerLoginScreen';
import { CustomerHomeScreen } from '../../customer_portal/home/screens/CustomerHomeScreen';
import { RoleSelectionScreen } from './screens/RoleSelectionScreen';
import {
  clearCustomerSession,
  getCustomerSession,
  getMerchantSession,
  setCustomerSession,
  setMerchantSession,
} from '../../shared/storage/session';
import { migrateLegacyDataToMerchant } from '../../shared/storage/tenantStorage';
import { removeLegacyCustomerCredentials } from '../../shared/auth/merchantAccounts';

type PublicView = 'roles' | 'merchant' | 'customer';

export function AppRouter() {
  const [merchantSession, setMerchantSessionState] = useState(getMerchantSession());
  const [customerSession, setCustomerSessionState] = useState(getCustomerSession());
  const [publicView, setPublicView] = useState<PublicView>('roles');

  if (merchantSession) {
    return <MerchantNavigator />;
  }

  if (customerSession) {
    return (
      <CustomerHomeScreen
        merchantId={customerSession.merchantId}
        customerId={customerSession.customerId}
        onLogout={() => {
          clearCustomerSession();
          setCustomerSessionState(null);
          setPublicView('roles');
        }}
      />
    );
  }

  if (publicView === 'merchant') {
    return (
      <MerchantLoginScreen
        onBack={() => setPublicView('roles')}
        onLogin={(merchantId) => {
          migrateLegacyDataToMerchant(merchantId);
          removeLegacyCustomerCredentials(merchantId);
          setMerchantSession(merchantId);
          setMerchantSessionState(merchantId);
        }}
      />
    );
  }

  if (publicView === 'customer') {
    return (
      <CustomerLoginScreen
        onBack={() => setPublicView('roles')}
        onLogin={(session) => {
          setCustomerSession(session);
          setCustomerSessionState(session);
        }}
      />
    );
  }

  return (
    <RoleSelectionScreen
      onSelectMerchant={() => setPublicView('merchant')}
      onSelectCustomer={() => setPublicView('customer')}
    />
  );
}
