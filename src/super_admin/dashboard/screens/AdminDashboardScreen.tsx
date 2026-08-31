import React, { useState, useEffect } from 'react';
import { Search, Store, Phone, ShieldCheck, Clock, AlertTriangle, XCircle, SearchX } from 'lucide-react';
import { getAdminStats, getAdminMerchants } from '../../services/mockData';
import { AdminMerchant, SubscriptionStatus } from '../../models/types';

interface Props {
  onSelectMerchant: (merchantId: string) => void;
}

export function AdminDashboardScreen({ onSelectMerchant }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [stats, setStats] = useState({ total: 0, trial: 0, active: 0, expired: 0, suspended: 0 });

  useEffect(() => {
    setMerchants(getAdminMerchants());
    setStats(getAdminStats());
  }, []);
  
  const filteredMerchants = merchants.filter(m => {
    const q = searchQuery.toLowerCase();
    return m.id.toLowerCase().includes(q) || 
           m.phone.includes(q) || 
           m.storeName.toLowerCase().includes(q);
  });

  const getStatusArabic = (status: SubscriptionStatus) => {
    switch(status) {
      case 'TRIAL': return 'تجريبي';
      case 'ACTIVE': return 'فعال';
      case 'EXPIRED': return 'منتهي';
      case 'SUSPENDED': return 'موقوف';
    }
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    switch(status) {
      case 'TRIAL': return 'bg-blue-100 text-blue-700';
      case 'ACTIVE': return 'bg-green-100 text-green-700';
      case 'EXPIRED': return 'bg-red-100 text-red-700';
      case 'SUSPENDED': return 'bg-gray-200 text-gray-700';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]" dir="rtl">
      {/* Header */}
      <div className="bg-indigo-900 text-white p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-1">لوحة الإدارة الرئيسية</h1>
        <p className="text-indigo-200 text-sm">إدارة حسابات أصحاب المحلات والاشتراكات</p>
      </div>

      <div className="p-4 max-w-4xl mx-auto w-full flex-1 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-gray-500 font-bold mb-1">إجمالي التجار</span>
            <span className="text-xl font-black text-gray-900">{stats.total}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-blue-500 font-bold mb-1 flex items-center gap-1"><Clock size={12}/> تجريبي</span>
            <span className="text-xl font-black text-blue-700">{stats.trial}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-50 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-green-500 font-bold mb-1 flex items-center gap-1"><ShieldCheck size={12}/> فعال</span>
            <span className="text-xl font-black text-green-700">{stats.active}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-50 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-red-500 font-bold mb-1 flex items-center gap-1"><AlertTriangle size={12}/> منتهي</span>
            <span className="text-xl font-black text-red-700">{stats.expired}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-gray-400 font-bold mb-1 flex items-center gap-1"><XCircle size={12}/> موقوف</span>
            <span className="text-xl font-black text-gray-600">{stats.suspended}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input 
            type="text" 
            placeholder="ابحث برقم الهاتف، اسم المحل، أو Merchant ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-900 rounded-2xl p-4 pr-12 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>

        {/* Merchant List */}
        <div className="space-y-3">
          {filteredMerchants.map(merchant => (
            <div 
              key={merchant.id}
              onClick={() => onSelectMerchant(merchant.id)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    {merchant.storeName}
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                      {merchant.id}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">{merchant.merchantName}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1" dir="ltr">
                    {merchant.phone} <Phone size={12} />
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <span className={`text-xs font-bold px-3 py-1 rounded-full w-fit ${getStatusColor(merchant.status)}`}>
                  الحالة: {getStatusArabic(merchant.status)}
                </span>
                <p className="text-xs text-gray-500 font-medium">
                  {merchant.status === 'TRIAL' ? 'تنتهي التجربة:' : 'ينتهي الاشتراك:'} <span className="font-bold text-gray-700">{formatDate(merchant.status === 'TRIAL' ? merchant.trialEndsAt : merchant.subscriptionExpiresAt)}</span>
                </p>
              </div>
            </div>
          ))}

          {filteredMerchants.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
              <SearchX size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500 font-bold">لا يوجد نتائج تطابق بحثك</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
