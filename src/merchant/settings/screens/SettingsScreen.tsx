import React, { useState, useEffect } from 'react';
import { ChevronRight, Moon, Sun, Monitor, User, Store, Shield, Download, Upload, LogOut, Check, AlertCircle } from 'lucide-react';
import { clearMerchantSession } from '../../../shared/storage/session';
import { getMerchantSession } from '../../../shared/storage/session';
import { getMerchantAccount, updateMerchantAccount } from '../../../shared/auth/merchantAccounts';
import { changeOfficialMerchantPassword, signOutOfficialMerchant } from '../../../shared/auth/serverAuth';
import { exportTenantData, restoreTenantData } from '../../../shared/storage/tenantStorage';
import { todayLocalDateKey } from '../../../shared/utils/date';
import { addAuditEntry } from '../../../shared/audit/auditService';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [theme, setTheme] = useState('system');
  const [merchantName, setMerchantName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [accountSuccess, setAccountSuccess] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoreSuccess, setRestoreSuccess] = useState('');

  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('app_theme') || 'system';
    setTheme(savedTheme);

    // Load user data
    const account = getMerchantAccount(getMerchantSession() || '');
    if (account) {
      setMerchantName(account.ownerName || account.merchantName || '');
      setStoreName(account.storeName || '');
      setPhone(account.phone || '');
    }
  }, []);

  const handleThemeChange = (t: string) => {
    setTheme(t);
    localStorage.setItem('app_theme', t);
    
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSaveAccount = () => {
    const merchantId = getMerchantSession();
    if (merchantId) {
      updateMerchantAccount(merchantId, { ownerName: merchantName, merchantName, storeName });
      setAccountSuccess('تم حفظ المعلومات بنجاح');
      setTimeout(() => setAccountSuccess(''), 3000);
      window.dispatchEvent(new Event('merchant_data_updated'));
    }
  };

  const handleSavePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمة السر الجديدة غير متطابقة');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('كلمة السر يجب أن تكون 8 أحرف/أرقام على الأقل');
      return;
    }
    const merchantId = getMerchantSession();
    if (merchantId) {
      try {
        await changeOfficialMerchantPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('تم تغيير كلمة السر بنجاح');
      setTimeout(() => setPasswordSuccess(''), 3000);
      } catch (error) {
        setPasswordError(error instanceof Error ? error.message : 'تعذر تغيير كلمة السر');
      }
    }
  };

  const handleBackup = () => {
    const backupData = exportTenantData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_${todayLocalDateKey()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError('');
    setRestoreSuccess('');
    
    const file = e.target.files?.[0];
    if (!file) return;

    if (window.confirm('تحذير: استعادة النسخة الاحتياطية ستمسح بياناتك الحالية. هل أنت متأكد؟')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          restoreTenantData(json);
          addAuditEntry({ action: 'RESTORE', entity: 'BACKUP', description: 'استعادة نسخة احتياطية' });
          
          setRestoreSuccess('تمت استعادة النسخة الاحتياطية بنجاح');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
        } catch (err) {
          setRestoreError('خطأ: الملف غير صالح أو تالف');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLogout = () => {
    void signOutOfficialMerchant().finally(() => {
      clearMerchantSession();
      window.location.reload();
    });
  };

  return (
    <div className="h-full flex flex-col font-[Cairo] bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 z-20 sticky top-0">
        <button onClick={onBack} className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
          <ChevronRight size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Appearance */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 px-1 flex items-center gap-2">
            المظهر
          </h2>
          <div className="flex bg-gray-50 dark:bg-gray-700 p-1 rounded-xl">
            <button onClick={() => handleThemeChange('light')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 transition-all ${theme === 'light' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              <Sun size={18} />
              نهاري
            </button>
            <button onClick={() => handleThemeChange('dark')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 transition-all ${theme === 'dark' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              <Moon size={18} />
              ليلي
            </button>
            <button onClick={() => handleThemeChange('system')} className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex flex-col items-center gap-1 transition-all ${theme === 'system' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
              <Monitor size={18} />
              النظام
            </button>
          </div>
        </section>

        {/* Account Info */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 px-1 flex items-center gap-2">
            <User size={18} />
            معلومات الحساب
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">اسم صاحب المحل</label>
              <input type="text" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">اسم المحل</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">رقم الهاتف / ID</label>
              <input type="text" value={phone} disabled className="w-full bg-gray-100 dark:bg-gray-600 text-gray-400 border border-gray-200 dark:border-gray-500 rounded-xl px-4 py-3 text-sm cursor-not-allowed" />
            </div>
            {accountSuccess && <p className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={14}/> {accountSuccess}</p>}
            <button onClick={handleSaveAccount} className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold py-3 rounded-xl hover:bg-indigo-100 transition-colors">
              حفظ المعلومات
            </button>
          </div>
        </section>

        {/* Change Password */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 px-1 flex items-center gap-2">
            <Shield size={18} />
            تغيير كلمة السر
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">كلمة السر الحالية</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">كلمة السر الجديدة</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">تأكيد كلمة السر الجديدة</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {passwordError && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={14}/> {passwordError}</p>}
            {passwordSuccess && <p className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={14}/> {passwordSuccess}</p>}
            <button onClick={handleSavePassword} className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold py-3 rounded-xl hover:bg-indigo-100 transition-colors">
              تغيير كلمة السر
            </button>
          </div>
        </section>

        {/* Backup / Restore */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 px-1 flex items-center gap-2">
            النسخ الاحتياطي
          </h2>
          <div className="space-y-3">
            <button onClick={handleBackup} className="w-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors">
              <Download size={20} />
              تحميل نسخة احتياطية
            </button>
            <div className="relative">
              <input type="file" accept=".json" onChange={handleRestore} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <button className="w-full bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors pointer-events-none">
                <Upload size={20} />
                استعادة نسخة احتياطية
              </button>
            </div>
            {restoreError && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><AlertCircle size={14}/> {restoreError}</p>}
            {restoreSuccess && <p className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={14}/> {restoreSuccess}</p>}
          </div>
        </section>

        {/* Logout */}
        <section className="pt-4 pb-8">
          <button onClick={handleLogout} className="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </section>
        
      </div>
    </div>
  );
}
