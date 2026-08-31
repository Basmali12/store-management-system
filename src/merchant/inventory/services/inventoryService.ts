import { mockProducts } from '../../../data/mock/merchant/mockData';
import { Product, StockMovement } from '../models/types';
import { tenantGetItem, tenantSetItem } from '../../../shared/storage/tenantStorage';
import { createId } from '../../../shared/utils/id';
import { addAuditEntry } from '../../../shared/audit/auditService';

export const getProducts = (): Product[] => {
  const local = tenantGetItem('merchant_products');
  if (local) return JSON.parse(local);
  
  const mapped: Product[] = mockProducts.map(p => ({
    productId: p.id,
    name: p.name,
    category: p.category,
    purchasePrice: p.purchasePrice,
    salePrice: p.salePrice,
    quantity: p.quantity,
    lowStockLimit: p.lowStockThreshold,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  tenantSetItem('merchant_products', JSON.stringify(mapped));
  return mapped;
};

export const saveProducts = (products: Product[]) => {
  tenantSetItem('merchant_products', JSON.stringify(products));
};

export const canDeleteProduct = (productId: string): boolean => {
  // Check sales
  const localSales = tenantGetItem('merchant_sales');
  if (localSales) {
    const sales = JSON.parse(localSales);
    for (const sale of sales) {
      if (sale.items && sale.items.some((i: any) => i.productId === productId)) {
        return false;
      }
    }
  }

  // Check purchases
  const localPurchases = tenantGetItem('merchant_purchases');
  if (localPurchases) {
    const purchases = JSON.parse(localPurchases);
    for (const purchase of purchases) {
      if (purchase.items && purchase.items.some((i: any) => i.productId === productId)) {
        return false;
      }
    }
  }

  // Check stock movements (except initial stock-in)
  const localMovements = tenantGetItem('merchant_stock_movements');
  if (localMovements) {
    const allMovements = JSON.parse(localMovements);
    const pMovements = allMovements[productId] || [];
    if (pMovements.length > 1) { // 1 might be the initial addProduct movement
      return false;
    }
  }

  return true;
};

export const deleteOrDisableProduct = (productId: string) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.productId === productId);
  if (idx < 0) return;

  if (canDeleteProduct(productId)) {
    // Hard delete
    products.splice(idx, 1);
  } else {
    // Soft disable
    products[idx].status = 'inactive';
  }
  saveProducts(products);
  addAuditEntry({ action: canDeleteProduct(productId) ? 'DELETE' : 'UPDATE', entity: 'PRODUCT', entityId: productId, description: canDeleteProduct(productId) ? 'حذف منتج' : 'تعطيل منتج مرتبط بعمليات' });
};

export const getStockMovements = (productId: string): StockMovement[] => {
  const local = tenantGetItem('merchant_stock_movements');
  const allMovements: Record<string, StockMovement[]> = local ? JSON.parse(local) : {};
  return allMovements[productId] || [];
};

export const addStockMovement = (productId: string, type: 'STOCK_IN' | 'STOCK_OUT' | 'MANUAL_ADJUSTMENT', quantity: number, note: string = '') => {
  const products = getProducts();
  const productIndex = products.findIndex(p => p.productId === productId);
  if (productIndex < 0) throw new Error('المنتج غير موجود');
  if (!Number.isFinite(quantity) || quantity <= 0 && type !== 'MANUAL_ADJUSTMENT') throw new Error('الكمية غير صالحة');
  const product = products[productIndex];
  
  const quantityBefore = product.quantity;
  let quantityAfter = quantityBefore;
  
  if (type === 'STOCK_IN') {
    quantityAfter += quantity;
  } else if (type === 'STOCK_OUT') {
    quantityAfter -= quantity;
  } else {
    quantityAfter += quantity; // Allows passing negative for adjustment
  }
  if (quantityAfter < 0) throw new Error(`لا يمكن أن يصبح مخزون ${product.name} سالباً`);
  
  products[productIndex].quantity = quantityAfter;
  products[productIndex].updatedAt = new Date().toISOString();
  saveProducts(products);

  const newMovement: StockMovement = {
    stockMovementId: createId('sm'),
    productId,
    type,
    quantity,
    quantityBefore,
    quantityAfter,
    createdAt: new Date().toISOString(),
    note
  };

  const local = tenantGetItem('merchant_stock_movements');
  const allMovements: Record<string, StockMovement[]> = local ? JSON.parse(local) : {};
  if (!allMovements[productId]) allMovements[productId] = [];
  allMovements[productId] = [newMovement, ...allMovements[productId]];
  tenantSetItem('merchant_stock_movements', JSON.stringify(allMovements));
};

export const addProduct = (product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>) => {
  if (!product.name.trim()) throw new Error('اسم المنتج مطلوب');
  if (![product.purchasePrice, product.salePrice, product.quantity, product.lowStockLimit].every(Number.isFinite)) throw new Error('بيانات المنتج الرقمية غير صالحة');
  if (product.purchasePrice < 0 || product.salePrice < 0 || product.quantity < 0 || product.lowStockLimit < 0) throw new Error('لا يمكن إدخال قيم سالبة للمنتج');
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    productId: createId('p'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveProducts([newProduct, ...products]);

  if (newProduct.quantity > 0) {
    const local = tenantGetItem('merchant_stock_movements');
    const allMovements: Record<string, StockMovement[]> = local ? JSON.parse(local) : {};
    allMovements[newProduct.productId] = [{
      stockMovementId: createId('sm'),
      productId: newProduct.productId,
      type: 'STOCK_IN',
      quantity: newProduct.quantity,
      quantityBefore: 0,
      quantityAfter: newProduct.quantity,
      createdAt: new Date().toISOString(),
      note: 'رصيد افتتاحي'
    }];
    tenantSetItem('merchant_stock_movements', JSON.stringify(allMovements));
  }
  addAuditEntry({ action: 'CREATE', entity: 'PRODUCT', entityId: newProduct.productId, description: `إضافة منتج: ${newProduct.name}` });
  return newProduct;
};

export const updateProduct = (productId: string, data: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt' | 'quantity'>>) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.productId === productId);
  if (idx < 0) return;
  if ((data.purchasePrice !== undefined && data.purchasePrice < 0) || (data.salePrice !== undefined && data.salePrice < 0) || (data.lowStockLimit !== undefined && data.lowStockLimit < 0)) throw new Error('لا يمكن إدخال قيم سالبة للمنتج');
  products[idx] = {
    ...products[idx],
    ...data,
    updatedAt: new Date().toISOString()
  };
  saveProducts(products);
  addAuditEntry({ action: 'UPDATE', entity: 'PRODUCT', entityId: productId, description: `تعديل منتج: ${products[idx].name}` });
};

export const getLowStockProducts = (): Product[] => {
  return getProducts().filter(p => p.quantity <= p.lowStockLimit);
};
