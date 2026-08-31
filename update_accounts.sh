#!/bin/bash
sed -i 's/import { Search, ChevronLeft, Plus, X } from "lucide-react";/import { Search, ChevronLeft, Plus, X, Edit, Trash2, MoreVertical, AlertTriangle } from "lucide-react";/' src/merchant/customers/screens/AccountsScreen.tsx
sed -i 's/import { getCustomers, addCustomer } from "..\/..\/debts\/services\/debtService";/import { getCustomers, addCustomer, updateCustomer, canDeleteCustomer, deleteCustomer } from "..\/..\/debts\/services\/debtService";/' src/merchant/customers/screens/AccountsScreen.tsx
