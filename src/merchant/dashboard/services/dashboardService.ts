import { getCustomers } from '../../debts/services/debtService';
import { getSuppliers } from '../../suppliers/services/supplierService';
import { getSales } from '../../sales/services/salesService';
import { getExpenses } from '../../expenses/services/expenseService';
import { todayLocalDateKey, toLocalDateKey } from '../../../shared/utils/date';

export const getDashboardStats = () => {
  const customers = getCustomers();
  const suppliers = getSuppliers();
  const sales = getSales();
  const expenses = getExpenses();

  const todayStr = todayLocalDateKey();

  const customersDebt = customers.reduce((sum, c) => sum + c.balance, 0);
  const suppliersDebt = suppliers.reduce((sum, s) => sum + s.balance, 0);

  const todaySales = sales.filter(s => toLocalDateKey(s.createdAt) === todayStr);
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.total - (s.refundedTotal || 0), 0);

  const todayExpenses = expenses.filter(e => e.createdAt && toLocalDateKey(e.createdAt) === todayStr);
  const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  const todayProfitFromSales = todaySales.reduce((sum, sale) => {
    return sum + sale.items.reduce((itemSum, item) => {
      const soldQuantity = item.quantity - (item.returnedQuantity || 0);
      const profit = (item.unitPrice * soldQuantity) - ((item.unitPurchasePrice || 0) * soldQuantity);
      return itemSum + profit;
    }, 0);
  }, 0);

  const todayProfit = todayProfitFromSales - todayExpensesTotal;

  return {
    customersDebt,
    suppliersDebt,
    todaySales: todaySalesTotal,
    todayProfit
  };
};
