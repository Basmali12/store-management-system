import { Expense } from '../models/types';
import { tenantGetItem, tenantSetItem } from '../../../shared/storage/tenantStorage';
import { createId } from '../../../shared/utils/id';
import { addAuditEntry } from '../../../shared/audit/auditService';

const STORAGE_KEY = 'merchant_expenses';

export const getExpenses = (): Expense[] => {
  const local = tenantGetItem(STORAGE_KEY);
  return local ? JSON.parse(local) : [];
};

export const saveExpenses = (expenses: Expense[]) => {
  tenantSetItem(STORAGE_KEY, JSON.stringify(expenses));
};

export const addExpense = (category: string, amount: number, note?: string): Expense => {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('مبلغ المصروف غير صالح');
  const expenses = getExpenses();
  const newExpense: Expense = {
    expenseId: createId('exp'),
    category,
    amount,
    createdAt: new Date().toISOString(),
    note
  };
  saveExpenses([newExpense, ...expenses]);
  addAuditEntry({ action: 'CREATE', entity: 'EXPENSE', entityId: newExpense.expenseId, description: `إضافة مصروف بقيمة ${amount}` });
  return newExpense;
};

export const updateExpense = (expenseId: string, category: string, amount: number, note?: string): Expense => {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('مبلغ المصروف غير صالح');
  const expenses = getExpenses();
  const index = expenses.findIndex(e => e.expenseId === expenseId);
  if (index === -1) throw new Error('المصروف غير موجود');
  
  expenses[index] = {
    ...expenses[index],
    category,
    amount,
    note
  };
  
  saveExpenses(expenses);
  addAuditEntry({ action: 'UPDATE', entity: 'EXPENSE', entityId: expenseId, description: `تعديل مصروف إلى ${amount}` });
  return expenses[index];
};

export const deleteExpense = (expenseId: string): void => {
  const expenses = getExpenses();
  const filtered = expenses.filter(e => e.expenseId !== expenseId);
  saveExpenses(filtered);
  addAuditEntry({ action: 'DELETE', entity: 'EXPENSE', entityId: expenseId, description: 'حذف مصروف' });
};
