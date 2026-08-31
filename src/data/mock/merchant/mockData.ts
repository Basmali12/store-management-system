import { Customer, DashboardStats, Product, Sale, Supplier, Transaction } from '../../../shared/models/types';

export const mockDashboardStats: DashboardStats = {
  customersDebt: 0,
  suppliersDebt: 0,
  todaySales: 0,
  todayProfit: 0,
  lateCustomersCount: 0,
  lateCustomersTotal: 0,
  lowStockCount: 0,
};

export const mockCustomers: Customer[] = [];
export const mockSuppliers: Supplier[] = [];
export const mockProducts: Product[] = [];
export const mockSales: Sale[] = [];
export const mockCustomerTransactions: Record<string, Transaction[]> = {};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-IQ').format(amount) + ' د.ع';
};
