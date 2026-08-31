
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
  barcode?: string;
  size?: string;
  color?: string;
  weight?: string;
  unit?: string;
  expiry?: string;
  brand?: string;
  batchNumber?: string;
  serialNumber?: string;
  warranty?: string;
  status?: 'active' | 'inactive';
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
