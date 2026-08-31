import { createPasswordCredential, verifyPassword } from '../security/password';
import { createId } from '../utils/id';
import { tenantGetItem, tenantSetItem } from '../storage/tenantStorage';

export interface MerchantAccount {
  id: string;
  ownerName: string;
  merchantName?: string;
  storeName: string;
  phone: string;
  passwordCredential?: string;
  password?: string;
  createdAt: string;
}

const STORAGE_KEY = 'merchant_accounts';

const normalizeLegacyAccounts = (): MerchantAccount[] => {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) return JSON.parse(current);
  const legacy = JSON.parse(localStorage.getItem('mock_merchants') || '[]');
  const normalized = legacy.map((account: any) => ({
    ...account,
    id: account.id || account.merchantId || createId('merchant'),
    ownerName: account.ownerName || account.merchantName || '',
    storeName: account.storeName || 'المتجر',
    createdAt: account.createdAt || new Date().toISOString()
  }));
  if (normalized.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  if (legacy.length) localStorage.removeItem('mock_merchants');
  return normalized;
};

export const getMerchantAccounts = (): MerchantAccount[] => normalizeLegacyAccounts();
export const saveMerchantAccounts = (accounts: MerchantAccount[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
export const getMerchantAccount = (id: string) => getMerchantAccounts().find(account => account.id === id);

export const authenticateMerchant = async (login: string, password: string): Promise<MerchantAccount | null> => {
  const accounts = getMerchantAccounts();
  const index = accounts.findIndex(account => account.phone === login || account.id === login);
  if (index < 0) return null;
  const account = accounts[index];
  const valid = account.passwordCredential ? await verifyPassword(password, account.passwordCredential) : account.password === password;
  if (!valid) return null;
  if (!account.passwordCredential) {
    account.passwordCredential = await createPasswordCredential(password);
    delete account.password;
    saveMerchantAccounts(accounts);
  }
  return account;
};

export const registerMerchant = async (input: { ownerName: string; storeName: string; phone: string; password: string }) => {
  const accounts = getMerchantAccounts();
  if (accounts.some(account => account.phone === input.phone)) throw new Error('رقم الهاتف مسجل مسبقاً');
  const account: MerchantAccount = {
    id: createId('merchant'), ownerName: input.ownerName, storeName: input.storeName,
    phone: input.phone, passwordCredential: await createPasswordCredential(input.password), createdAt: new Date().toISOString()
  };
  saveMerchantAccounts([...accounts, account]);
  return account;
};

export const updateMerchantAccount = (id: string, update: Partial<MerchantAccount>) => {
  const accounts = getMerchantAccounts();
  const index = accounts.findIndex(account => account.id === id);
  if (index < 0) throw new Error('الحساب غير موجود');
  accounts[index] = { ...accounts[index], ...update, id };
  saveMerchantAccounts(accounts);
  return accounts[index];
};

export const changeMerchantPassword = async (id: string, currentPassword: string, newPassword: string) => {
  const account = getMerchantAccount(id);
  if (!account) throw new Error('الحساب غير موجود');
  const valid = account.passwordCredential ? await verifyPassword(currentPassword, account.passwordCredential) : account.password === currentPassword;
  if (!valid) throw new Error('كلمة السر الحالية غير صحيحة');
  updateMerchantAccount(id, { passwordCredential: await createPasswordCredential(newPassword), password: undefined });
};

export const hardenLegacyMerchantAccounts = async () => {
  const accounts = getMerchantAccounts();
  let changed = false;
  for (const account of accounts) {
    if (account.password && !account.passwordCredential) {
      account.passwordCredential = await createPasswordCredential(account.password);
      delete account.password;
      changed = true;
    }
  }
  if (changed) saveMerchantAccounts(accounts);
  localStorage.removeItem('mock_merchants');
};

export const hardenLegacyCustomerAccounts = async (merchantId: string) => {
  const stored = tenantGetItem('merchant_customers', merchantId);
  if (!stored) return;
  const customers = JSON.parse(stored);
  let changed = false;
  for (const customer of customers) {
    if (customer.customerPassword && !customer.customerPasswordCredential) {
      customer.customerPasswordCredential = await createPasswordCredential(customer.customerPassword);
      delete customer.customerPassword;
      changed = true;
    }
  }
  if (changed) tenantSetItem('merchant_customers', JSON.stringify(customers), merchantId);
};
