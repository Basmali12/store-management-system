import { addStockMovement, updateProduct, getProducts } from '../../inventory/services/inventoryService';
import { getSuppliers, saveSuppliers } from '../../suppliers/services/supplierService';
import { Purchase, PurchaseItem } from '../models/types';
import { tenantGetItem, tenantSetItem, snapshotTenantKeys } from '../../../shared/storage/tenantStorage';
import { createId } from '../../../shared/utils/id';
import { addAuditEntry } from '../../../shared/audit/auditService';

export const getPurchases = (): Purchase[] => {
  const local = tenantGetItem('merchant_purchases');
  return local ? JSON.parse(local) : [];
};

export const createPurchase = (
  paymentType: 'CASH' | 'CREDIT',
  items: PurchaseItem[],
  supplierId?: string
) => {
  if (items.length === 0) throw new Error('لا يمكن حفظ شراء فارغ');
  if (paymentType === 'CREDIT' && !supplierId) {
    throw new Error('يجب تحديد المورد للشراء الآجل');
  }
  const products = getProducts();
  for (const item of items) {
    if (!products.some(product => product.productId === item.productId)) throw new Error(`المنتج غير موجود: ${item.productName}`);
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) throw new Error(`كمية غير صالحة: ${item.productName}`);
    if (!Number.isFinite(item.unitPurchasePrice) || item.unitPurchasePrice < 0) throw new Error(`سعر شراء غير صالح: ${item.productName}`);
    item.totalPrice = item.quantity * item.unitPurchasePrice;
  }

  items = items.map(item => ({ ...item, returnedQuantity: item.returnedQuantity || 0 }));
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const rollback = snapshotTenantKeys(['merchant_products', 'merchant_stock_movements', 'merchant_suppliers_new', 'merchant_purchases', 'merchant_activity_log']);
  try {
    for (const item of items) {
      addStockMovement(item.productId, 'STOCK_IN', item.quantity, 'عملية شراء');
      updateProduct(item.productId, { purchasePrice: item.unitPurchasePrice });
    }

    if (paymentType === 'CREDIT' && supplierId) {
      const suppliers = getSuppliers();
      const supIndex = suppliers.findIndex(s => s.supplierId === supplierId);
      if (supIndex === -1) throw new Error('المورد غير موجود');
      suppliers[supIndex].balance += total;
      saveSuppliers(suppliers);
    }

  const newPurchase: Purchase = {
    purchaseId: createId('pur'),
    paymentType,
    supplierId,
    items,
    subtotal: total,
    total: total,
    ...(paymentType === 'CREDIT' && {
      remainingAmount: total,
      status: 'OPEN'
    }),
    createdAt: new Date().toISOString()
  };

    const purchases = getPurchases();
    tenantSetItem('merchant_purchases', JSON.stringify([newPurchase, ...purchases]));
    addAuditEntry({ action: 'CREATE', entity: 'PURCHASE', entityId: newPurchase.purchaseId, description: `شراء ${paymentType === 'CREDIT' ? 'آجل' : 'نقدي'} بقيمة ${total}` });
    return newPurchase;
  } catch (error) {
    rollback();
    throw error;
  }
};

