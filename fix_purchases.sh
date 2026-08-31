#!/bin/bash
sed -i 's/import { getPurchases, createPurchase } from "..\/services\/purchasesService";/import { getPurchases, createPurchase, deletePurchase } from "..\/services\/purchasesService";/' src/merchant/purchases/screens/PurchasesScreen.tsx
sed -i 's/import { Plus, Search, ShoppingBag, ArrowRight, Minus, Check, Clock, X } from "lucide-react";/import { Plus, Search, ShoppingBag, ArrowRight, Minus, Check, Clock, X, Trash2, AlertTriangle } from "lucide-react";/' src/merchant/purchases/screens/PurchasesScreen.tsx
