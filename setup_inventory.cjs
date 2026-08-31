const fs = require('fs');

fs.mkdirSync('src/merchant/inventory/models', { recursive: true });
fs.mkdirSync('src/merchant/inventory/services', { recursive: true });

// Models
fs.writeFileSync('src/merchant/inventory/models/types.ts', `
export interface Product {
  productId: string;
  name: string;
  category: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  lowStockLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  stockMovementId: string;
  productId: string;
  type: 'STOCK_IN' | 'STOCK_OUT' | 'MANUAL_ADJUSTMENT';
  quantity: number; // For manual, can be positive/negative depending on intent (we will use positive/negative based on button)
  quantityBefore: number;
  quantityAfter: number;
  createdAt: string;
  note: string;
}
`);

// Services
fs.writeFileSync('src/merchant/inventory/services/inventoryService.ts', `
import { mockProducts } from '../../../data/mock/merchant/mockData';
import { Product, StockMovement } from '../models/types';

export const getProducts = (): Product[] => {
  const local = localStorage.getItem('merchant_products');
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
  localStorage.setItem('merchant_products', JSON.stringify(mapped));
  return mapped;
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem('merchant_products', JSON.stringify(products));
};

export const getStockMovements = (productId: string): StockMovement[] => {
  const local = localStorage.getItem('merchant_stock_movements');
  const allMovements: Record<string, StockMovement[]> = local ? JSON.parse(local) : {};
  return allMovements[productId] || [];
};

export const addStockMovement = (productId: string, type: 'STOCK_IN' | 'STOCK_OUT' | 'MANUAL_ADJUSTMENT', quantity: number, note: string = '') => {
  const products = getProducts();
  const productIndex = products.findIndex(p => p.productId === productId);
  if (productIndex < 0) return;

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

  products[productIndex].quantity = quantityAfter;
  products[productIndex].updatedAt = new Date().toISOString();
  saveProducts(products);

  const newMovement: StockMovement = {
    stockMovementId: 'sm_' + Date.now().toString(),
    productId,
    type,
    quantity,
    quantityBefore,
    quantityAfter,
    createdAt: new Date().toISOString(),
    note
  };

  const local = localStorage.getItem('merchant_stock_movements');
  const allMovements: Record<string, StockMovement[]> = local ? JSON.parse(local) : {};
  if (!allMovements[productId]) allMovements[productId] = [];
  allMovements[productId] = [newMovement, ...allMovements[productId]];
  localStorage.setItem('merchant_stock_movements', JSON.stringify(allMovements));
};

export const addProduct = (product: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>) => {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    productId: 'p_' + Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  saveProducts([newProduct, ...products]);

  if (newProduct.quantity > 0) {
    const local = localStorage.getItem('merchant_stock_movements');
    const allMovements: Record<string, StockMovement[]> = local ? JSON.parse(local) : {};
    allMovements[newProduct.productId] = [{
      stockMovementId: 'sm_' + Date.now().toString(),
      productId: newProduct.productId,
      type: 'STOCK_IN',
      quantity: newProduct.quantity,
      quantityBefore: 0,
      quantityAfter: newProduct.quantity,
      createdAt: new Date().toISOString(),
      note: 'رصيد افتتاحي'
    }];
    localStorage.setItem('merchant_stock_movements', JSON.stringify(allMovements));
  }
};

export const updateProduct = (productId: string, data: Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt' | 'quantity'>>) => {
  const products = getProducts();
  const idx = products.findIndex(p => p.productId === productId);
  if (idx < 0) return;

  products[idx] = {
    ...products[idx],
    ...data,
    updatedAt: new Date().toISOString()
  };
  saveProducts(products);
};

export const getLowStockProducts = (): Product[] => {
  return getProducts().filter(p => p.quantity <= p.lowStockLimit);
};
`);

console.log('Services updated.');
