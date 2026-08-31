import React from 'react';
import { ShoppingBag, FileMinus, PieChart, Users, History, DatabaseBackup, Palette, Settings, ChevronLeft, Package } from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { clearMerchantSession } from '../../../shared/storage/session';
import { cn } from '../../../shared/utils/utils';
import { signOutOfficialMerchant } from '../../../shared/auth/serverAuth';

interface Props { onNavigate?: (route: string) => void; }

export function MoreScreen({ onNavigate }: Props) {
  const sections = [
    {
      title: 'العمليات',
      items: [
        { icon: Package, label: 'المخزون', color: 'text-purple-500', bg: 'bg-purple-50', route: 'inventory' },
        { icon: ShoppingBag, label: 'المشتريات', color: 'text-indigo-500', bg: 'bg-indigo-50', route: 'purchases' },
        { icon: Users, label: 'الموردين', color: 'text-cyan-500', bg: 'bg-cyan-50', route: 'suppliers' },
        { icon: FileMinus, label: 'المصروفات', color: 'text-rose-500', bg: 'bg-rose-50', route: 'expenses' },
      ]
    },
    {
      title: 'التقارير والمتابعة',
      items: [
        { icon: PieChart, label: 'التقارير والإحصائيات', color: 'text-indigo-500', bg: 'bg-indigo-50', route: 'reports' },
        { icon: Users, label: 'المتأخرات', color: 'text-orange-500', bg: 'bg-orange-50', route: 'overdue' },
        { icon: History, label: 'سجل العمليات', color: 'text-teal-500', bg: 'bg-teal-50', route: 'activity_log' },
      ]
    },
    {
      title: 'النظام',
      items: [
        { icon: DatabaseBackup, label: 'النسخ الاحتياطي', color: 'text-emerald-500', bg: 'bg-emerald-50', route: 'backup' },
        { icon: Palette, label: 'تخصيص التطبيق', color: 'text-purple-500', bg: 'bg-purple-50', route: 'product_fields' },
        { icon: Settings, label: 'الإعدادات', color: 'text-gray-500', bg: 'bg-gray-100', route: 'settings' },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20">
      <div className="bg-white px-5 pt-4 pb-4 shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">المزيد</h1>
      </div>

      <div className="overflow-y-auto p-4 space-y-6">
        
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-sm font-bold text-gray-500 px-2">{section.title}</h3>
            <Card className="!p-0 overflow-hidden divide-y divide-gray-50">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button key={itemIdx} onClick={() => item.route && onNavigate?.(item.route)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", item.bg, item.color)}>
                        <Icon size={20} />
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{item.label}</span>
                    </div>
                    <ChevronLeft className="text-gray-300" size={20} />
                  </button>
                )
              })}
            </Card>
          </div>
        ))}
        
        
        <div className="text-center pb-8 pt-4">
          <button 
            onClick={() => { void signOutOfficialMerchant().finally(() => { clearMerchantSession(); window.location.reload(); }); }}
            className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl mb-4 hover:bg-red-100 active:scale-95 transition-all"
          >
            تسجيل خروج
          </button>
          <p className="text-xs text-gray-400 font-semibold">إصدار التطبيق 1.0.0</p>
        </div>

      </div>
    </div>
  );
}
