export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // positive means they owe us
  lastActivity: string;
  status: 'active' | 'inactive';
  totalTaken: number;
  totalPaid: number;
  merchantId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  balance: number; // positive means we owe them
  lastActivity: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  lowStockThreshold: number;
}

export interface Sale {
  id: string;
  date: string;
  totalAmount: number;
  type: 'cash' | 'credit';
  customerId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debt' | 'payment';
  items?: { name: string; quantity: number; price: number }[];
}

export interface DashboardStats {
  customersDebt: number;
  suppliersDebt: number;
  todaySales: number;
  todayProfit: number;
  lateCustomersCount: number;
  lateCustomersTotal: number;
  lowStockCount: number;
}
