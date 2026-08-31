const fs = require('fs');

// 1. Update debtService.ts
const debtServiceCode = `
import { mockCustomers, mockCustomerTransactions } from '../../../data/mock/merchant/mockData';
import { Customer } from '../../../shared/models/types';

export interface Debt {
  debtId: string;
  customerId: string;
  description: string;
  quantity: number;
  amount: number;
  createdAt: string;
  remainingAmount: number;
  status: 'OPEN' | 'PAID';
  note?: string;
}

export interface Payment {
  paymentId: string;
  customerId: string;
  amount: number;
  createdAt: string;
  note: string;
  balanceBefore: number;
  balanceAfter: number;
}

export const getCustomers = (): Customer[] => {
  const local = localStorage.getItem('merchant_customers');
  if (local) return JSON.parse(local);
  return mockCustomers;
};

export const getCustomer = (id: string): Customer | undefined => {
  return getCustomers().find(c => c.id === id);
};

export const saveCustomers = (customers: Customer[]) => {
  localStorage.setItem('merchant_customers', JSON.stringify(customers));
};

export const getDebts = (customerId: string): Debt[] => {
  const local = localStorage.getItem('merchant_debts');
  const allDebts: Record<string, Debt[]> = local ? JSON.parse(local) : {};
  
  if (!allDebts[customerId]) {
    const mockTxs = mockCustomerTransactions[customerId] || [];
    allDebts[customerId] = mockTxs.filter(t => t.type === 'debt').map(t => ({
      debtId: t.id,
      customerId,
      description: t.description,
      quantity: t.items ? t.items.reduce((acc, i) => acc + i.quantity, 0) : 1,
      amount: t.amount,
      createdAt: t.date,
      remainingAmount: t.amount,
      status: 'OPEN',
      note: ''
    }));
  }
  return allDebts[customerId] || [];
};

export const addDebt = (customerId: string, debtData: Omit<Debt, 'debtId' | 'customerId' | 'createdAt' | 'remainingAmount' | 'status'>) => {
  const local = localStorage.getItem('merchant_debts');
  const allDebts: Record<string, Debt[]> = local ? JSON.parse(local) : {};
  
  const currentDebts = getDebts(customerId);
  if (!allDebts[customerId]) allDebts[customerId] = currentDebts;

  const newDebt: Debt = {
    ...debtData,
    debtId: 'd_' + Date.now().toString(),
    customerId,
    createdAt: new Date().toISOString().split('T')[0],
    remainingAmount: debtData.amount,
    status: 'OPEN'
  };

  allDebts[customerId] = [newDebt, ...allDebts[customerId]];
  localStorage.setItem('merchant_debts', JSON.stringify(allDebts));

  const customers = getCustomers();
  const cIdx = customers.findIndex(c => c.id === customerId);
  if (cIdx >= 0) {
    customers[cIdx].balance += newDebt.amount;
    customers[cIdx].totalTaken += newDebt.amount;
    saveCustomers(customers);
  }
};

export const addPayment = (customerId: string, amount: number, note: string = '') => {
  const customers = getCustomers();
  const cIdx = customers.findIndex(c => c.id === customerId);
  if (cIdx < 0) return;
  const customer = customers[cIdx];

  const balanceBefore = customer.balance;
  const balanceAfter = balanceBefore - amount;

  const local = localStorage.getItem('merchant_debts');
  const allDebts: Record<string, Debt[]> = local ? JSON.parse(local) : {};
  const debts = getDebts(customerId); 
  
  let remainingPayment = amount;

  // Sort open debts by date ascending (oldest first).
  // If dates are identical, use debtId to maintain consistent ordering
  const openDebts = debts.filter(d => d.status === 'OPEN').sort((a, b) => {
    const tA = new Date(a.createdAt).getTime();
    const tB = new Date(b.createdAt).getTime();
    if (tA === tB) return a.debtId.localeCompare(b.debtId);
    return tA - tB;
  });

  for (const debt of openDebts) {
    if (remainingPayment <= 0) break;
    
    // Find the actual debt in the main array to modify it by reference
    const actualDebt = debts.find(d => d.debtId === debt.debtId);
    if (!actualDebt) continue;

    if (remainingPayment >= actualDebt.remainingAmount) {
      remainingPayment -= actualDebt.remainingAmount;
      actualDebt.remainingAmount = 0;
      actualDebt.status = 'PAID';
    } else {
      actualDebt.remainingAmount -= remainingPayment;
      remainingPayment = 0;
    }
  }

  allDebts[customerId] = debts;
  localStorage.setItem('merchant_debts', JSON.stringify(allDebts));

  customer.balance = balanceAfter;
  customer.totalPaid += amount;
  saveCustomers(customers);

  const localPayments = localStorage.getItem('merchant_payments');
  const allPayments: Record<string, Payment[]> = localPayments ? JSON.parse(localPayments) : {};
  const newPayment: Payment = {
    paymentId: 'p_' + Date.now().toString(),
    customerId,
    amount,
    createdAt: new Date().toISOString().split('T')[0],
    note,
    balanceBefore,
    balanceAfter
  };
  if (!allPayments[customerId]) allPayments[customerId] = [];
  allPayments[customerId] = [newPayment, ...allPayments[customerId]];
  localStorage.setItem('merchant_payments', JSON.stringify(allPayments));
};
`;
fs.writeFileSync('src/merchant/debts/services/debtService.ts', debtServiceCode);

