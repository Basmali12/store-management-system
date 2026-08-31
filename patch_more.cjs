const fs = require('fs');

const path = 'src/merchant/settings/screens/MoreScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { Card } from '../../../shared/components/Card';",
  "import { Card } from '../../../shared/components/Card';\nimport { clearSession } from '../../../shared/storage/session';"
);

const logoutButton = `
        <div className="text-center pb-8 pt-4">
          <button 
            onClick={() => { clearSession(); window.location.reload(); }}
            className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl mb-4 hover:bg-red-100 active:scale-95 transition-all"
          >
            تسجيل خروج
          </button>
          <p className="text-xs text-gray-400 font-semibold">إصدار التطبيق 1.0.0</p>
        </div>
`;

content = content.replace(
  `<div className="text-center pb-8 pt-4">\n          <p className="text-xs text-gray-400 font-semibold">إصدار التطبيق 1.0.0</p>\n        </div>`,
  logoutButton
);

fs.writeFileSync(path, content);
