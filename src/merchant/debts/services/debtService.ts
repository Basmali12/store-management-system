import { mockCustomers, mockCustomerTransactions } from '../../../data/mock/merchant/mockData';
import { Customer } from '../../../shared/models/types';
import { tenantGetItem, tenantSetItem } from '../../../shared/storage/tenantStorage';
import { createId } from '../../../shared/utils/id';
import { todayLocalDateKey } from '../../../shared/utils/date';
import { addAuditEntry } from '../../../shared/audit/auditService';
import { isValidCustomerPhone, normalizePhone } from '../../../shared/utils/phone';

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
  dueDate?: string;
  saleId?: string;
}

export interface Payment {
  paymentId: string;
  customerId: string;
  amount: number;
  createdAt: string;
  note: string;
  balanceBefore: number;
  balanceAfter: number;
}

export const getCustomers = (): Customer[] => {
  const local = tenantGetItem('merchant_customers');
  if (local) return JSON.parse(local);
  return mockCustomers;
};

export const getCustomer = (id: string): Customer | undefined => {
  return getCustomers().find(c => c.id === id);
};

export const saveCustomers = (customers: Customer[]) => {
  tenantSetItem('merchant_customers', JSON.stringify(customers));
  window.dispatchEvent(new Event('merchant_data_updated'));
};

export const updateCustomer = (id: string, name: string, phone: string) => {
  const customers = getCustomers();
  const cIdx = customers.findIndex(c => c.id === id);
  if (cIdx > -1) {
    const normalizedPhone = normalizePhone(phone);
    if (!isValidCustomerPhone(normalizedPhone)) throw new Error('أدخل رقم هاتف صحيح للزبون');
    if (customers.some(customer => customer.id !== id && normalizePhone(customer.phone) === normalizedPhone)) {
      throw new Error('رقم الهاتف مسجل لزبون آخر');
    }
    customers[cIdx].name = name;
    customers[cIdx].phone = normalizedPhone;
    saveCustomers(customers);
    addAuditEntry({ action: 'UPDATE', entity: 'CUSTOMER', entityId: id, description: `تعديل بيانات الزبون: ${name}` });
  }
};

export const canDeleteCustomer = (id: string): boolean => {
  const customer = getCustomers().find(c => c.id === id);
  if (!customer) return false;
  if (customer.balance !== 0) return false;

  const localDebts = tenantGetItem('merchant_debts');
  const allDebts: Record<string, Debt[]> = localDebts ? JSON.parse(localDebts) : {};
  const cDebts = allDebts[id] || [];
  if (cDebts.length > 0) return false;

  const localPayments = tenantGetItem('merchant_payments');
  const allPayments: Record<string, Payment[]> = localPayments ? JSON.parse(localPayments) : {};
  const cPayments = allPayments[id] || [];
  if (cPayments.length > 0) return false;

  return true;
};

export const deleteCustomer = (id: string): boolean => {
  if (!canDeleteCustomer(id)) return false;
  
  const customers = getCustomers();
  const filtered = customers.filter(c => c.id !== id);
  saveCustomers(filtered);
  addAuditEntry({ action: 'DELETE', entity: 'CUSTOMER', entityId: id, description: `حذف الزبون: ${customers.find(c => c.id === id)?.name || id}` });
  return true;
};

export const addCustomer = async (name: string, phone: string): Promise<Customer> => {
  const customers = getCustomers();
  const normalizedPhone = normalizePhone(phone);
  if (!isValidCustomerPhone(normalizedPhone)) throw new Error('أدخل رقم هاتف صحيح للزبون');
  if (customers.some(customer => normalizePhone(customer.phone) === normalizedPhone)) {
    throw new Error('رقم الهاتف مسجل لزبون آخر');
  }

  const newCustomer: Customer = {
    id: createId('c'),
    name,
    phone: normalizedPhone,
    balance: 0,
    lastActivity: todayLocalDateKey(),
    totalTaken: 0,
    totalPaid: 0,
    status: 'active',
  };
  saveCustomers([newCustomer, ...customers]);
  addAuditEntry({ action: 'CREATE', entity: 'CUSTOMER', entityId: newCustomer.id, description: `إضافة زبون: ${name}` });
  return newCustomer;
};

export const getDebts = (customerId: string): Debt[] => {
  const local = tenantGetItem('merchant_debts');
  const allDebts: Record<string, Debt[]> = local ? JSON.parse(local) : {};
  
  if (!allDebts[customerId]) {
    const mockTxs = mockCustomerTransactions[customerId] || [];
    allDebts[customerId] = mockTxs.filter(t => t.type === 'debt').map(t => ({
      debtId: t.id,
      customerId,
      description: t.description,
      quantity: t.items ? t.items.reduce((acc, i) => acc + i.quantity, 0) : 1,
      amount: t.amount,
      createdAt: t.date,
      remainingAmount: t.amount,
      status: 'OPEN',
      note: ''
    }));
  }
  return allDebts[customerId] || [];
};

