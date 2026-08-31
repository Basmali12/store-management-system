export interface Expense {
  expenseId: string;
  category: string;
  amount: number;
  createdAt: string;
  note?: string;
}

export const EXPENSE_CATEGORIES = [
  'إيجار',
  'كهرباء',
  'مولدة',
  'نقل',
  'رواتب',
  'صيانة',
  'إنترنت',
  'تنظيف',
  'أخرى'
];
