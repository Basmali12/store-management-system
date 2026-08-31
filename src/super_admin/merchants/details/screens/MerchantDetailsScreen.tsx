import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Store,
  User,
  Phone,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Smartphone,
  RefreshCw,
  Settings,
  PlayCircle,
} from "lucide-react";
import { getAdminMerchant, updateAdminMerchant } from "../../../services/mockData";
import { AdminMerchant, SubscriptionStatus } from "../../../models/types";

interface Props {
  merchantId: string;
  onBack: () => void;
  onNavigateSubscription: (id: string) => void;
  onNavigateFeatures: (id: string) => void;
}

export function MerchantDetailsScreen({
  merchantId,
  onBack,
  onNavigateSubscription,
  onNavigateFeatures,
}: Props) {
  const [merchant, setMerchant] = useState<AdminMerchant | undefined>(
    undefined,
  );

  useEffect(() => {
    setMerchant(getAdminMerchant(merchantId));
  }, [merchantId]);

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center font-[Cairo]">
        <p className="text-gray-500 font-bold mb-4">التاجر غير موجود</p>
        <button
          onClick={onBack}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl"
        >
          عودة
        </button>
      </div>
    );
  }

  const getStatusArabic = (status: SubscriptionStatus) => {
    switch (status) {
      case "TRIAL":
        return "تجريبي";
      case "ACTIVE":
        return "فعال";
      case "EXPIRED":
        return "منتهي";
      case "SUSPENDED":
        return "موقوف";
    }
  };

  const getStatusColor = (status: SubscriptionStatus) => {
    switch (status) {
      case "TRIAL":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "ACTIVE":
        return "bg-green-100 text-green-700 border-green-200";
      case "EXPIRED":
        return "bg-red-100 text-red-700 border-red-200";
      case "SUSPENDED":
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleDateString("ar-IQ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "غير محدد";
    return new Date(dateString).toLocaleString("ar-IQ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysRemaining = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const end = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining =
    merchant.status === "TRIAL"
      ? getDaysRemaining(merchant.trialEndsAt)
      : getDaysRemaining(merchant.subscriptionExpiresAt);

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]"
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button
          onClick={onBack}
          className="p-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowRight size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">تفاصيل التاجر</h1>
      </div>

      <div className="p-4 max-w-3xl mx-auto w-full space-y-4">
        {/* Main Info Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex gap-4 items-center">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                <Store size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {merchant.storeName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                    ID: {merchant.id}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getStatusColor(merchant.status)}`}
                  >
                    {getStatusArabic(merchant.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <User size={16} className="text-gray-400" />
              <span className="font-semibold">{merchant.merchantName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Phone size={16} className="text-gray-400" />
              <span className="font-semibold" dir="ltr">
                {merchant.phone}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Calendar size={16} className="text-gray-400" />
              <span>
                تاريخ الإنشاء:{" "}
                <span className="font-semibold">
                  {formatDate(merchant.createdAt)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-gray-500 font-bold mb-1">
              الحالة الحالية
            </span>
            <span
              className={`text-sm font-black ${merchant.status === "ACTIVE" ? "text-green-600" : merchant.status === "TRIAL" ? "text-blue-600" : "text-red-600"}`}
            >
              {getStatusArabic(merchant.status)}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-gray-500 font-bold mb-1">
              متبقي
            </span>
            <span className="text-sm font-black text-gray-900">
              {daysRemaining} يوم
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-gray-500 font-bold mb-1">
              تاريخ الانتهاء
            </span>
            <span className="text-sm font-black text-gray-900">
              {formatDate(
                merchant.status === "TRIAL"
                  ? merchant.trialEndsAt
                  : merchant.subscriptionExpiresAt,
              )}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-gray-500 font-bold mb-1">
              مدة الاشتراك
            </span>
            <span className="text-sm font-black text-gray-900">
              {merchant.status === "TRIAL" ? "7 أيام" : "3 أشهر"}
            </span>
          </div>
        </div>

        {/* Detailed Times */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
            معلومات إضافية (معاينة)
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-2">
                <Clock size={16} /> آخر دخول
              </span>
              <span className="font-semibold text-gray-900" dir="ltr">
                {formatDateTime(merchant.lastLogin)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-2">
                <Smartphone size={16} /> الأجهزة المرتبطة
              </span>
              <span className="font-semibold text-gray-900">
                {merchant.linkedDevicesCount} أجهزة
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-2">
                <RefreshCw size={16} /> آخر مزامنة
              </span>
              <span className="font-semibold text-gray-900" dir="ltr">
                {formatDateTime(merchant.lastSync)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4 pb-12">
          <button
            onClick={() => onNavigateSubscription(merchant.id)}
            className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-200"
          >
            <PlayCircle size={20} /> إدارة الاشتراك
          </button>
          <button
            onClick={() => onNavigateFeatures(merchant.id)}
            className="w-full bg-white text-indigo-700 border border-indigo-200 font-bold rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-indigo-50 active:scale-[0.98] transition-all shadow-sm"
          >
            <Settings size={20} /> إدارة الميزات
          </button>
          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من إيقاف هذا الحساب؟')) {
                updateAdminMerchant(merchant.id, { status: 'SUSPENDED' });
                setMerchant({ ...merchant, status: 'SUSPENDED' });
              }
            }}
            className="w-full bg-red-50 text-red-600 font-bold rounded-xl p-4 mt-4 flex items-center justify-center gap-2 hover:bg-red-100 active:scale-[0.98] transition-all"
          >
            <AlertTriangle size={20} /> {merchant.status === 'SUSPENDED' ? 'الحساب موقوف' : 'إيقاف الحساب'}
          </button>
        </div>
      </div>
    </div>
  );
}
