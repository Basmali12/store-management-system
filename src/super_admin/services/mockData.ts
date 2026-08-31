import { AdminMerchant, MerchantFeatureFlags } from '../models/types';
import { getMerchantAccounts } from '../../shared/auth/merchantAccounts';
import { tenantGetItem, tenantSetItem } from '../../shared/storage/tenantStorage';

export const defaultFeatures: MerchantFeatureFlags = {
  customerPortalEnabled: true, cloudSyncEnabled: false, advancedReportsEnabled: true,
  whatsappEnabled: true, inventoryEnabled: true, suppliersEnabled: true,
  purchasesEnabled: true, expensesEnabled: true, overdueEnabled: true,
};

const getSubscription = (merchantId: string, createdAt: string) => {
  const stored = tenantGetItem('merchant_subscription', merchantId);
  if (stored) return JSON.parse(stored);
  const start = new Date(createdAt);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const data = { trialStartedAt: start.toISOString(), trialEndsAt: end.toISOString(), subscriptionStatus: new Date() > end ? 'EXPIRED' : 'TRIAL', subscriptionExpiresAt: null };
  tenantSetItem('merchant_subscription', JSON.stringify(data), merchantId);
  return data;
};

export const getAdminMerchants = (): AdminMerchant[] => getMerchantAccounts().map(account => {
  const subscription = getSubscription(account.id, account.createdAt);
  const featureStored = tenantGetItem('merchant_feature_flags', account.id);
  return {
    id: account.id,
    merchantName: account.ownerName || account.merchantName || '',
    storeName: account.storeName,
    phone: account.phone,
    status: subscription.subscriptionStatus,
    createdAt: account.createdAt,
    trialStartedAt: subscription.trialStartedAt,
    trialEndsAt: subscription.trialEndsAt,
    subscriptionExpiresAt: subscription.subscriptionExpiresAt,
    lastLogin: account.createdAt,
    linkedDevicesCount: 1,
    lastSync: account.createdAt,
    features: featureStored ? JSON.parse(featureStored) : { ...defaultFeatures }
  };
});

export const saveAdminMerchants = (_merchants: AdminMerchant[]) => {};
export const getAdminMerchant = (id: string) => getAdminMerchants().find(merchant => merchant.id === id);

export const updateAdminMerchant = (id: string, updates: Partial<AdminMerchant>) => {
  const current = getAdminMerchant(id);
  if (!current) return;
  if (updates.features) tenantSetItem('merchant_feature_flags', JSON.stringify(updates.features), id);
  if (updates.status || updates.trialStartedAt || updates.trialEndsAt || updates.subscriptionExpiresAt !== undefined) {
    const subscription = getSubscription(id, current.createdAt);
    tenantSetItem('merchant_subscription', JSON.stringify({
      ...subscription,
      ...(updates.status ? { subscriptionStatus: updates.status } : {}),
      ...(updates.trialStartedAt ? { trialStartedAt: updates.trialStartedAt } : {}),
      ...(updates.trialEndsAt ? { trialEndsAt: updates.trialEndsAt } : {}),
      ...(updates.subscriptionExpiresAt !== undefined ? { subscriptionExpiresAt: updates.subscriptionExpiresAt } : {})
    }), id);
  }
};

export const getAdminStats = () => {
  const merchants = getAdminMerchants();
  return {
    total: merchants.length,
    trial: merchants.filter(merchant => merchant.status === 'TRIAL').length,
    active: merchants.filter(merchant => merchant.status === 'ACTIVE').length,
    expired: merchants.filter(merchant => merchant.status === 'EXPIRED').length,
    suspended: merchants.filter(merchant => merchant.status === 'SUSPENDED').length
  };
};
