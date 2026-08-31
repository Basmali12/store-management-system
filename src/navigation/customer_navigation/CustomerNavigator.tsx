
import React from 'react';
import { CustomerHomeScreen } from '../../customer_portal/home/screens/CustomerHomeScreen';
import { clearCustomerSession, getCustomerSession } from '../../shared/storage/session';

export function CustomerNavigator() {
  const session = getCustomerSession();
  
  const handleLogout = () => {
    clearCustomerSession();
    window.location.reload();
  };

  if (!session) return null;

  return (
    <CustomerHomeScreen customerId={session.customerId} merchantId={session.merchantId} onLogout={handleLogout} />
  );
}
