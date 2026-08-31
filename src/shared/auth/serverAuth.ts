import { authClient, isServerAuthConfigured } from '../convex/authClient';
import { ensureOfficialMerchantAccount, getMerchantAccounts } from './merchantAccounts';

export const authenticateOfficialMerchant = async (login: string, password: string) => {
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
  const result = await authClient.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });
  if (result.error) throw new Error('كلمة السر الحالية غير صحيحة أو تعذر تحديثها');
};

export const signOutOfficialMerchant = async () => {
  await authClient.signOut();
};
