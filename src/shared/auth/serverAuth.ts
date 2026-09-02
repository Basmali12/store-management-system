import { authClient, isServerAuthConfigured } from '../convex/authClient';
import {
  authenticateLocalOfficialMerchant,
  changeMerchantPassword,
  ensureOfficialMerchantAccount,
  getMerchantAccounts,
  OFFICIAL_MERCHANT_PHONE,
} from './merchantAccounts';
import { isConvexDataEnabled } from '../config/dataMode';

export const authenticateOfficialMerchant = async (login: string, password: string) => {
  if (!isConvexDataEnabled) return authenticateLocalOfficialMerchant(password);
  if (!isServerAuthConfigured) throw new Error('اتصال الخادم غير مضبوط');
  const result = await authClient.signIn.username({
    username: login,
    password,
    rememberMe: true,
  });
  if (result.error) return null;
  ensureOfficialMerchantAccount();
  return getMerchantAccounts().find(account => account.phone === login) || null;
};

export const changeOfficialMerchantPassword = async (currentPassword: string, newPassword: string) => {
  if (!isConvexDataEnabled) {
    const account = getMerchantAccounts().find(item => item.phone === OFFICIAL_MERCHANT_PHONE) || getMerchantAccounts()[0];
    if (!account) throw new Error('الحساب غير موجود');
    await changeMerchantPassword(account.id, currentPassword, newPassword);
    return;
  }
  const result = await authClient.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });
  if (result.error) throw new Error('كلمة السر الحالية غير صحيحة أو تعذر تحديثها');
};

export const signOutOfficialMerchant = async () => {
  if (!isConvexDataEnabled) return;
  await authClient.signOut();
};
