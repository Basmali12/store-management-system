import { getMerchantSession } from './session';
import { queueStoreRemove, queueStoreSet } from '../convex/tenantSyncBridge';

export const TENANT_DATA_KEYS = [
  'merchant_customers', 'merchant_debts', 'merchant_payments',
  'merchant_suppliers_new', 'merchant_supplier_payments', 'merchant_products', 'merchant_stock_movements',
  'merchant_sales', 'merchant_purchases', 'merchant_expenses',
  'merchant_product_field_settings', 'merchant_activity_log'
] as const;

export const tenantStorageKey = (key: string, merchantId?: string) => {
  const owner = merchantId || getMerchantSession();
  if (!owner) throw new Error('لا توجد جلسة تاجر فعالة');
  return `merchant:${owner}:${key}`;
};

export const tenantGetItem = (key: string, merchantId?: string) =>
  localStorage.getItem(tenantStorageKey(key, merchantId));

export const tenantSetItem = (key: string, value: string, merchantId?: string) => {
  localStorage.setItem(tenantStorageKey(key, merchantId), value);
  queueStoreSet(key, value);
};

export const tenantRemoveItem = (key: string, merchantId?: string) => {
  localStorage.removeItem(tenantStorageKey(key, merchantId));
  queueStoreRemove(key);
};

export const migrateLegacyDataToMerchant = (merchantId: string) => {
  const ownerKey = 'legacy_data_owner';
  const claimedBy = localStorage.getItem(ownerKey);
  if (claimedBy && claimedBy !== merchantId) return;

  let migrated = false;
  for (const key of TENANT_DATA_KEYS) {
    const legacyValue = localStorage.getItem(key);
    const scopedKey = tenantStorageKey(key, merchantId);
    if (legacyValue !== null && localStorage.getItem(scopedKey) === null) {
      localStorage.setItem(scopedKey, legacyValue);
      migrated = true;
    }
  }
  if (migrated || !claimedBy) localStorage.setItem(ownerKey, merchantId);
};

export const exportTenantData = (merchantId?: string) => {
  const owner = merchantId || getMerchantSession();
  if (!owner) throw new Error('لا توجد جلسة تاجر فعالة');
  const data: Record<string, unknown> = {};
  for (const key of TENANT_DATA_KEYS) {
    const value = tenantGetItem(key, owner);
    if (value !== null) data[key] = JSON.parse(value);
  }
  return { version: 2, merchantId: owner, exportedAt: new Date().toISOString(), data };
};

export const restoreTenantData = (backup: unknown, merchantId?: string) => {
  const owner = merchantId || getMerchantSession();
  if (!owner) throw new Error('لا توجد جلسة تاجر فعالة');
  if (!backup || typeof backup !== 'object' || !('data' in backup)) {
    throw new Error('ملف النسخة الاحتياطية غير صالح');
  }
  const data = (backup as { data: Record<string, unknown> }).data;
  for (const key of TENANT_DATA_KEYS) {
    if (key in data) tenantSetItem(key, JSON.stringify(data[key]), owner);
  }
};

export const snapshotTenantKeys = (keys: string[]) => {
  const snapshot = new Map<string, string | null>();
  for (const key of keys) snapshot.set(key, tenantGetItem(key));
  return () => {
    for (const [key, value] of snapshot) {
      if (value === null) tenantRemoveItem(key);
      else tenantSetItem(key, value);
    }
  };
};
