const fs = require('fs');
let code = fs.readFileSync('src/merchant/debts/services/debtService.ts', 'utf8');

code = code.replace(
  "status: 'OPEN' | 'PAID';\n  note?: string;",
  "status: 'OPEN' | 'PAID';\n  note?: string;\n  dueDate?: string;"
);

code = code.replace(
  "export const addDebt = (customerId: string, debtData: Omit<Debt, 'debtId' | 'customerId' | 'createdAt' | 'remainingAmount' | 'status'>) => {",
  "export const addDebt = (customerId: string, debtData: Omit<Debt, 'debtId' | 'customerId' | 'createdAt' | 'remainingAmount' | 'status'>) => {"
);

fs.writeFileSync('src/merchant/debts/services/debtService.ts', code);
