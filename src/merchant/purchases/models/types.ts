export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPurchasePrice: number;
  totalPrice: number;
  returnedQuantity?: number;
}

export interface Purchase {
  purchaseId: string;
  supplierId?: string;
  paymentType: 'CASH' | 'CREDIT';
  items: PurchaseItem[];
  subtotal: number;
  total: number;
  remainingAmount?: number;
  status?: 'OPEN' | 'PAID';
  createdAt: string;
  returnedTotal?: number;
  returnStatus?: 'PARTIAL' | 'RETURNED';
}
