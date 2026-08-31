const fs = require('fs');

function addImports(file, imports, from) {
  let content = fs.readFileSync(file, 'utf8');
  const importMatch = content.match(new RegExp(`import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${from}['"];?`));
  if (importMatch) {
    const existing = importMatch[1].split(',').map(s => s.trim());
    const newImports = imports.filter(i => !existing.includes(i));
    if (newImports.length > 0) {
      const newImportString = `import { ${[...existing, ...newImports].join(', ')} } from '${from}';`;
      content = content.replace(importMatch[0], newImportString);
    }
  } else {
    content = `import { ${imports.join(', ')} } from '${from}';\n` + content;
  }
  fs.writeFileSync(file, content);
}

// 1. CustomerDetailScreen.tsx
const customerScreen = 'src/merchant/customers/screens/CustomerDetailScreen.tsx';
addImports(customerScreen, ['Trash2', 'AlertTriangle'], 'lucide-react');
addImports(customerScreen, ['Payment', 'getPayments', 'deleteDebt', 'deletePayment'], '../../debts/services/debtService');

// 2. InventoryScreen.tsx
const inventoryScreen = 'src/merchant/inventory/screens/InventoryScreen.tsx';
addImports(inventoryScreen, ['Edit', 'Trash2', 'AlertTriangle'], 'lucide-react');
addImports(inventoryScreen, ['deleteOrDisableProduct'], '../services/inventoryService');

// 3. PurchasesScreen.tsx
const purchasesScreen = 'src/merchant/purchases/screens/PurchasesScreen.tsx';
addImports(purchasesScreen, ['Trash2', 'AlertTriangle'], 'lucide-react');
addImports(purchasesScreen, ['deletePurchase'], '../services/purchasesService');

// 4. SalesScreen.tsx
const salesScreen = 'src/merchant/sales/screens/SalesScreen.tsx';
addImports(salesScreen, ['Trash2', 'AlertTriangle'], 'lucide-react');
addImports(salesScreen, ['deleteSale'], '../services/salesService');

