import { Supplier, SupplierPayment } from '../models/types';
import { getPurchases } from '../../purchases/services/purchasesService';
import { Purchase } from '../../purchases/models/types';
import { tenantGetItem, tenantSetItem } from '../../../shared/storage/tenantStorage';
import { createId } from '../../../shared/utils/id';
import { addAuditEntry } from '../../../shared/audit/auditService';

export const getSuppliers = (): Supplier[] => {
  const local = tenantGetItem('merchant_suppliers_new');
  return local ? JSON.parse(local) : [];
};

export const saveSuppliers = (suppliers: Supplier[]) => {
  tenantSetItem('merchant_suppliers_new', JSON.stringify(suppliers));
};

export const getSupplierById = (supplierId: string): Supplier | undefined => {
  return getSuppliers().find(s => s.supplierId === supplierId);
};

export const addSupplier = (name: string, phone: string, notes?: string): Supplier => {
  const suppliers = getSuppliers();
  const newSupplier: Supplier = {
    supplierId: createId('sup'),
    name,
    phone,
    notes,
    createdAt: new Date().toISOString(),
    balance: 0
  };
  saveSuppliers([newSupplier, ...suppliers]);
  addAuditEntry({ action: 'CREATE', entity: 'SUPPLIER', entityId: newSupplier.supplierId, description: `إضافة مورد: ${name}` });
  return newSupplier;
};

export const getSupplierPayments = (supplierId: string): SupplierPayment[] => {
  const local = tenantGetItem('merchant_supplier_payments');
  const payments: SupplierPayment[] = local ? JSON.parse(local) : [];
  return payments.filter(p => p.supplierId === supplierId);
};

export const addSupplierPayment = (supplierId: string, amount: number, note?: string): SupplierPayment => {
  const suppliers = getSuppliers();
  const supplierIndex = suppliers.findIndex(s => s.supplierId === supplierId);
  if (supplierIndex === -1) throw new Error('المورد غير موجود');

  const supplier = suppliers[supplierIndex];
  const balanceBefore = supplier.balance;
  
  if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');
  if (amount > balanceBefore) throw new Error('مبلغ التسديد أكبر من رصيد المورد');
  
  const balanceAfter = balanceBefore - amount;
  
  // Create payment record
  const newPayment: SupplierPayment = {
    supplierPaymentId: createId('spay'),
    supplierId,
    amount,
    balanceBefore,
    balanceAfter,
    createdAt: new Date().toISOString(),
    note
  };

  const localPayments = tenantGetItem('merchant_supplier_payments');
  const payments = localPayments ? JSON.parse(localPayments) : [];
  tenantSetItem('merchant_supplier_payments', JSON.stringify([newPayment, ...payments]));

  // Update supplier balance
  suppliers[supplierIndex].balance = balanceAfter;
  saveSuppliers(suppliers);

  // Apply FIFO logic to OPEN credit purchases
  const allPurchases = getPurchases();
  let remainingPayment = amount;

  // Process from oldest to newest (purchases are stored newest first)
  for (let i = allPurchases.length - 1; i >= 0; i--) {
    const purchase = allPurchases[i];
    if (
      purchase.supplierId === supplierId && 
      purchase.paymentType === 'CREDIT' && 
      purchase.status !== 'PAID' &&
      remainingPayment > 0
    ) {
      const currentRemaining = purchase.remainingAmount ?? purchase.total;
      
      if (remainingPayment >= currentRemaining) {
        remainingPayment -= currentRemaining;
        allPurchases[i] = { ...purchase, remainingAmount: 0, status: 'PAID' as const };
      } else {
        const newRemaining = currentRemaining - remainingPayment;
        remainingPayment = 0;
        allPurchases[i] = { ...purchase, remainingAmount: newRemaining };
      }
    }
  }

  tenantSetItem('merchant_purchases', JSON.stringify(allPurchases));
  addAuditEntry({ action: 'PAYMENT', entity: 'SUPPLIER', entityId: supplierId, description: `تسديد مورد بقيمة ${amount}` });

  return newPayment;
};

export const deleteSupplierPayment = (supplierId: string, paymentId: string) => {
  const allPayments: SupplierPayment[] = JSON.parse(tenantGetItem('merchant_supplier_payments') || '[]');
  const payment = allPayments.find(candidate => candidate.supplierPaymentId === paymentId && candidate.supplierId === supplierId);
  if (!payment) return;
  const remainingPayments = allPayments.filter(candidate => candidate.supplierPaymentId !== paymentId);
  const purchases = getPurchases();
  const supplierPurchases = purchases.filter(purchase => purchase.supplierId === supplierId && purchase.paymentType === 'CREDIT');
  for (const purchase of supplierPurchases) {
    purchase.remainingAmount = purchase.total - (purchase.returnedTotal || 0);
    purchase.status = purchase.remainingAmount === 0 ? 'PAID' : 'OPEN';
  }
  let amountToApply = remainingPayments.filter(candidate => candidate.supplierId === supplierId).reduce((sum, candidate) => sum + candidate.amount, 0);
  for (const purchase of [...supplierPurchases].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())) {
    const applied = Math.min(amountToApply, purchase.remainingAmount || 0);
    purchase.remainingAmount = (purchase.remainingAmount || 0) - applied;
    if (purchase.remainingAmount === 0) purchase.status = 'PAID';
    amountToApply -= applied;
  }
  const supplierList = getSuppliers();
  const supplier = supplierList.find(candidate => candidate.supplierId === supplierId);
  if (supplier) supplier.balance = supplierPurchases.reduce((sum, purchase) => sum + (purchase.remainingAmount || 0), 0);
  tenantSetItem('merchant_supplier_payments', JSON.stringify(remainingPayments));
  tenantSetItem('merchant_purchases', JSON.stringify(purchases));
  saveSuppliers(supplierList);
  addAuditEntry({ action: 'DELETE', entity: 'SUPPLIER_PAYMENT', entityId: paymentId, description: `حذف تسديد مورد بقيمة ${payment.amount}` });
};