export const returnPurchase = (purchaseId: string, quantities: Record<string, number>) => {
  const purchases = getPurchases();
  const purchase = purchases.find(candidate => candidate.purchaseId === purchaseId);
  if (!purchase) throw new Error('عملية الشراء غير موجودة');
  const products = getProducts();
  const returnedItems = purchase.items.map(item => {
    const quantity = quantities[item.productId] || 0;
    const available = item.quantity - (item.returnedQuantity || 0);
    const product = products.find(candidate => candidate.productId === item.productId);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > available) throw new Error(`كمية المرتجع غير صالحة: ${item.productName}`);
    if (quantity > 0 && (!product || product.quantity < quantity)) throw new Error(`مخزون ${item.productName} لا يكفي للمرتجع`);
    return { item, quantity, amount: quantity * item.unitPurchasePrice };
  }).filter(entry => entry.quantity > 0);
  if (!returnedItems.length) throw new Error('حدد كمية مرتجع واحدة على الأقل');
  const returnedTotal = returnedItems.reduce((sum, entry) => sum + entry.amount, 0);
  if (purchase.paymentType === 'CREDIT' && returnedTotal > (purchase.remainingAmount ?? purchase.total)) throw new Error('لا يمكن إرجاع جزء تم تسديده للمورد');
  const rollback = snapshotTenantKeys(['merchant_products', 'merchant_stock_movements', 'merchant_suppliers_new', 'merchant_purchases', 'merchant_activity_log']);
  try {
    for (const entry of returnedItems) {
      addStockMovement(entry.item.productId, 'STOCK_OUT', entry.quantity, 'مرتجع مشتريات');
      entry.item.returnedQuantity = (entry.item.returnedQuantity || 0) + entry.quantity;
    }
    purchase.returnedTotal = (purchase.returnedTotal || 0) + returnedTotal;
    purchase.returnStatus = purchase.returnedTotal === purchase.total ? 'RETURNED' : 'PARTIAL';
    if (purchase.paymentType === 'CREDIT' && purchase.supplierId) {
      purchase.remainingAmount = (purchase.remainingAmount ?? purchase.total) - returnedTotal;
      if (purchase.remainingAmount === 0) purchase.status = 'PAID';
      const supplierList = getSuppliers();
      const supplier = supplierList.find(candidate => candidate.supplierId === purchase.supplierId);
      if (!supplier) throw new Error('المورد غير موجود');
      supplier.balance -= returnedTotal;
      saveSuppliers(supplierList);
    }
    tenantSetItem('merchant_purchases', JSON.stringify(purchases));
    addAuditEntry({ action: 'UPDATE', entity: 'PURCHASE', entityId: purchaseId, description: `مرتجع مشتريات بقيمة ${returnedTotal}` });
    return returnedTotal;
  } catch (error) {
    rollback();
    throw error;
  }
};

export const deletePurchase = (purchaseId: string) => {
  const purchases = getPurchases();
  const purIdx = purchases.findIndex(p => p.purchaseId === purchaseId);
  if (purIdx < 0) return;
  const purchase = purchases[purIdx];
  if ((purchase.returnedTotal || 0) > 0) throw new Error('لا يمكن إلغاء شراء يحتوي على مرتجع');
  if (purchase.paymentType === 'CREDIT' && (purchase.remainingAmount ?? purchase.total) !== purchase.total) {
    throw new Error('لا يمكن إلغاء شراء تم تسديده جزئياً أو كلياً. احذف التسديد أولاً.');
  }
  const products = getProducts();
  for (const item of purchase.items) {
    const product = products.find(p => p.productId === item.productId);
    if (!product || product.quantity < item.quantity) {
      throw new Error(`لا يمكن إلغاء الشراء لأن كمية ${item.productName} تم بيعها أو صرفها`);
    }
  }

  const rollback = snapshotTenantKeys(['merchant_products', 'merchant_stock_movements', 'merchant_suppliers_new', 'merchant_purchases', 'merchant_activity_log']);
  try {

  // 1. Subtract items from stock
  for (const item of purchase.items) {
    addStockMovement(item.productId, 'STOCK_OUT', item.quantity, 'إلغاء عملية شراء');
  }

  // 2. Adjust supplier balance if credit
  if (purchase.paymentType === 'CREDIT' && purchase.supplierId) {
    const suppliers = getSuppliers();
    const supIndex = suppliers.findIndex(s => s.supplierId === purchase.supplierId);
    if (supIndex !== -1) {
      suppliers[supIndex].balance -= purchase.total;
      saveSuppliers(suppliers);
    }
  }

  // 3. Remove purchase
  purchases.splice(purIdx, 1);
    tenantSetItem('merchant_purchases', JSON.stringify(purchases));
    addAuditEntry({ action: 'DELETE', entity: 'PURCHASE', entityId: purchaseId, description: `إلغاء شراء بقيمة ${purchase.total}` });
  } catch (error) {
    rollback();
    throw error;
  }
};
