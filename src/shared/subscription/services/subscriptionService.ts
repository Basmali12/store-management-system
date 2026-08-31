import { tenantGetItem, tenantSetItem } from '../../storage/tenantStorage';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';

export interface SubscriptionData {
  trialStartedAt: string;
  trialEndsAt: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt: string | null;
}

const STORAGE_KEY = 'merchant_subscription';

export const getSubscriptionData = (): SubscriptionData => {
  const local = tenantGetItem(STORAGE_KEY);
  if (local) {
    const data = JSON.parse(local);
    return checkAndUpdateStatus(data);
  }
  
  // Initialize new 7-day trial
  const now = new Date();
  const trialEnds = new Date();
  trialEnds.setDate(now.getDate() + 7);
  
  const newData: SubscriptionData = {
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEnds.toISOString(),
    subscriptionStatus: 'TRIAL',
    subscriptionExpiresAt: null
  };
  
  tenantSetItem(STORAGE_KEY, JSON.stringify(newData));
  return newData;
};

const checkAndUpdateStatus = (data: SubscriptionData): SubscriptionData => {
  const now = new Date();
  let changed = false;
  
  if (data.subscriptionStatus === 'TRIAL') {
    if (now > new Date(data.trialEndsAt)) {
      data.subscriptionStatus = 'EXPIRED';
      changed = true;
    }
  } else if (data.subscriptionStatus === 'ACTIVE' && data.subscriptionExpiresAt) {
    if (now > new Date(data.subscriptionExpiresAt)) {
      data.subscriptionStatus = 'EXPIRED';
      changed = true;
    }
  }
  
  if (changed) {
    tenantSetItem(STORAGE_KEY, JSON.stringify(data));
  }
  return data;
};

export const activateSubscription = () => {
  const data = getSubscriptionData();
  const now = new Date();
  const expires = new Date();
  expires.setMonth(now.getMonth() + 3); // 3 months subscription
  
  data.subscriptionStatus = 'ACTIVE';
  data.subscriptionExpiresAt = expires.toISOString();
  
  tenantSetItem(STORAGE_KEY, JSON.stringify(data));
  return data;
};

export const getDaysRemaining = (dateString: string): number => {
  const now = new Date();
  const end = new Date(dateString);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};
