#!/bin/bash
sed -i "s/const filteredProducts = products.filter(p => {/const filteredProducts = products.filter(p => {\n    if (p.status === 'inactive') return false;/" src/merchant/inventory/screens/InventoryScreen.tsx
sed -i "s/const lowStockCount = products.filter(p => p.quantity <= p.lowStockLimit).length;/const lowStockCount = products.filter(p => p.status !== 'inactive' \&\& p.quantity <= p.lowStockLimit).length;/" src/merchant/inventory/screens/InventoryScreen.tsx
