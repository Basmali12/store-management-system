const fs = require('fs');
let typesCode = fs.readFileSync('src/merchant/inventory/models/types.ts', 'utf8');

typesCode = typesCode.replace(
  "updatedAt: string;\n}",
  "updatedAt: string;\n  barcode?: string;\n  size?: string;\n  color?: string;\n  weight?: string;\n  unit?: string;\n  expiry?: string;\n  brand?: string;\n  batchNumber?: string;\n  serialNumber?: string;\n  warranty?: string;\n}"
);

fs.writeFileSync('src/merchant/inventory/models/types.ts', typesCode);
console.log('Product Model updated.');