export const addDebt = (customerId: string, debtData: Omit<Debt, 'debtId' | 'customerId' | 'createdAt' | 'remainingAmount' | 'status'>) => {
  if (!Number.isFinite(debtData.amount) || debtData.amount <= 0) throw new Error('مبلغ الدين غير صالح');
  if (!Number.isFinite(debtData.quantity) || debtData.quantity <= 0) throw new Error('كمية الدين غير صالحة');
  const local = tenantGetItem('merchant_debts');
  const allDebts: Record<string, Debt[]> = local ? JSON.parse(local) : {};
  
  const currentDebts = getDebts(customerId);
  if (!allDebts[customerId]) allDebts[customerId] = currentDebts;

  const newDebt: Debt = {
    ...debtData,
    debtId: createId('d'),
    customerId,
    createdAt: todayLocalDateKey(),
    remainingAmount: debtData.amount,
    status: 'OPEN'
  };

  allDebts[customerId] = [newDebt, ...allDebts[customerId]];
  tenantSetItem('merchant_debts', JSON.stringify(allDebts));

  const customers = getCustomers();
  const cIdx = customers.findIndex(c => c.id === customerId);
  if (cIdx >= 0) {
    customers[cIdx].balance += newDebt.amount;
    customers[cIdx].totalTaken += newDebt.amount;
    saveCustomers(customers);
  }
  addAuditEntry({ action: 'CREATE', entity: 'DEBT', entityId: newDebt.debtId, description: `إضافة دين بقيمة ${newDebt.amount}` });
  return newDebt;
};

export const addPayment = (customerId: string, amount: number, note: string = '') => {
  const customers = getCustomers();
  const cIdx = customers.findIndex(c => c.id === customerId);
  if (cIdx < 0) return;

  const customer = customers[cIdx];
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('مبلغ التسديد غير صالح');
  if (amount > customer.balance) throw new Error('مبلغ التسديد أكبر من رصيد الزبون');
  const balanceBefore = customer.balance;
  const balanceAfter = balanceBefore - amount;

  const local = tenantGetItem('merchant_debts');
  const allDebts: Record<string, Debt[]> = local ? JSON.parse(local) : {};
  const debts = getDebts(customerId);
   
  let remainingPayment = amount;
  
  const openDebts = debts.filter(d => d.status === 'OPEN').sort((a, b) => {
    const tA = new Date(a.createdAt).getTime();
    const tB = new Date(b.createdAt).getTime();
    if (tA === tB) return a.debtId.localeCompare(b.debtId);
    return tA - tB;
  });

  for (const debt of openDebts) {
    if (remainingPayment <= 0) break;
    
    const actualDebt = debts.find(d => d.debtId === debt.debtId);
    if (!actualDebt) continue;

    if (remainingPayment >= actualDebt.remainingAmount) {
      remainingPayment -= actualDebt.remainingAmount;
      actualDebt.remainingAmount = 0;
      actualDebt.status = 'PAID';
    } else {
      actualDebt.remainingAmount -= remainingPayment;
      remainingPayment = 0;
    }
  }

  allDebts[customerId] = debts;
  tenantSetItem('merchant_debts', JSON.stringify(allDebts));

  customer.balance = balanceAfter;
  customer.totalPaid += amount;
  saveCustomers(customers);

  const localPayments = tenantGetItem('merchant_payments');
  const allPayments: Record<string, Payment[]> = localPayments ? JSON.parse(localPayments) : {};
  const newPayment: Payment = {
    paymentId: createId('pay'),
    customerId,
    amount,
    createdAt: todayLocalDateKey(),
    note,
    balanceBefore,
    balanceAfter
  };

  if (!allPayments[customerId]) allPayments[customerId] = [];
  allPayments[customerId] = [newPayment, ...allPayments[customerId]];
  tenantSetItem('merchant_payments', JSON.stringify(allPayments));
  addAuditEntry({ action: 'PAYMENT', entity: 'CUSTOMER', entityId: customerId, description: `تسديد زبون بقيمة ${amount}` });
  
  return { balanceBefore, balanceAfter };
};

