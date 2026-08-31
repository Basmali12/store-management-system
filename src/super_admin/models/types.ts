export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export interface MerchantFeatureFlags {
  customerPortalEnabled: boolean;
  cloudSyncEnabled: boolean;
  advancedReportsEnabled: boolean;
  whatsappEnabled: boolean;
  inventoryEnabled: boolean;
  suppliersEnabled: boolean;
  purchasesEnabled: boolean;
  expensesEnabled: boolean;
  overdueEnabled: boolean;
}

export interface AdminMerchant {
  id: string;
  merchantName: string;
  storeName: string;
  phone: string;
  status: SubscriptionStatus;
  createdAt: string;
  trialStartedAt: string;
  trialEndsAt: string;
  subscriptionExpiresAt: string | null;
  lastLogin: string;
  linkedDevicesCount: number;
  lastSync: string;
  features: MerchantFeatureFlags;
}
