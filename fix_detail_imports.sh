#!/bin/bash
sed -i 's/import { getCustomer, getDebts, addDebt, Debt, addPayment, deleteDebt, deletePayment } from "..\/..\/debts\/services\/debtService";/import { getCustomer, getDebts, addDebt, Debt, addPayment, deleteDebt, deletePayment, getPayments, Payment } from "..\/..\/debts\/services\/debtService";/' src/merchant/customers/screens/CustomerDetailScreen.tsx
