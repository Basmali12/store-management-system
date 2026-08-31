import { Debt, getCustomers, getDebts } from '../../debts/services/debtService';
import { Customer } from '../../../shared/models/types';

export interface OverdueDebtInfo {
  debt: Debt;
  daysOverdue: number;
  status: 'DUE_TODAY' | 'OVERDUE';
}

export interface OverdueCustomer {
  customer: Customer;
  totalOverdueAmount: number;
  oldestDueDate: string;
  maxDaysOverdue: number;
  overdueDebts: OverdueDebtInfo[];
}

export const getOverdueCustomers = (): OverdueCustomer[] => {
  const customers = getCustomers();
  const overdueCustomers: OverdueCustomer[] = [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const customer of customers) {
    const debts = getDebts(customer.id);
    const overdueDebts: OverdueDebtInfo[] = [];
    
    for (const debt of debts) {
      if (debt.status === 'OPEN' && debt.remainingAmount > 0 && debt.dueDate) {
        const [year, month, day] = debt.dueDate.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          overdueDebts.push({ debt, daysOverdue: 0, status: 'DUE_TODAY' });
        } else if (diffDays > 0) {
          overdueDebts.push({ debt, daysOverdue: diffDays, status: 'OVERDUE' });
        }
      }
    }
    
    if (overdueDebts.length > 0) {
      const totalOverdueAmount = overdueDebts.reduce((sum, item) => sum + item.debt.remainingAmount, 0);
      
      let oldestDueDate = overdueDebts[0].debt.dueDate!;
      let maxDaysOverdue = overdueDebts[0].daysOverdue;
      
      for (const item of overdueDebts) {
        if (item.daysOverdue > maxDaysOverdue) {
          maxDaysOverdue = item.daysOverdue;
          oldestDueDate = item.debt.dueDate!;
        }
      }
      
      overdueCustomers.push({
        customer,
        totalOverdueAmount,
        oldestDueDate,
        maxDaysOverdue,
        overdueDebts
      });
    }
  }
  
  return overdueCustomers.sort((a, b) => b.maxDaysOverdue - a.maxDaysOverdue);
};

export const getOverdueStats = () => {
  const overdueCustomers = getOverdueCustomers();
  const count = overdueCustomers.length;
  const total = overdueCustomers.reduce((sum, item) => sum + item.totalOverdueAmount, 0);
  
  return {
    lateCustomersCount: count,
    lateCustomersTotal: total
  };
};
