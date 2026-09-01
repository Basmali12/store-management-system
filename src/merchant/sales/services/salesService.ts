import { getProducts, addStockMovement } from '../../inventory/services/inventoryService';
import { addDebt, getCustomers, getDebts, saveCustomers } from '../../debts/services/debtService';
import { Sale, SaleItem } from '../models/types';
import { tenantGetItem, tenantSetItem, snapshotTenantKeys } from '../../../shared/storage/tenantStorage';
import { createId } from '../../../shared/utils/id';
import { addAuditEntry } from '../../../shared/audit/auditService';
import { isValidCustomerPhone, normalizePhone } from '../../../shared/utils/phone';

interface CashCustomerInput {
  name: string;
  phone: string;
  address?: string;
}

interface SaleUpdateInput {
  items: Array<Pick<SaleItem, 'productId' | 'quantity' | 'unitPrice'>>;
  cashCustomer?: CashCustomerInput;
}

export const getSales = (): Sale[] => {
  const local = tenantGetItem('merchant_sales');
  return local ? JSON.parse(local) : [];
};

export const createSale = (
  saleType: 'CASH' | 'CREDIT',
  items: SaleItem[],
  customerId?: string,
  cashCustomerInput?: CashCustomerInput,
) => {
  if (!items.length) throw new Error('لا يمكن حفظ بيع فارغ');
  if (saleType === 'CREDIT' && !customerId) throw new Error('يجب تحديد الزبون للبيع الآجل');
  if (saleType === 'CREDIT' && !getCustomers().some(customer => customer.id === customerId)) throw new Error('الزبون غير موجود');
  const cashCustomer = saleType === 'CASH' ? {
    name: cashCustomerInput?.name.trim() || '',
    phone: normalizePhone(cashCustomerInput?.phone || ''),
    address: cashCustomerInput?.address?.trim() || undefined,
  } : undefined;
  if (saleType === 'CASH' && !cashCustomer?.name) throw new Error('أدخل اسم الزبون للبيع النقدي');
  if (saleType === 'CASH' && !isValidCustomerPhone(cashCustomer?.phone || '')) throw new Error('أدخل رقم هاتف صحيح للزبون');

  const products = getProducts();
  const saleId = createId('sale');
  const enrichedItems = items.map(item => {
    const product = products.find(candidate => candidate.productId === item.productId);
    if (!product) throw new Error(`المنتج غير موجود: ${item.productName}`);
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new Error(`كمية غير صالحة: ${item.productName}`);
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) throw new Error(`سعر بيع غير صالح: ${item.productName}`);
    if (product.quantity < item.quantity) throw new Error(`الكمية غير كافية للمنتج: ${item.productName}`);
    return { ...item, totalPrice: item.quantity * item.unitPrice, unitPurchasePrice: product.purchasePrice, returnedQuantity: 0 };
  });
  const total = enrichedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const newSale: Sale = { saleId, saleType, customerId, cashCustomer, items: enrichedItems, subtotal: total, total, createdAt: new Date().toISOString(), refundedTotal: 0, status: 'COMPLETED' };
  const rollback = snapshotTenantKeys(['merchant_products', 'merchant_stock_movements', 'merchant_customers', 'merchant_debts', 'merchant_sales', 'merchant_activity_log']);
  try {
    for (const item of enrichedItems) addStockMovement(item.productId, 'STOCK_OUT', item.quantity, 'عملية بيع');
    if (saleType === 'CREDIT' && customerId) {
      for (const item of enrichedItems) addDebt(customerId, { description: item.productName, quantity: item.quantity, amount: item.totalPrice, note: 'عملية بيع آجل', saleId });
    }
    tenantSetItem('merchant_sales', JSON.stringify([newSale, ...getSales()]));
    addAuditEntry({ action: 'CREATE', entity: 'SALE', entityId: saleId, description: `بيع ${saleType === 'CREDIT' ? 'آجل' : 'نقدي'} بقيمة ${total}` });
    return newSale;
  } catch (error) {
    rollback();
    throw error;
  }
};

