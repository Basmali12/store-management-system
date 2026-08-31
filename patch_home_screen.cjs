const fs = require('fs');

let homeScreen = fs.readFileSync('src/merchant/dashboard/screens/HomeScreen.tsx', 'utf8');

homeScreen = homeScreen.replace(
  "import { HandCoins, ArrowDownToLine, ShoppingCart, PackagePlus, UserPlus, FileMinus, AlertTriangle, Users } from 'lucide-react';",
  "import { HandCoins, ArrowDownToLine, ShoppingCart, PackagePlus, UserPlus, FileMinus, AlertTriangle, Users } from 'lucide-react';\nimport { getLowStockProducts } from '../../inventory/services/inventoryService';\nimport { useState, useEffect } from 'react';"
);

homeScreen = homeScreen.replace(
  "export function HomeScreen() {",
  "export function HomeScreen() {\n  const [lowStockCount, setLowStockCount] = useState(0);\n\n  useEffect(() => {\n    setLowStockCount(getLowStockProducts().length);\n  }, []);"
);

homeScreen = homeScreen.replace(
  "{mockDashboardStats.lowStockCount} منتجات قاربت على النفاد",
  "{lowStockCount} منتجات قاربت على النفاد"
);

fs.writeFileSync('src/merchant/dashboard/screens/HomeScreen.tsx', homeScreen);
console.log('HomeScreen updated.');
