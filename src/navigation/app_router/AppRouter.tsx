
import React, { useState } from 'react';
import { MerchantNavigator } from '../merchant_navigation/MerchantNavigator';
import { MerchantLoginScreen } from '../../merchant/auth/login/screens/MerchantLoginScreen';
import { getMerchantSession, setMerchantSession } from '../../shared/storage/session';
import { migrateLegacyDataToMerchant } from '../../shared/storage/tenantStorage';
import { hardenLegacyCustomerAccounts } from '../../shared/auth/merchantAccounts';

export function AppRouter() {
  const [merchantSession, setMerchantSessionState] = useState(getMerchantSession());

  if (merchantSession) {
    return <MerchantNavigator />;
  }

  return <MerchantLoginScreen onLogin={async (merchantId) => {
    migrateLegacyDataToMerchant(merchantId);
    await hardenLegacyCustomerAccounts(merchantId);
    setMerchantSession(merchantId);
    setMerchantSessionState(merchantId);
  }} />;
}
