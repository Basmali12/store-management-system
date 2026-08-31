#!/bin/bash
# Remove last 2 lines
sed -i '$ d' src/merchant/inventory/screens/InventoryScreen.tsx
sed -i '$ d' src/merchant/inventory/screens/InventoryScreen.tsx
sed -i '$ d' src/merchant/inventory/screens/InventoryScreen.tsx

cat << 'INNER_EOF' >> src/merchant/inventory/screens/InventoryScreen.tsx

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end">
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">تعديل المنتج</h2>
              <button onClick={() => setEditProduct(null)} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">اسم المنتج</label>
                <input required type="text" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">الفئة / القسم</label>
                  <input required type="text" value={editProduct.category} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">حد النقص</label>
                  <input type="number" min="0" value={editProduct.lowStockLimit} onChange={e => setEditProduct({ ...editProduct, lowStockLimit: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">سعر الشراء</label>
                  <input required type="number" min="0" value={editProduct.purchasePrice || ''} onChange={e => setEditProduct({ ...editProduct, purchasePrice: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">سعر البيع</label>
                  <input required type="number" min="0" value={editProduct.salePrice || ''} onChange={e => setEditProduct({ ...editProduct, salePrice: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-6 active:scale-[0.98] transition-all">
                حفظ التعديلات
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Modal */}
      {deleteProductState && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 p-5 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">هل أنت متأكد؟</h2>
            
            <p className="text-gray-500 text-sm mb-6">
              إذا كان المنتج مستخدماً في عمليات سابقة فسيتم إخفاؤه (تعطيله) للحفاظ على التقارير. وإذا لم يكن مستخدماً سيتم حذفه نهائياً.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteProductState(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold rounded-xl py-3"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 text-white font-bold rounded-xl py-3"
              >
                تأكيد العملية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
INNER_EOF
