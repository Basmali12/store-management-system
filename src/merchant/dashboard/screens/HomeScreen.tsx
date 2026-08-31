import React from 'react';
import { Card } from '../../../shared/components/Card';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { HandCoins, ArrowDownToLine, ShoppingCart, PackagePlus, UserPlus, FileMinus, AlertTriangle, Users } from 'lucide-react';
import { getLowStockProducts } from '../../inventory/services/inventoryService';
import { getOverdueStats } from '../../overdue/services/overdueService';
import { getDashboardStats } from '../services/dashboardService';
import { useState, useEffect } from 'react';

export function HomeScreen({ onNavigateOverdue, onNavigateInventory, onQuickAction }: { onNavigateOverdue?: () => void, onNavigateInventory?: () => void, onQuickAction?: (action: string) => void }) {
  const [lowStockCount, setLowStockCount] = useState(0);
  const [overdueStats, setOverdueStats] = useState({ lateCustomersCount: 0, lateCustomersTotal: 0 });
  const [dashboardStats, setDashboardStats] = useState({ customersDebt: 0, suppliersDebt: 0, todaySales: 0, todayProfit: 0 });

  useEffect(() => {
    setLowStockCount(getLowStockProducts().length);
    setOverdueStats(getOverdueStats());
    setDashboardStats(getDashboardStats());
  }, []);

  const quickActions = [
    { id: 'add_debt', icon: HandCoins, label: 'إضافة دين', color: 'text-white', bg: 'bg-indigo-600', wrapper: 'bg-indigo-50' },
    { id: 'add_payment', icon: ArrowDownToLine, label: 'تسجيل تسديد', color: 'text-white', bg: 'bg-green-600', wrapper: 'bg-green-50' },
    { id: 'sale', icon: ShoppingCart, label: 'عملية بيع', color: 'text-white', bg: 'bg-amber-500', wrapper: 'bg-amber-50' },
    { id: 'add_product', icon: PackagePlus, label: 'إضافة منتج', color: 'text-white', bg: 'bg-purple-600', wrapper: 'bg-purple-50' },
    { id: 'add_customer', icon: UserPlus, label: 'إضافة زبون', color: 'text-white', bg: 'bg-teal-600', wrapper: 'bg-teal-50' },
    { id: 'add_expense', icon: FileMinus, label: 'إضافة مصروف', color: 'text-white', bg: 'bg-rose-600', wrapper: 'bg-rose-50' },
  ];

  return (
    <div className="px-4 pb-24 space-y-4 relative z-20 -mt-8">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="!p-3">
          <p className="text-[10px] text-gray-500 mb-1">المبالغ المطلوبة من الزبائن</p>
          <p className="text-sm font-bold text-red-600">{formatCurrency(dashboardStats.customersDebt)}</p>
        </Card>
        
        <Card className="!p-3">
          <p className="text-[10px] text-gray-500 mb-1">المبالغ المطلوبة للموردين</p>
          <p className="text-sm font-bold text-orange-600">{formatCurrency(dashboardStats.suppliersDebt)}</p>
        </Card>

        <Card className="!p-3">
          <p className="text-[10px] text-gray-500 mb-1">مبيعات اليوم</p>
          <p className="text-sm font-bold text-green-600">{formatCurrency(dashboardStats.todaySales)}</p>
        </Card>

        <Card className="!p-3">
          <p className="text-[10px] text-gray-500 mb-1">صافي الربح</p>
          <p className="text-sm font-bold text-indigo-600">{formatCurrency(dashboardStats.todayProfit)}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <section>
        <h2 className="text-gray-700 text-xs font-bold mb-2 px-1">إجراءات سريعة</h2>
        <div className="grid grid-cols-3 gap-2">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <div 
                key={idx} 
                onClick={() => onQuickAction && onQuickAction(action.id)}
                className={`p-2 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-all ${action.wrapper}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${action.bg} ${action.color}`}>
                  <Icon size={16} />
                </div>
                <span className="text-[10px] font-medium text-gray-800">{action.label}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Arrears */}
      <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex justify-between items-center shadow-sm mt-4">
        <div>
          <p className="text-[11px] font-bold text-red-800">{overdueStats.lateCustomersCount} زبائن لديهم متأخرات</p>
          <p className="text-[10px] text-red-600 font-bold mt-0.5">{formatCurrency(overdueStats.lateCustomersTotal)}</p>
        </div>
        <button onClick={onNavigateOverdue} className="bg-red-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
          عرض
        </button>
      </div>

      {/* Low Stock Alerts */}
      <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex justify-between items-center shadow-sm">
        <div>
          <p className="text-[11px] font-bold text-orange-800">{lowStockCount} منتجات قاربت على النفاد</p>
          <p className="text-[10px] text-orange-600 font-bold mt-0.5">يحتاج لإعادة طلب</p>
        </div>
        <button onClick={onNavigateInventory} className="bg-orange-600 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
          عرض
        </button>
      </div>
    </div>
  );
}
