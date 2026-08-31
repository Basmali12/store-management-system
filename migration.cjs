const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Step 1: Create directories
const dirs = [
  'src/merchant/dashboard/screens', 'src/merchant/dashboard/components',
  'src/merchant/customers/screens', 'src/merchant/customers/components',
  'src/merchant/suppliers/screens',
  'src/merchant/debts/screens',
  'src/merchant/payments/screens',
  'src/merchant/sales/screens',
  'src/merchant/purchases/screens',
  'src/merchant/inventory/screens',
  'src/merchant/expenses/screens',
  'src/merchant/overdue/screens',
  'src/merchant/reports/screens',
  'src/merchant/settings/screens',
  'src/merchant/components',
  'src/customer_portal/login', 'src/customer_portal/home', 'src/customer_portal/account', 'src/customer_portal/debts', 'src/customer_portal/payments', 'src/customer_portal/transactions', 'src/customer_portal/components', 'src/customer_portal/models', 'src/customer_portal/services',
  'src/super_admin/login', 'src/super_admin/dashboard/screens', 'src/super_admin/merchants', 'src/super_admin/subscriptions', 'src/super_admin/feature_flags', 'src/super_admin/account_status', 'src/super_admin/components', 'src/super_admin/models', 'src/super_admin/services',
  'src/shared/components', 'src/shared/models', 'src/shared/utils', 'src/shared/constants', 'src/shared/theme', 'src/shared/storage',
  'src/data/mock/merchant', 'src/data/mock/customer_portal', 'src/data/mock/super_admin',
  'src/navigation/merchant_navigation', 'src/navigation/customer_navigation', 'src/navigation/super_admin_navigation', 'src/navigation/app_router'
];
dirs.forEach(ensureDir);

// Step 2: Read files
const utils = fs.readFileSync('src/lib/utils.ts', 'utf8');
const card = fs.readFileSync('src/components/Card.tsx', 'utf8');
const types = fs.readFileSync('src/types.ts', 'utf8');
const mockData = fs.readFileSync('src/data/mockData.ts', 'utf8');

const topBar = fs.readFileSync('src/components/TopBar.tsx', 'utf8');
const bottomNav = fs.readFileSync('src/components/BottomNavigation.tsx', 'utf8');
const bottomSheet = fs.readFileSync('src/components/BottomSheet.tsx', 'utf8');

const homeScreen = fs.readFileSync('src/screens/HomeScreen.tsx', 'utf8');
const accountsScreen = fs.readFileSync('src/screens/AccountsScreen.tsx', 'utf8');
const customerDetailScreen = fs.readFileSync('src/screens/CustomerDetailScreen.tsx', 'utf8');
const salesScreen = fs.readFileSync('src/screens/SalesScreen.tsx', 'utf8');
const inventoryScreen = fs.readFileSync('src/screens/InventoryScreen.tsx', 'utf8');
const moreScreen = fs.readFileSync('src/screens/MoreScreen.tsx', 'utf8');

const app = fs.readFileSync('src/App.tsx', 'utf8');

// Replace and Write
fs.writeFileSync('src/shared/utils/utils.ts', utils);

fs.writeFileSync('src/shared/components/Card.tsx', 
  card.replace(`from '../lib/utils'`, `from '../utils/utils'`)
);

fs.writeFileSync('src/shared/models/types.ts', types);

fs.writeFileSync('src/data/mock/merchant/mockData.ts', 
  mockData.replace(`from '../types'`, `from '../../../shared/models/types'`)
);

fs.writeFileSync('src/merchant/components/TopBar.tsx', 
  topBar.replace(`from '../data/mockData'`, `from '../../data/mock/merchant/mockData'`)
);

fs.writeFileSync('src/merchant/components/BottomNavigation.tsx', 
  bottomNav.replace(`from '../lib/utils'`, `from '../../shared/utils/utils'`)
);

fs.writeFileSync('src/merchant/components/BottomSheet.tsx', 
  bottomSheet.replace(`from '../lib/utils'`, `from '../../shared/utils/utils'`)
);