// 2. Update CustomerDetailScreen.tsx
let detailScreen = fs.readFileSync('src/merchant/customers/screens/CustomerDetailScreen.tsx', 'utf8');

detailScreen = detailScreen.replace(
  "getDebts, addDebt, Debt } from '../../debts/services/debtService';",
  "getDebts, addDebt, Debt, addPayment } from '../../debts/services/debtService';"
);

detailScreen = detailScreen.replace(
  "const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);",
  "const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);\n  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);\n  const [paymentAmount, setPaymentAmount] = useState('');\n  const [paymentNote, setPaymentNote] = useState('');"
);

const handleAddPaymentCode = `
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) return;
    
    addPayment(customerId, amt, paymentNote);
    
    setCustomer(getCustomer(customerId));
    setDebts(getDebts(customerId));
    
    setPaymentAmount('');
    setPaymentNote('');
    setIsAddPaymentOpen(false);
  };
`;
detailScreen = detailScreen.replace(
  "if (!customer) return <div>غير موجود</div>;",
  handleAddPaymentCode + "\n\n  if (!customer) return <div>غير موجود</div>;"
);

detailScreen = detailScreen.replace(
  '<button className="bg-gray-300 text-gray-500 rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed">\n            <ArrowDownToLine size={18} /> تسجيل تسديد\n          </button>',
  '<button onClick={() => setIsAddPaymentOpen(true)} className="bg-green-600 text-white rounded-xl py-3 text-sm font-bold shadow-md shadow-green-100 flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all">\n            <ArrowDownToLine size={18} /> تسجيل تسديد\n          </button>'
);

detailScreen = detailScreen.replace(
  '<p className="text-sm font-bold text-red-600">{formatCurrency(d.amount)}</p>',
  '<p className="text-sm font-bold text-red-600">{formatCurrency(d.remainingAmount)}</p>'
);

const paymentModalJSX = `
      {/* Add Payment Modal */}
      {isAddPaymentOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-[Cairo]">
          <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">تسجيل تسديد</h2>
              <button onClick={() => setIsAddPaymentOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddPayment} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">مبلغ التسديد</label>
                <input type="number" min="1" step="250" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required placeholder="مثال: 50000" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">ملاحظة اختياري</label>
                <input type="text" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="أي تفاصيل إضافية..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" />
              </div>
              
              <button type="submit" className="w-full bg-green-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-green-700 active:scale-[0.98] transition-all shadow-md shadow-green-200">
                تأكيد التسديد
              </button>
            </form>
          </div>
        </div>
      )}
`;

detailScreen = detailScreen.replace(
  "    </div>\n  );\n}",
  paymentModalJSX + "\n    </div>\n  );\n}"
);

fs.writeFileSync('src/merchant/customers/screens/CustomerDetailScreen.tsx', detailScreen);

console.log('Payment system configured.');
