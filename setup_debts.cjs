const fs = require('fs');

fs.mkdirSync('src/merchant/debts/services', { recursive: true });
fs.mkdirSync('src/merchant/debts/components', { recursive: true });

// 1. debtService.ts
fs.writeFileSync('src/merchant/debts/services/debtService.ts', `
import { mockCustomers, mockCustomerTransactions } from '../../../data/mock/merchant/mockData';
import { Customer } from '../../../shared/models/types';

export interface Debt {
  debtId: string;
  customerId: string;
  description: string;
  quantity: number;
  amount: number;
  createdAt: string;
  remainingAmount: number;
  status: 'OPEN' | 'PAID';
  note?: string;
}

export const getCustomers = (): Customer[] => {
  const local = localStorage.getItem('merchant_customers');
  if (local) return JSON.parse(local);
  return mockCustomers;
};

export const getCustomer = (id: string): Customer | undefined => {
  return getCustomers().find(c => c.id === id);
};

export const saveCustomers = (customers: Customer[]) => {
  localStorage.setItem('merchant_customers', JSON.stringify(customers));
};

export const getDebts = (customerId: string): Debt[] => {
  const local = localStorage.getItem('merchant_debts');
  const allDebts: Record<string, Debt[]> = local ? JSON.parse(local) : {};
  
  if (!allDebts[customerId]) {
    // initialize from mock transactions if empty
    const mockTxs = mockCustomerTransactions[customerId] || [];
    allDebts[customerId] = mockTxs.filter(t => t.type === 'debt').map(t => ({
      debtId: t.id,
      customerId,
      description: t.description,
      quantity: t.items ? t.items.reduce((acc, i) => acc + i.quantity, 0) : 1,
      amount: t.amount,
      createdAt: t.date,
      remainingAmount: t.amount, // simplification for now
      status: 'OPEN',
      note: ''
    }));
  }
  return allDebts[customerId] || [];
};

export const addDebt = (customerId: string, debtData: Omit<Debt, 'debtId' | 'customerId' | 'createdAt' | 'remainingAmount' | 'status'>) => {
  const local = localStorage.getItem('merchant_debts');
  const allDebts: Record<string, Debt[]> = local ? JSON.parse(local) : {};
  
  const currentDebts = getDebts(customerId); // Ensures initialization if needed
  if (!allDebts[customerId]) allDebts[customerId] = currentDebts;

  const newDebt: Debt = {
    ...debtData,
    debtId: 'd_' + Date.now().toString(),
    customerId,
    createdAt: new Date().toISOString().split('T')[0],
    remainingAmount: debtData.amount,
    status: 'OPEN'
  };

  allDebts[customerId] = [newDebt, ...allDebts[customerId]];
  localStorage.setItem('merchant_debts', JSON.stringify(allDebts));

  // Update customer balance
  const customers = getCustomers();
  const cIdx = customers.findIndex(c => c.id === customerId);
  if (cIdx >= 0) {
    customers[cIdx].balance += newDebt.amount;
    customers[cIdx].totalTaken += newDebt.amount;
    saveCustomers(customers);
  }
};
`);

