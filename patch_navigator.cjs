const fs = require('fs');
let navCode = fs.readFileSync('src/navigation/merchant_navigation/MerchantNavigator.tsx', 'utf8');

navCode = navCode.replace(
  "import { MoreScreen } from '../../merchant/settings/screens/MoreScreen';",
  "import { MoreScreen } from '../../merchant/settings/screens/MoreScreen';\nimport { ProductFieldsSettingsScreen } from '../../merchant/settings/product_fields/screens/ProductFieldsSettingsScreen';"
);

navCode = navCode.replace(
  "const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);",
  "const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);\n  const [selectedMoreRoute, setSelectedMoreRoute] = useState<string | null>(null);"
);

navCode = navCode.replace(
  "// Reset nested views when changing tabs\n    if (tab !== 'accounts') {\n      setSelectedCustomerId(null);\n    }",
  "// Reset nested views when changing tabs\n    if (tab !== 'accounts') {\n      setSelectedCustomerId(null);\n    }\n    if (tab !== 'more') {\n      setSelectedMoreRoute(null);\n    }"
);

navCode = navCode.replace(
  "case 'more':\n        return <MoreScreen />;",
  "case 'more':\n        if (selectedMoreRoute === 'product_fields') {\n          return <ProductFieldsSettingsScreen onBack={() => setSelectedMoreRoute(null)} />;\n        }\n        return <MoreScreen onNavigate={setSelectedMoreRoute} />;"
);

fs.writeFileSync('src/navigation/merchant_navigation/MerchantNavigator.tsx', navCode);

let moreCode = fs.readFileSync('src/merchant/settings/screens/MoreScreen.tsx', 'utf8');
moreCode = moreCode.replace(
  "export function MoreScreen() {",
  "interface Props { onNavigate?: (route: string) => void; }\n\nexport function MoreScreen({ onNavigate }: Props) {"
);

// We need to attach the action to 'تخصيص التطبيق'
moreCode = moreCode.replace(
  "{ icon: Palette, label: 'تخصيص التطبيق', color: 'text-purple-500', bg: 'bg-purple-50' }",
  "{ icon: Palette, label: 'تخصيص التطبيق', color: 'text-purple-500', bg: 'bg-purple-50', route: 'product_fields' }"
);

moreCode = moreCode.replace(
  "<button key={itemIdx} className=\"w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100\">",
  "<button key={itemIdx} onClick={() => item.route && onNavigate?.(item.route)} className=\"w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100\">"
);

fs.writeFileSync('src/merchant/settings/screens/MoreScreen.tsx', moreCode);
console.log('Navigation patched.');