export const deleteSale = (saleId: string) => {
  const sales = getSales();
  const saleIndex = sales.findIndex(sale => sale.saleId === saleId);
  if (saleIndex < 0) return;
  const sale = sales[saleIndex];
  if ((sale.refundedTotal || 0) > 0) throw new Error('لا يمكن حذف بيع يحتوي على مرتجع');
  const linkedDebts = sale.saleType === 'CREDIT' && sale.customerId ? getDebts(sale.customerId).filter(debt => debt.saleId === saleId) : [];
  if (sale.saleType === 'CREDIT') {
    if (linkedDebts.length !== sale.items.length) throw new Error('لا يمكن حذف بيع آجل قديم غير مرتبط بمعرّف آمن');
    if (linkedDebts.some(debt => debt.remainingAmount !== debt.amount)) throw new Error('لا يمكن حذف بيع آجل تم تسديده جزئياً أو كلياً');
  }
  const rollback = snapshotTenantKeys(['merchant_products', 'merchant_stock_movements', 'merchant_customers', 'merchant_debts', 'merchant_sales', 'merchant_activity_log']);
  try {
    for (const item of sale.items) addStockMovement(item.productId, 'STOCK_IN', item.quantity, 'إلغاء عملية بيع');
    if (sale.saleType === 'CREDIT' && sale.customerId) {
      const allDebts = JSON.parse(tenantGetItem('merchant_debts') || '{}');
      allDebts[sale.customerId] = (allDebts[sale.customerId] || []).filter((debt: any) => debt.saleId !== saleId);
      tenantSetItem('merchant_debts', JSON.stringify(allDebts));
      const customers = getCustomers();
      const customer = customers.find(candidate => candidate.id === sale.customerId);
      if (!customer) throw new Error('الزبون غير موجود');
      customer.balance -= sale.total;
      customer.totalTaken -= sale.total;
      saveCustomers(customers);
    }
    sales.splice(saleIndex, 1);
    tenantSetItem('merchant_sales', JSON.stringify(sales));
    addAuditEntry({ action: 'DELETE', entity: 'SALE', entityId: saleId, description: `إلغاء بيع بقيمة ${sale.total}` });
  } catch (error) {
    rollback();
    throw error;
  }
};

export const updateSale = (saleId: string, input: SaleUpdateInput) => {
  const sales = getSales();
  const sale = sales.find(candidate => candidate.saleId === saleId);
  if (!sale) throw new Error('عملية البيع غير موجودة');
  if ((sale.refundedTotal || 0) > 0) throw new Error('لا يمكن تعديل بيع يحتوي على مرتجع');
  if (input.items.length !== sale.items.length) throw new Error('تعديل المنتجات غير مسموح من هذه الشاشة');

  const products = getProducts();
  const updatedItems = sale.items.map(oldItem => {
    const update = input.items.find(candidate => candidate.productId === oldItem.productId);
    const product = products.find(candidate => candidate.productId === oldItem.productId);
    if (!update || !product) throw new Error(`المنتج غير موجود: ${oldItem.productName}`);
    if (!Number.isInteger(update.quantity) || update.quantity <= 0) throw new Error(`كمية غير صالحة: ${oldItem.productName}`);
    if (!Number.isFinite(update.unitPrice) || update.unitPrice < 0) throw new Error(`سعر بيع غير صالح: ${oldItem.productName}`);
    const extraRequired = update.quantity - oldItem.quantity;
    if (extraRequired > product.quantity) throw new Error(`الكمية غير كافية للمنتج: ${oldItem.productName}`);
    return { ...oldItem, quantity: update.quantity, unitPrice: update.unitPrice, totalPrice: update.quantity * update.unitPrice };
  });

  const cashCustomer = sale.saleType === 'CASH' ? {
    name: input.cashCustomer?.name.trim() || '',
    phone: normalizePhone(input.cashCustomer?.phone || ''),
    address: input.cashCustomer?.address?.trim() || undefined,
  } : undefined;
  if (sale.saleType === 'CASH' && !cashCustomer?.name) throw new Error('أدخل اسم الزبون للبيع النقدي');
  if (sale.saleType === 'CASH' && !isValidCustomerPhone(cashCustomer?.phone || '')) throw new Error('أدخل رقم هاتف صحيح للزبون');

  const linkedDebts = sale.saleType === 'CREDIT' && sale.customerId
    ? getDebts(sale.customerId).filter(debt => debt.saleId === saleId)
    : [];
  if (sale.saleType === 'CREDIT') {
    if (linkedDebts.length !== sale.items.length) throw new Error('لا يمكن تعديل بيع آجل قديم غير مرتبط بمعرّف آمن');
    if (linkedDebts.some(debt => debt.remainingAmount !== debt.amount)) throw new Error('لا يمكن تعديل بيع آجل تم تسديده جزئياً أو كلياً');
  }

  const newTotal = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalDifference = newTotal - sale.total;
  const rollback = snapshotTenantKeys(['merchant_products', 'merchant_stock_movements', 'merchant_customers', 'merchant_debts', 'merchant_sales', 'merchant_activity_log']);
  try {
    for (const updatedItem of updatedItems) {
      const oldItem = sale.items.find(item => item.productId === updatedItem.productId)!;
      const difference = updatedItem.quantity - oldItem.quantity;
      if (difference > 0) addStockMovement(updatedItem.productId, 'STOCK_OUT', difference, 'تعديل عملية بيع');
      if (difference < 0) addStockMovement(updatedItem.productId, 'STOCK_IN', Math.abs(difference), 'تعديل عملية بيع');
    }

    if (sale.saleType === 'CREDIT' && sale.customerId) {
      const allDebts = JSON.parse(tenantGetItem('merchant_debts') || '{}');
      const customerDebts = allDebts[sale.customerId] || [];
      const unusedDebtIds = new Set(linkedDebts.map(debt => debt.debtId));
      for (const updatedItem of updatedItems) {
        const oldItem = sale.items.find(item => item.productId === updatedItem.productId)!;
        const debt = customerDebts.find((candidate: any) =>
          unusedDebtIds.has(candidate.debtId)
          && candidate.saleId === saleId
          && candidate.description === oldItem.productName
          && candidate.quantity === oldItem.quantity
          && candidate.amount === oldItem.totalPrice,
        );
        if (!debt) throw new Error(`تعذر ربط دين المنتج بأمان: ${oldItem.productName}`);
        unusedDebtIds.delete(debt.debtId);
        debt.quantity = updatedItem.quantity;
        debt.amount = updatedItem.totalPrice;
        debt.remainingAmount = updatedItem.totalPrice;
      }
      tenantSetItem('merchant_debts', JSON.stringify(allDebts));
      const customers = getCustomers();
      const customer = customers.find(candidate => candidate.id === sale.customerId);
      if (!customer) throw new Error('الزبون غير موجود');
      customer.balance += totalDifference;
      customer.totalTaken += totalDifference;
      saveCustomers(customers);
    }

    sale.items = updatedItems;
    sale.cashCustomer = cashCustomer;
    sale.subtotal = newTotal;
    sale.total = newTotal;
    tenantSetItem('merchant_sales', JSON.stringify(sales));
    addAuditEntry({ action: 'UPDATE', entity: 'SALE', entityId: saleId, description: `تعديل بيع من ${newTotal - totalDifference} إلى ${newTotal}` });
    return sale;
  } catch (error) {
    rollback();
    throw error;
  }
};