const fixScreenImports = (content) => {
  return content
    .replace(/from '\.\.\/components\//g, "from '../../../shared/components/")
    .replace(/from '\.\.\/data\/mockData'/g, "from '../../../data/mock/merchant/mockData'")
    .replace(/from '\.\.\/lib\/utils'/g, "from '../../../shared/utils/utils'");
};

fs.writeFileSync('src/merchant/dashboard/screens/HomeScreen.tsx', fixScreenImports(homeScreen));
fs.writeFileSync('src/merchant/customers/screens/AccountsScreen.tsx', fixScreenImports(accountsScreen));
fs.writeFileSync('src/merchant/customers/screens/CustomerDetailScreen.tsx', fixScreenImports(customerDetailScreen));
fs.writeFileSync('src/merchant/sales/screens/SalesScreen.tsx', fixScreenImports(salesScreen));
fs.writeFileSync('src/merchant/inventory/screens/InventoryScreen.tsx', fixScreenImports(inventoryScreen));
fs.writeFileSync('src/merchant/settings/screens/MoreScreen.tsx', fixScreenImports(moreScreen));

// Navigation and App setup

// Extract everything from App.tsx after imports
const appBody = app.substring(app.indexOf('export default function App() {')).replace('export default function App() {', 'export function MerchantNavigator() {');

const merchantNavContent = `import React, { useState } from 'react';
import { TopBar } from '../../merchant/components/TopBar';
import { BottomNavigation } from '../../merchant/components/BottomNavigation';
import { BottomSheet } from '../../merchant/components/BottomSheet';
import { HomeScreen } from '../../merchant/dashboard/screens/HomeScreen';
import { AccountsScreen } from '../../merchant/customers/screens/AccountsScreen';
import { CustomerDetailScreen } from '../../merchant/customers/screens/CustomerDetailScreen';
import { SalesScreen } from '../../merchant/sales/screens/SalesScreen';
import { InventoryScreen } from '../../merchant/inventory/screens/InventoryScreen';
import { MoreScreen } from '../../merchant/settings/screens/MoreScreen';

${appBody}`;

fs.writeFileSync('src/navigation/merchant_navigation/MerchantNavigator.tsx', merchantNavContent);

const adminScreen = `import React from 'react';

export function AdminDashboardScreen() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      <h1 className="text-3xl font-bold mb-4 text-indigo-400">نظام الأدمن الرئيسي</h1>
      <p className="text-gray-300 mb-2">هذه واجهة معاينة مؤقتة للأدمن (Super Admin Preview)</p>
      <p className="text-gray-500 text-sm mt-8">المسار الحالي: /11</p>
    </div>
  );
}
`;
fs.writeFileSync('src/super_admin/dashboard/screens/AdminDashboardScreen.tsx', adminScreen);

const appRouter = `import React, { useEffect, useState } from 'react';
import { MerchantNavigator } from '../merchant_navigation/MerchantNavigator';
import { AdminDashboardScreen } from '../../super_admin/dashboard/screens/AdminDashboardScreen';

export function AppRouter() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (path === '/11') {
    return <AdminDashboardScreen />;
  }

  // Default to Merchant app
  return <MerchantNavigator />;
}
`;
fs.writeFileSync('src/navigation/app_router/AppRouter.tsx', appRouter);

const newAppTsx = `/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { AppRouter } from './navigation/app_router/AppRouter';

export default function App() {
  return <AppRouter />;
}
`;
fs.writeFileSync('src/App.tsx', newAppTsx);

// Create READMEs
fs.writeFileSync('src/merchant/README.md', '# Merchant (صاحب المحل)\\n\\nهذا المجلد يخص تطبيق صاحب المحل فقط. ممنوع استخدام مكونات أو واجهات من هذا المجلد داخل `customer_portal` أو `super_admin`.');
fs.writeFileSync('src/customer_portal/README.md', '# Customer Portal (نظام الزبون)\\n\\nهذا المجلد خاص بنظام الزبون. يجب أن يكون معزولاً عن تطبيق صاحب المحل `merchant`. ممنوع الاعتماد على المكونات الموجودة في `merchant`. إذا احتجت كودًا مشتركًا، ضعه في مجلد `shared`.');
fs.writeFileSync('src/super_admin/README.md', '# Super Admin (نظام الأدمن الرئيسي)\\n\\nهذا النظام مخصص للأدمن لإدارة أصحاب المحلات والاشتراكات. ممنوع استيراد مكونات خاصة بـ `merchant` هنا.');

// Delete old directories
fs.rmSync('src/components', { recursive: true, force: true });
fs.rmSync('src/screens', { recursive: true, force: true });
fs.rmSync('src/data/mockData.ts', { force: true });
fs.rmSync('src/types.ts', { force: true });
fs.rmSync('src/lib', { recursive: true, force: true });

console.log('Migration completed successfully.');
