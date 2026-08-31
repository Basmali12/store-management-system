import React, { useState, useEffect } from 'react';
import { ArrowRight, Calendar, AlertTriangle, ChevronLeft } from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { getOverdueCustomers, OverdueCustomer, getOverdueStats } from '../services/overdueService';
import { cn } from '../../../shared/utils/utils';

type FilterType = 'TODAY' | 'WEEK' | 'MONTH' | 'MORE' | 'ALL';

interface OverdueScreenProps {
  onBack?: () => void;
  onSelectCustomer?: (customerId: string) => void;
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export function OverdueScreen({ onBack, onSelectCustomer }: OverdueScreenProps) {
  const [customers, setCustomers] = useState<OverdueCustomer[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');

  useEffect(() => {
    setCustomers(getOverdueCustomers());
  }, []);

  const filteredCustomers = customers.filter(c => {
    if (filter === 'TODAY') return c.maxDaysOverdue === 0;
    if (filter === 'WEEK') return c.maxDaysOverdue >= 1 && c.maxDaysOverdue <= 7;
    if (filter === 'MONTH') return c.maxDaysOverdue >= 8 && c.maxDaysOverdue <= 30;
    if (filter === 'MORE') return c.maxDaysOverdue > 30;
    return true; // ALL
  });

  const stats = getOverdueStats();

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      <div className="bg-white px-5 pt-4 pb-4 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -mr-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors">
              <ArrowRight size={20} />
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            المتأخرات
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4 bg-red-600 text-white border-none shadow-md shadow-red-200">
            <p className="text-[11px] text-red-100 mb-1">إجمالي المبالغ المتأخرة</p>
            <p className="text-lg font-bold">{formatCurrency(stats.lateCustomersTotal)}</p>
          </Card>
          <Card className="!p-4 bg-white border border-gray-100 shadow-sm">
            <p className="text-[11px] text-gray-500 mb-1">عدد الزبائن المتأخرين</p>
            <p className="text-lg font-bold text-gray-900">{stats.lateCustomersCount} زبون</p>
          </Card>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 overflow-x-auto hide-scrollbar">
          {(['TODAY', 'WEEK', 'MONTH', 'MORE', 'ALL'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 py-2 px-3 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap min-w-[70px]",
                filter === f ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:bg-gray-200"
              )}
            >
              {f === 'TODAY' ? 'يستحق اليوم' : f === 'WEEK' ? '1-7 أيام' : f === 'MONTH' ? '8-30 يوم' : f === 'MORE' ? 'أكثر من 30' : 'الكل'}
            </button>
          ))}
        </div>

        <section>
          <div className="space-y-3 mt-2">
            {filteredCustomers.map((item, idx) => (
              <Card 
                key={idx} 
                className="!p-4 border border-red-50 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelectCustomer && onSelectCustomer(item.customer.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <p className="font-bold text-gray-900 text-sm mb-1">{item.customer.name}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Calendar size={12} className="text-gray-400" />
                      أقدم استحقاق: {formatDate(item.oldestDueDate)}
                    </p>
                  </div>
                  <div className="text-left flex flex-col items-end">
                    <span className="font-black text-red-600 text-sm mb-1">
                      {formatCurrency(item.totalOverdueAmount)}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      item.maxDaysOverdue === 0 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                    )}>
                      {item.maxDaysOverdue === 0 ? 'يستحق اليوم' : `متأخر ${item.maxDaysOverdue} يوم`}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                لا يوجد متأخرون حتى الآن
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
