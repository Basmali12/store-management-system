export const generateDebtReminder = (customerName: string, storeName: string, remainingAmount: number, date: string) => {
  return `مرحبًا ${customerName}،\nنذكّركم بأن المبلغ المتبقي في حسابكم لدى متجر ${storeName} هو ${remainingAmount.toLocaleString()} د.ع.\nالتاريخ: ${date}\nمع الشكر.`;
};

export const generatePaymentReceipt = (customerName: string, storeName: string, paymentAmount: number, balanceBefore: number, balanceAfter: number, date: string) => {
  return `مرحبًا ${customerName}،\nتم تسجيل تسديد بقيمة ${paymentAmount.toLocaleString()} د.ع لدى متجر ${storeName}.\nالرصيد السابق: ${balanceBefore.toLocaleString()} د.ع\nالمتبقي بعد التسديد: ${balanceAfter.toLocaleString()} د.ع\nالتاريخ: ${date}\nشكرًا لتعاملكم معنا.`;
};

export const generateAccountSummary = (customerName: string, storeName: string, totalTaken: number, totalPaid: number, remaining: number) => {
  return `ملخص حساب ${customerName} لدى متجر ${storeName}:\n\nإجمالي الأخذ: ${totalTaken.toLocaleString()} د.ع\nإجمالي التسديد: ${totalPaid.toLocaleString()} د.ع\nالمتبقي: ${remaining.toLocaleString()} د.ع`;
};
