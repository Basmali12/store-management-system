import React, { useState, useEffect } from 'react';
import { Bell, Settings, X, Calendar, AlertTriangle } from 'lucide-react';
import { getOverdueStats, getOverdueCustomers, OverdueCustomer } from '../overdue/services/overdueService';
import { formatCurrency } from '../../data/mock/merchant/mockData';
import { getMerchantSession } from '../../shared/storage/session';
import { getMerchantAccount } from '../../shared/auth/merchantAccounts';
import { tenantGetItem } from '../../shared/storage/tenantStorage';
import { todayLocalDateKey } from '../../shared/utils/date';

interface TopBarProps {
  onSettingsClick?: () => void;
  onNavigateToCustomerOverdue?: (customerId: string) => void;
}

export function TopBar({ onSettingsClick, onNavigateToCustomerOverdue }: TopBarProps) {
  const [storeName, setStoreName] = useState('المتجر');
  const [todayActivity, setTodayActivity] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [overdueCustomers, setOverdueCustomers] = useState<OverdueCustomer[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const refreshData = () => {
    // 1. Get Store Name
    const merchantId = getMerchantSession();
    setStoreName(merchantId ? getMerchantAccount(merchantId)?.storeName || 'المتجر' : 'المتجر');

    // 2. Calculate Today's Activity
    const today = todayLocalDateKey();
    let total = 0;
    const localPayments = JSON.parse(tenantGetItem('merchant_payments') || '{}');
    Object.values(localPayments).forEach((customerPayments: any) => {
      customerPayments.forEach((p: any) => {
        if (p.createdAt === today) total += p.amount;
      });
    });
    const localDebts = JSON.parse(tenantGetItem('merchant_debts') || '{}');
    Object.values(localDebts).forEach((customerDebts: any) => {
      customerDebts.forEach((d: any) => {
        if (d.createdAt === today) total += d.amount;
      });
    });
    setTodayActivity(total);

    // 3. Get Overdue Stats
    const stats = getOverdueStats();
    setOverdueCount(stats.lateCustomersCount);
    
    // We fetch details only if opened to save memory, but since we need it fast, we can fetch it when opening.
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('merchant_data_updated', refreshData);
    return () => window.removeEventListener('merchant_data_updated', refreshData);
  }, []);

  const handleNotificationsClick = () => {
    setOverdueCustomers(getOverdueCustomers());
    setIsNotificationsOpen(true);
  };

  const handleCustomerClick = (customerId: string) => {
    setIsNotificationsOpen(false);
    if (onNavigateToCustomerOverdue) {
      onNavigateToCustomerOverdue(customerId);
    }
  };

  return (
    <>
      <div className="bg-indigo-700 dark:bg-gray-900 px-6 pt-10 pb-12 text-white sticky top-0 z-10 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-indigo-100 dark:text-gray-400 text-xs">مرحبًا بك</p>
            <h1 className="text-xl font-bold mt-1">{storeName}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleNotificationsClick} className="relative p-2 bg-white/20 dark:bg-gray-800 rounded-full text-white hover:bg-white/30 dark:hover:bg-gray-700 transition-colors">
              <Bell size={20} />
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-indigo-700 dark:border-gray-900">
                  {overdueCount > 9 ? '9+' : overdueCount}
                </span>
              )}
            </button>
            <button onClick={onSettingsClick} className="p-2 bg-white/20 dark:bg-gray-800 rounded-full text-white hover:bg-white/30 dark:hover:bg-gray-700 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
        <p className="text-indigo-200 dark:text-gray-400 text-xs">
          اليوم: إجمالي حركة المحل ({new Intl.NumberFormat('ar-IQ').format(todayActivity)} د.ع)
        </p>
      </div>

      {/* Notifications Bottom Sheet / Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsNotificationsOpen(false)} />
          <div className="bg-gray-50 dark:bg-gray-900 w-full h-[80vh] rounded-t-3xl relative flex flex-col font-[Cairo] animate-in slide-in-from-bottom">
            <div className="flex justify-center p-3">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            
            <div className="px-5 pb-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                الزبائن المتأخرون
              </h2>
              <button onClick={() => setIsNotificationsOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {overdueCustomers.length > 0 ? (
                overdueCustomers.map((c, idx) => (
                  <div key={idx} onClick={() => handleCustomerClick(c.customer.id)} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-red-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{c.customer.name}</p>
                      <p className="text-xs text-red-600 font-bold mt-1">متأخر: {c.maxDaysOverdue} أيام</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={10} />
                        أقدم استحقاق: {new Date(c.oldestDueDate).toLocaleDateString('ar-IQ')}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-black text-red-600 dark:text-red-400 text-sm">{formatCurrency(c.totalOverdueAmount)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500">
                  <Bell size={32} className="mb-2 opacity-50" />
                  <p>لا يوجد متأخرون حالياً</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
