export interface Supplier {
  supplierId: string;
  name: string;
  phone: string;
  notes?: string;
  createdAt: string;
  balance: number;
}

export interface SupplierPayment {
  supplierPaymentId: string;
  supplierId: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  note?: string;
}
