#!/bin/bash
sed -i 's/import { getSales, createSale } from "..\/services\/salesService";/import { getSales, createSale, deleteSale } from "..\/services\/salesService";/' src/merchant/sales/screens/SalesScreen.tsx
sed -i 's/import { Plus, Search, ShoppingCart, ArrowRight, Minus, Check, Clock } from "lucide-react";/import { Plus, Search, ShoppingCart, ArrowRight, Minus, Check, Clock, Trash2, AlertTriangle } from "lucide-react";/' src/merchant/sales/screens/SalesScreen.tsx
