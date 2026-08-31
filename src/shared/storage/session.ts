
export const getMerchantSession = () => {
  const value = localStorage.getItem('merchantSession');
  if (value !== 'active') return value;
  const accounts = JSON.parse(localStorage.getItem('merchant_accounts') || localStorage.getItem('mock_merchants') || '[]');
  const migratedId = accounts[0]?.id || accounts[0]?.merchantId || null;
  if (migratedId) localStorage.setItem('merchantSession', migratedId);
  return migratedId;
};
export const setMerchantSession = (merchantId: string) => localStorage.setItem('merchantSession', merchantId);
export const clearMerchantSession = () => localStorage.removeItem('merchantSession');

export interface CustomerSession { merchantId: string; customerId: string; }

export const getCustomerSession = (): CustomerSession | null => {
  const stored = localStorage.getItem('customerSession');
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return parsed?.merchantId && parsed?.customerId ? parsed : null;
  } catch {
    return null;
  }
};
export const setCustomerSession = (session: CustomerSession) => localStorage.setItem('customerSession', JSON.stringify(session));
export const clearCustomerSession = () => localStorage.removeItem('customerSession');
