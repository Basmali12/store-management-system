import React, { useState, useEffect } from 'react';
import { ArrowRight, PlayCircle, Clock, Calendar, ShieldAlert, CheckCircle, ShieldCheck } from 'lucide-react';
import { getAdminMerchant, updateAdminMerchant } from '../../services/mockData';
import { AdminMerchant, SubscriptionStatus } from '../../models/types';

interface Props {
  merchantId: string;
  onBack: () => void;
}

export function SubscriptionManagerScreen({ merchantId, onBack }: Props) {
  const [merchant, setMerchant] = useState<AdminMerchant | undefined>(undefined);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [customDays, setCustomDays] = useState('30');

  const refresh = () => setMerchant(getAdminMerchant(merchantId));

  useEffect(() => {
    refresh();
  }, [merchantId]);

  if (!merchant) return null;

  const getStatusArabic = (status: SubscriptionStatus) => {
    switch(status) {
      case 'TRIAL': return 'تجريبي';
      case 'ACTIVE': return 'فعال';
      case 'EXPIRED': return 'منتهي';
      case 'SUSPENDED': return 'موقوف';
    }
  };

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const end = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining = merchant.status === 'TRIAL' 
    ? getDaysRemaining(merchant.trialEndsAt) 
    : getDaysRemaining(merchant.subscriptionExpiresAt);

  const handleActivate3Months = () => {
    const end = new Date();
    end.setMonth(end.getMonth() + 3);
    updateAdminMerchant(merchantId, {
      status: 'ACTIVE',
      subscriptionExpiresAt: end.toISOString()
    });
    refresh();
  };

  const handleExtend3Months = () => {
    let baseDate = new Date();
    if (merchant.status === 'ACTIVE' && merchant.subscriptionExpiresAt) {
      baseDate = new Date(merchant.subscriptionExpiresAt);
    }
    baseDate.setMonth(baseDate.getMonth() + 3);
    
    updateAdminMerchant(merchantId, {
      status: 'ACTIVE',
      subscriptionExpiresAt: baseDate.toISOString()
    });
    refresh();
  };

  const handleCustomExtend = () => {
    const days = parseInt(customDays);
    if (isNaN(days) || days <= 0) return;
    
    let baseDate = new Date();
    if (merchant.status === 'ACTIVE' && merchant.subscriptionExpiresAt) {
      baseDate = new Date(merchant.subscriptionExpiresAt);
    }
    baseDate.setDate(baseDate.getDate() + days);

    updateAdminMerchant(merchantId, {
      status: 'ACTIVE',
      subscriptionExpiresAt: baseDate.toISOString()
    });
    setIsCustomDateOpen(false);
    refresh();
  };

  const handleSuspend = () => {
    if (confirm('هل أنت متأكد من إيقاف هذا الحساب؟')) {
      updateAdminMerchant(merchantId, { status: 'SUSPENDED' });
      refresh();
    }
  };

  const handleReactivate = () => {
    const now = new Date();
    let newStatus: SubscriptionStatus = 'ACTIVE';
    if (merchant.subscriptionExpiresAt && new Date(merchant.subscriptionExpiresAt) < now) {
      newStatus = 'EXPIRED';
    }
    updateAdminMerchant(merchantId, { status: newStatus });
    refresh();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-IQ');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]" dir="rtl">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowRight size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">إدارة الاشتراك</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full space-y-4">
        
        {/* Current Status Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">{merchant.storeName}</h2>
            <p className="text-sm text-gray-500 font-medium">ID: {merchant.id}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold">الحالة الحالية:</span>
              <span className="font-black text-indigo-700">{getStatusArabic(merchant.status)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold">تاريخ البداية:</span>
              <span className="font-semibold text-gray-900">{formatDate(merchant.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold">تاريخ الانتهاء:</span>
              <span className="font-semibold text-gray-900">
                {formatDate(merchant.status === 'TRIAL' ? merchant.trialEndsAt : merchant.subscriptionExpiresAt)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold">الأيام المتبقية:</span>
              <span className="font-black text-indigo-700">{daysRemaining} يوم</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button onClick={handleActivate3Months} className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm">
            <CheckCircle size={20} /> تفعيل 3 أشهر
          </button>
          
          <button onClick={handleExtend3Months} className="w-full bg-emerald-600 text-white font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm">
            <Calendar size={20} /> تمديد 3 أشهر
          </button>

          <button onClick={() => setIsCustomDateOpen(true)} className="w-full bg-white text-indigo-700 border border-indigo-200 font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-indigo-50 active:scale-[0.98] transition-all shadow-sm">
            <Clock size={20} /> تمديد مخصص
          </button>

          {merchant.status === 'SUSPENDED' ? (
            <button onClick={handleReactivate} className="w-full bg-green-50 text-green-700 font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-green-100 active:scale-[0.98] transition-all shadow-sm">
              <ShieldCheck size={20} /> إعادة تفعيل الحساب
            </button>
          ) : (
            <button onClick={handleSuspend} className="w-full bg-red-50 text-red-600 font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-red-100 active:scale-[0.98] transition-all shadow-sm">
              <ShieldAlert size={20} /> إيقاف الحساب
            </button>
          )}
        </div>

      </div>

      {isCustomDateOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">تمديد مخصص (أيام)</h3>
            <input 
              type="number" 
              value={customDays} 
              onChange={e => setCustomDays(e.target.value)} 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mb-6 outline-none focus:border-indigo-500" 
              dir="ltr"
            />
            <div className="flex gap-3">
              <button onClick={handleCustomExtend} className="flex-1 bg-indigo-600 text-white font-bold rounded-xl py-3 hover:bg-indigo-700">تأكيد</button>
              <button onClick={() => setIsCustomDateOpen(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold rounded-xl py-3 hover:bg-gray-200">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
