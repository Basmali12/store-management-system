import { tenantGetItem, tenantSetItem } from '../storage/tenantStorage';

export const DEFAULT_APP_VERSION = '1.0.0';
export const APP_VERSION_STORAGE_KEY = 'merchant_app_version';
export const APPLIED_APP_VERSION_KEY = 'app_applied_version';
export const APP_VERSION_CHANGED_EVENT = 'app_version_changed';

export const isValidAppVersion = (value: string) => /^\d+(?:\.\d+){0,2}$/.test(value.trim());

export const getConfiguredAppVersion = () => {
  try {
    const stored = tenantGetItem(APP_VERSION_STORAGE_KEY);
    if (!stored) return DEFAULT_APP_VERSION;
    const parsed = JSON.parse(stored) as unknown;
    return typeof parsed === 'string' && isValidAppVersion(parsed) ? parsed : DEFAULT_APP_VERSION;
  } catch {
    return DEFAULT_APP_VERSION;
  }
};

export const saveConfiguredAppVersion = (version: string) => {
  const normalized = version.trim();
  if (!isValidAppVersion(normalized)) {
    throw new Error('رقم الإصدار يجب أن يكون مثل 1.0.0');
  }
  tenantSetItem(APP_VERSION_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(APP_VERSION_CHANGED_EVENT, { detail: normalized }));
  return normalized;
};

export const getAppliedAppVersion = () => localStorage.getItem(APPLIED_APP_VERSION_KEY);

export const markAppVersionApplied = (version: string) => {
  localStorage.setItem(APPLIED_APP_VERSION_KEY, version);
};

export const hasNewAppVersion = (available: string | null | undefined, applied: string | null) =>
  Boolean(available && isValidAppVersion(available) && applied && available !== applied);