export const refundSale = (saleId: string, quantities: Record<string, number>) => {
  const sales = getSales();
  const sale = sales.find(candidate => candidate.saleId === saleId);
  if (!sale) throw new Error('عملية البيع غير موجودة');
  const refundItems = sale.items.map(item => {
    const quantity = quantities[item.productId] || 0;
    const available = item.quantity - (item.returnedQuantity || 0);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > available) throw new Error(`كمية المرتجع غير صالحة: ${item.productName}`);
    return { item, quantity, amount: quantity * item.unitPrice };
  }).filter(entry => entry.quantity > 0);
  if (!refundItems.length) throw new Error('حدد كمية مرتجع واحدة على الأقل');
  if (sale.saleType === 'CREDIT' && sale.customerId) {
    const debts = getDebts(sale.customerId).filter(debt => debt.saleId === saleId);
    for (const entry of refundItems) {
      const debt = debts.find(candidate => candidate.description === entry.item.productName);
      if (!debt || debt.remainingAmount < entry.amount) throw new Error(`لا يمكن إرجاع ${entry.item.productName} بعد تسديد قيمته`);
    }
  }
  const rollback = snapshotTenantKeys(['merchant_products', 'merchant_stock_movements', 'merchant_customers', 'merchant_debts', 'merchant_sales', 'merchant_activity_log']);
  try {
    for (const entry of refundItems) addStockMovement(entry.item.productId, 'STOCK_IN', entry.quantity, 'مرتجع مبيعات');
    const refundTotal = refundItems.reduce((sum, entry) => sum + entry.amount, 0);
    for (const entry of refundItems) entry.item.returnedQuantity = (entry.item.returnedQuantity || 0) + entry.quantity;
    sale.refundedTotal = (sale.refundedTotal || 0) + refundTotal;
    sale.status = sale.refundedTotal === sale.total ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    if (sale.saleType === 'CREDIT' && sale.customerId) {
      const allDebts = JSON.parse(tenantGetItem('merchant_debts') || '{}');
      const customerDebts = allDebts[sale.customerId] || [];
      for (const entry of refundItems) {
        const debt = customerDebts.find((candidate: any) => candidate.saleId === saleId && candidate.description === entry.item.productName);
        debt.amount -= entry.amount;
        debt.remainingAmount -= entry.amount;
        debt.quantity -= entry.quantity;
      }
      allDebts[sale.customerId] = customerDebts.filter((debt: any) => debt.amount > 0);
      tenantSetItem('merchant_debts', JSON.stringify(allDebts));
      const customers = getCustomers();
      const customer = customers.find(candidate => candidate.id === sale.customerId)!;
      customer.balance -= refundTotal;
      customer.totalTaken -= refundTotal;
      saveCustomers(customers);
    }
    tenantSetItem('merchant_sales', JSON.stringify(sales));
    addAuditEntry({ action: 'UPDATE', entity: 'SALE', entityId: saleId, description: `مرتجع مبيعات بقيمة ${refundTotal}` });
    return refundTotal;
  } catch (error) {
    rollback();
    throw error;
  }
};
