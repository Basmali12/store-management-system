#!/bin/bash
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx
sed -i '$ d' src/merchant/sales/screens/SalesScreen.tsx

cat << 'INNER_EOF' >> src/merchant/sales/screens/SalesScreen.tsx
      {/* Delete Sale Modal */}
      {deleteSaleState && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 p-5 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">هل أنت متأكد؟</h2>
            
            <p className="text-gray-500 text-sm mb-6">
              سيتم حذف عملية البيع وتحديث المخزون (إرجاع الكميات) وتعديل رصيد الزبون إن كان البيع آجلاً.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteSaleState(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold rounded-xl py-3"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 text-white font-bold rounded-xl py-3"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
INNER_EOF
