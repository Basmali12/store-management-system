import React from 'react';
import { ChevronRight, TrendingUp, ShoppingCart, WalletCards, Package } from 'lucide-react';
import { getSales } from '../../sales/services/salesService';
import { getPurchases } from '../../purchases/services/purchasesService';
import { getExpenses } from '../../expenses/services/expenseService';
import { getProducts } from '../../inventory/services/inventoryService';
import { formatCurrency } from '../../../data/mock/merchant/mockData';

export function ReportsScreen({ onBack }: { onBack: () => void }) {
  const sales = getSales();
  const purchases = getPurchases();
  const expenses = getExpenses();
  const products = getProducts();
  const netSales = sales.reduce((sum, sale) => sum + sale.total - (sale.refundedTotal || 0), 0);
  const purchaseTotal = purchases.reduce((sum, purchase) => sum + purchase.total - (purchase.returnedTotal || 0), 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const grossProfit = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => {
    const sold = item.quantity - (item.returnedQuantity || 0);
    return itemSum + (item.unitPrice - (item.unitPurchasePrice || 0)) * sold;
  }, 0), 0);
  const netProfit = grossProfit - expenseTotal;
  const inventoryValue = products.reduce((sum, product) => sum + product.quantity * product.purchasePrice, 0);
  const quantities = new Map<string, number>();
  for (const sale of sales) for (const item of sale.items) quantities.set(item.productName, (quantities.get(item.productName) || 0) + item.quantity - (item.returnedQuantity || 0));
  const topProducts = [...quantities.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const cards = [
    { label: 'صافي المبيعات', value: netSales, icon: ShoppingCart, color: 'bg-indigo-50 text-indigo-700' },
    { label: 'إجمالي المشتريات', value: purchaseTotal, icon: WalletCards, color: 'bg-orange-50 text-orange-700' },
    { label: 'صافي الربح', value: netProfit, icon: TrendingUp, color: netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700' },
    { label: 'قيمة المخزون', value: inventoryValue, icon: Package, color: 'bg-purple-50 text-purple-700' }
  ];
  return <div className="h-screen bg-gray-50 overflow-auto pb-8 font-[Cairo]" dir="rtl">
    <div className="bg-white p-4 flex items-center gap-3 sticky top-0 border-b z-10"><button onClick={onBack} className="p-2 bg-gray-100 rounded-full"><ChevronRight/></button><h1 className="text-xl font-bold">التقارير والإحصائيات</h1></div>
    <div className="p-4 grid grid-cols-2 gap-3">{cards.map(({label,value,icon:Icon,color}) => <div key={label} className="bg-white rounded-2xl p-4 border"><div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}><Icon size={20}/></div><p className="text-xs text-gray-500">{label}</p><p className="font-black mt-1">{formatCurrency(value)}</p></div>)}</div>
    <div className="mx-4 bg-white rounded-2xl p-4 border"><h2 className="font-bold mb-3">ملخص إضافي</h2><div className="space-y-2 text-sm"><p className="flex justify-between"><span>المصروفات</span><b>{formatCurrency(expenseTotal)}</b></p><p className="flex justify-between"><span>عدد المبيعات</span><b>{sales.length}</b></p><p className="flex justify-between"><span>عدد المنتجات</span><b>{products.length}</b></p></div></div>
    <div className="m-4 bg-white rounded-2xl p-4 border"><h2 className="font-bold mb-3">الأكثر مبيعًا</h2>{topProducts.length ? topProducts.map(([name,quantity]) => <p key={name} className="flex justify-between py-2 border-b last:border-0 text-sm"><span>{name}</span><b>{quantity}</b></p>) : <p className="text-sm text-gray-400">لا توجد مبيعات بعد</p>}</div>
  </div>;
}
