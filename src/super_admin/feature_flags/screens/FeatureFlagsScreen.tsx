import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, RotateCcw, ShieldCheck } from 'lucide-react';
import { getAdminMerchant, updateAdminMerchant, defaultFeatures } from '../../services/mockData';
import { AdminMerchant, MerchantFeatureFlags } from '../../models/types';

interface Props {
  merchantId: string;
  onBack: () => void;
}

export function FeatureFlagsScreen({ merchantId, onBack }: Props) {
  const [merchant, setMerchant] = useState<AdminMerchant | undefined>(undefined);

  const refresh = () => setMerchant(getAdminMerchant(merchantId));

  useEffect(() => {
    refresh();
  }, [merchantId]);

  if (!merchant) return null;

  const toggleFeature = (key: keyof MerchantFeatureFlags) => {
    const updatedFeatures = { ...merchant.features, [key]: !merchant.features[key] };
    updateAdminMerchant(merchantId, { features: updatedFeatures });
    refresh();
  };

  const handleEnableAll = () => {
    const allEnabled = Object.keys(defaultFeatures).reduce((acc, key) => {
      acc[key as keyof MerchantFeatureFlags] = true;
      return acc;
    }, {} as MerchantFeatureFlags);
    updateAdminMerchant(merchantId, { features: allEnabled });
    refresh();
  };

  const handleReset = () => {
    updateAdminMerchant(merchantId, { features: { ...defaultFeatures } });
    refresh();
  };

  const featureLabels: Record<keyof MerchantFeatureFlags, string> = {
    customerPortalEnabled: 'بوابة الزبون',
    cloudSyncEnabled: 'المزامنة السحابية',
    advancedReportsEnabled: 'التقارير المتقدمة',
    whatsappEnabled: 'واتساب',
    inventoryEnabled: 'المخزون',
    suppliersEnabled: 'الموردون',
    purchasesEnabled: 'المشتريات',
    expensesEnabled: 'المصروفات',
    overdueEnabled: 'المتأخرات'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]" dir="rtl">
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={onBack} className="p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
          <ArrowRight size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">إدارة الميزات</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto w-full space-y-4 pb-20">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900">{merchant.storeName}</h2>
          <p className="text-sm text-gray-500 font-medium mb-4">ID: {merchant.id}</p>
          
          <div className="flex gap-3">
            <button onClick={handleEnableAll} className="flex-1 bg-indigo-50 text-indigo-700 font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-indigo-100">
              <Check size={18} /> تفعيل الكل
            </button>
            <button onClick={handleReset} className="flex-1 bg-gray-100 text-gray-700 font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-gray-200">
              <RotateCcw size={18} /> الافتراضي
            </button>
          </div>
          
          {merchant.status === 'TRIAL' && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-xl flex items-start gap-2 text-xs font-semibold">
              <ShieldCheck size={16} className="shrink-0" />
              <span>ملاحظة: هذا الحساب في فترة تجريبية (TRIAL)، لذا جميع الميزات تعمل لديه تلقائياً بغض النظر عن هذه الإعدادات.</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {(Object.keys(featureLabels) as Array<keyof MerchantFeatureFlags>).map((key) => (
            <div key={key} className="p-4 flex items-center justify-between">
              <span className="font-bold text-gray-800">{featureLabels[key]}</span>
              <button 
                onClick={() => toggleFeature(key)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${merchant.features[key] ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200 ease-in-out ${merchant.features[key] ? 'left-0.5 translate-x-0' : 'left-[26px] translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