export const deletePayment = (customerId: string, paymentId: string) => {
  const localPayments = tenantGetItem('merchant_payments');
  if (!localPayments) return;
  const allPayments = JSON.parse(localPayments);
  const cPayments = allPayments[customerId] || [];
  
  const paymentIdx = cPayments.findIndex((p: any) => p.paymentId === paymentId);
  if (paymentIdx < 0) return;
  
  const payment = cPayments[paymentIdx];
  cPayments.splice(paymentIdx, 1);
  allPayments[customerId] = cPayments;
  tenantSetItem('merchant_payments', JSON.stringify(allPayments));

  // Re-adjust balance
  const customersLocal = tenantGetItem('merchant_customers');
  if (customersLocal) {
    const customers = JSON.parse(customersLocal);
    const cIdx = customers.findIndex((c: any) => c.id === customerId);
    if (cIdx > -1) {
      customers[cIdx].balance += payment.amount;
      customers[cIdx].totalPaid -= payment.amount;
      tenantSetItem('merchant_customers', JSON.stringify(customers));
    }
  }

  // Also we need to re-distribute the debt. The simplest way is to fetch debts, sort by date, and re-apply payments.
  // Given complexity, let's just mark debts as OPEN again based on re-calculating logic or simply marking all OPEN then applying payments.
  const debtsLocal = tenantGetItem('merchant_debts');
  if (debtsLocal) {
    const allDebts = JSON.parse(debtsLocal);
    const cDebts = allDebts[customerId] || [];
    
    // Reset all debts
    cDebts.forEach((d: any) => {
      d.status = 'OPEN';
      d.remainingAmount = d.amount;
    });

    // Re-apply remaining payments
    let remainingPayments = cPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    cDebts.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    for (const d of cDebts) {
      if (remainingPayments <= 0) break;
      if (remainingPayments >= d.amount) {
        remainingPayments -= d.amount;
        d.remainingAmount = 0;
        d.status = 'PAID';
      } else {
        d.remainingAmount = d.amount - remainingPayments;
        remainingPayments = 0;
      }
    }
    allDebts[customerId] = cDebts;
    tenantSetItem('merchant_debts', JSON.stringify(allDebts));
  }
  
  window.dispatchEvent(new Event('merchant_data_updated'));
  addAuditEntry({ action: 'DELETE', entity: 'PAYMENT', entityId: paymentId, description: `حذف تسديد بقيمة ${payment.amount}` });
};

export const deleteDebt = (customerId: string, debtId: string) => {
  const debtsLocal = tenantGetItem('merchant_debts');
  if (!debtsLocal) return;
  const allDebts = JSON.parse(debtsLocal);
  const cDebts = allDebts[customerId] || [];
  
  const dIdx = cDebts.findIndex((d: any) => d.debtId === debtId);
  if (dIdx < 0) return;
  
  const debt = cDebts[dIdx];
  if (debt.remainingAmount !== debt.amount) {
    throw new Error('لا يمكن حذف دين تم تسديده جزئياً أو كلياً. احذف التسديد المرتبط أولاً.');
  }
  cDebts.splice(dIdx, 1);
  allDebts[customerId] = cDebts;
  tenantSetItem('merchant_debts', JSON.stringify(allDebts));

  // Re-adjust balance
  const customersLocal = tenantGetItem('merchant_customers');
  if (customersLocal) {
    const customers = JSON.parse(customersLocal);
    const cIdx = customers.findIndex((c: any) => c.id === customerId);
    if (cIdx > -1) {
      customers[cIdx].balance -= debt.amount;
      customers[cIdx].totalTaken -= debt.amount;
      tenantSetItem('merchant_customers', JSON.stringify(customers));
    }
  }

  // Re-apply payments to remaining debts
  const localPayments = tenantGetItem('merchant_payments');
  if (localPayments) {
    const allPayments = JSON.parse(localPayments);
    const cPayments = allPayments[customerId] || [];
    let remainingPayments = cPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
    
    cDebts.forEach((d: any) => {
      d.status = 'OPEN';
      d.remainingAmount = d.amount;
    });

    cDebts.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    for (const d of cDebts) {
      if (remainingPayments <= 0) break;
      if (remainingPayments >= d.amount) {
        remainingPayments -= d.amount;
        d.remainingAmount = 0;
        d.status = 'PAID';
      } else {
        d.remainingAmount = d.amount - remainingPayments;
        remainingPayments = 0;
      }
    }
    allDebts[customerId] = cDebts;
    tenantSetItem('merchant_debts', JSON.stringify(allDebts));
  }

  window.dispatchEvent(new Event('merchant_data_updated'));
  addAuditEntry({ action: 'DELETE', entity: 'DEBT', entityId: debtId, description: `حذف دين بقيمة ${debt.amount}` });
};

export const getPayments = (customerId: string): Payment[] => {
  const localPayments = tenantGetItem('merchant_payments');
  if (!localPayments) return [];
  const allPayments = JSON.parse(localPayments);
  return allPayments[customerId] || [];
};
