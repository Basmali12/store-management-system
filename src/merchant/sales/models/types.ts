export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  originalUnitPrice?: number;
  unitPurchasePrice?: number;
  totalPrice: number;
  returnedQuantity?: number;
}

export interface Sale {
  saleId: string;
  customerId?: string;
  saleType: 'CASH' | 'CREDIT';
  items: SaleItem[];
  subtotal: number;
  total: number;
  createdAt: string;
  refundedTotal?: number;
  status?: 'COMPLETED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
}
