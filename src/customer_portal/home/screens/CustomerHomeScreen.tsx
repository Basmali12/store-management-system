import React, { useEffect, useState } from "react";
import {
  LogOut,
  Store,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Banknote,
} from "lucide-react";
import { Card } from "../../../shared/components/Card";
import { tenantGetItem } from "../../../shared/storage/tenantStorage";
import { getMerchantAccount } from "../../../shared/auth/merchantAccounts";

interface Props {
  customerId: string;
  merchantId: string;
  onLogout: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("ar-IQ").format(amount) + " د.ع";

export function CustomerHomeScreen({ customerId, merchantId, onLogout }: Props) {
  const [customer, setCustomer] = useState<any>(null);
  const [debts, setDebts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    // 1. Get Customer Data
    const localCust = tenantGetItem('merchant_customers', merchantId);
    let customers = localCust ? JSON.parse(localCust) : [];
    const currCust = customers.find((c: any) => c.id === customerId);
    setCustomer(currCust);

    // 2. Get Open Debts
    const localDebts = tenantGetItem('merchant_debts', merchantId);
    let allDebts = localDebts ? JSON.parse(localDebts) : {};
    let userDebts = allDebts[customerId] || [];
    
    setDebts(userDebts.filter((d: any) => d.status === 'OPEN'));

    // 3. Get Payments
    const localPayments = tenantGetItem('merchant_payments', merchantId);
    const allPayments = localPayments ? JSON.parse(localPayments) : {};
    let userPayments = allPayments[customerId] || [];

    setPayments(userPayments);
  }, [customerId, merchantId]);

  if (!customer)
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center font-[Cairo]"
        dir="rtl"
      >
        جاري التحميل...
      </div>
    );

  // Try to get store name from local storage if available
  const storeName = getMerchantAccount(merchantId)?.storeName || 'المتجر';

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col font-[Cairo]"
      dir="rtl"
    >
      <div className="bg-teal-600 px-5 pt-8 pb-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-900 opacity-20 rounded-full blur-2xl -ml-10 -mb-10"></div>

        <div className="flex justify-between items-center relative z-10">
          <div>
            <p className="text-xs font-bold text-teal-100">حساب الزبون</p>
            <h1 className="mt-1 text-2xl font-black text-white">{customer.name}</h1>
            <p className="text-teal-100 text-sm mt-1 flex items-center gap-1">
              <Store size={14} /> حسابي · {storeName}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-20 space-y-4 pb-10">
        <Card className="border-none shadow-xl shadow-teal-900/5 bg-white relative overflow-hidden !p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
              <CreditCard size={20} />
            </div>
            <p className="text-sm font-bold text-gray-500">المبلغ المتبقي</p>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mt-2">
            {formatCurrency(customer.balance)}
          </h2>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-md shadow-gray-200/40 !p-4 bg-white">
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
              <ArrowUpRight size={18} />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">إجمالي الأخذ</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(customer.totalTaken)}
            </p>
          </Card>

          <Card className="border-none shadow-md shadow-gray-200/40 !p-4 bg-white">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3">
              <ArrowDownRight size={18} />
            </div>
            <p className="text-xs font-bold text-gray-500 mb-1">
              إجمالي التسديد
            </p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(customer.totalPaid)}
            </p>
          </Card>
        </div>

        <section className="pt-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Receipt size={18} className="text-teal-600" />
            الديون الحالية
          </h3>
          <div className="space-y-2">
            {debts.map((d) => (
              <div
                key={d.debtId}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
              >
                <div className="flex-1 pl-2">
                  <p className="text-sm font-bold text-gray-900">
                    {d.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span>الكمية: {d.quantity}</span>
                    <span className="text-gray-300">|</span>
                    <span>{d.createdAt}</span>
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-red-600">
                    {formatCurrency(d.remainingAmount)}
                  </p>
                </div>
              </div>
            ))}
            {debts.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                لا توجد ديون حالية
              </div>
            )}
          </div>
        </section>

        <section className="pt-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Banknote size={18} className="text-teal-600" />
            آخر التسديدات
          </h3>
          <div className="space-y-2">
            {payments.map((p) => (
              <div
                key={p.paymentId}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center"
              >
                <div className="flex-1 pl-2">
                  <p className="text-sm font-bold text-gray-900">تسديد دفعة</p>
                  <p className="text-xs text-gray-500 mt-1">{p.createdAt}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-green-600">
                    {formatCurrency(p.amount)}
                  </p>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                لا توجد تسديدات سابقة
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
