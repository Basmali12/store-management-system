
import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, X, ArrowUpCircle, ArrowDownCircle, Edit3, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Card } from '../../../shared/components/Card';
import { formatCurrency } from '../../../data/mock/merchant/mockData';
import { cn } from '../../../shared/utils/utils';
import { getProducts, addProduct, updateProduct, addStockMovement, deleteOrDisableProduct } from '../services/inventoryService';
import { Product } from '../models/types';
import { getProductFieldSettings } from '../../settings/product_fields/services/productFieldsService';

interface InventoryScreenProps {
  initialShowAdd?: boolean;
  onAddClosed?: () => void;
}

export function InventoryScreen({ initialShowAdd = false, onAddClosed }: InventoryScreenProps = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('الكل');
  
  const settings = getProductFieldSettings();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(initialShowAdd);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Core Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('');
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // Optional Form State
  const [optFields, setOptFields] = useState<Partial<Product>>({});

  // Stock Adjust State
  const [adjustType, setAdjustType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'EDIT' | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  useEffect(() => {
    refreshProducts();
  }, []);

  useEffect(() => {
    if (initialShowAdd) {
      setIsAddOpen(true);
    }
  }, [initialShowAdd]);

  const refreshProducts = () => {
    setProducts(getProducts());
  };

  const categories = ['الكل', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(p => {
    if (p.status === 'inactive') return false;
    const matchesSearch = p.name.includes(search);
    const matchesCategory = activeCategory === 'الكل' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = products.filter(p => p.status !== 'inactive' && p.quantity <= p.lowStockLimit).length;

  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProductState, setDeleteProductState] = useState<Product | null>(null);

  const handleEditClick = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    setEditProduct(p);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    if (!editProduct) return;

    if (editProduct.purchasePrice < 0 || editProduct.salePrice < 0) {
      setEditError('يرجى إدخال أسعار صحيحة.');
      return;
    }
    if (editProduct.lowStockLimit < 0) {
      setEditError('يرجى إدخال حد نقص صالح.');
      return;
    }

    updateProduct(editProduct.productId, {
      name: editProduct.name,
      category: editProduct.category,
      purchasePrice: editProduct.purchasePrice,
      salePrice: editProduct.salePrice,
      lowStockLimit: editProduct.lowStockLimit,
    });
    setEditProduct(null);
    refreshProducts();
  };

  const handleDeleteClick = (e: React.MouseEvent, p: Product) => {
    e.stopPropagation();
    setDeleteProductState(p);
  };

  const handleConfirmDelete = () => {
    if (!deleteProductState) return;
    deleteOrDisableProduct(deleteProductState.productId);
    setDeleteProductState(null);
    refreshProducts();
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!name || !category) return;
    
    const pPrice = parseFloat(purchasePrice) || 0;
    const sPrice = parseFloat(salePrice) || 0;
    const qty = parseInt(quantity) || 0;
    const limit = parseInt(lowStockLimit) || 0;

    if (isNaN(pPrice) || isNaN(sPrice) || pPrice < 0 || sPrice < 0) {
      setAddError('يرجى إدخال أسعار صحيحة.');
      return;
    }
    if (isNaN(qty) || isNaN(limit) || qty < 0 || limit < 0) {
      setAddError('يرجى إدخال كميات صحيحة.');
      return;
    }

    addProduct({
      name,
      category,
      purchasePrice: pPrice,
      salePrice: sPrice,
      quantity: qty,
      lowStockLimit: limit,
      ...optFields
    });
    
    resetForm();
    setIsAddOpen(false);
    onAddClosed?.();
    refreshProducts();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !name || !category) return;
    
    updateProduct(selectedProduct.productId, {
      name,
      category,
      purchasePrice: parseFloat(purchasePrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      lowStockLimit: parseInt(lowStockLimit) || 0,
      ...optFields
    });
    
    setAdjustType(null);
    setSelectedProduct(null);
    refreshProducts();
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');
    if (!selectedProduct || !adjustType) return;
    const qty = parseInt(adjustQuantity);
    
    if (isNaN(qty) || qty <= 0) {
      setAdjustError('يرجى إدخال كمية صحيحة أكبر من صفر.');
      return;
    }

    if (adjustType === 'STOCK_OUT' && qty > selectedProduct.quantity) {
      setAdjustError('الكمية المطلوبة أكبر من الكمية المتوفرة في المخزون.');
      return;
    }
    
    addStockMovement(selectedProduct.productId, adjustType as any, qty, adjustNote);
    
    setAdjustQuantity('');
    setAdjustNote('');
    setAdjustType(null);
    setSelectedProduct(null);
    refreshProducts();
  };

  const resetForm = () => {
    setName(''); setCategory(''); setPurchasePrice(''); setSalePrice(''); setQuantity(''); setLowStockLimit('');
    setOptFields({});
  };

  const openEdit = (p: Product) => {
    setSelectedProduct(p);
    setName(p.name);
    setCategory(p.category);
    setPurchasePrice(p.purchasePrice.toString());
    setSalePrice(p.salePrice.toString());
    setLowStockLimit(p.lowStockLimit.toString());
    
    setOptFields({
      barcode: p.barcode,
      size: p.size,
      color: p.color,
      weight: p.weight,
      unit: p.unit,
      expiry: p.expiry,
      brand: p.brand,
      batchNumber: p.batchNumber,
      serialNumber: p.serialNumber,
      warranty: p.warranty,
    });
    
    setAdjustType('EDIT');
  };

  const openAdjust = (p: Product, type: 'STOCK_IN' | 'STOCK_OUT') => {
    setSelectedProduct(p);
    setAdjustType(type);
  };

  const renderOptionalFields = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        {settings.barcodeEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">الباركود</label>
            <input type="text" value={optFields.barcode || ''} onChange={e => setOptFields({...optFields, barcode: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        {settings.sizeEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">المقاس</label>
            <input type="text" value={optFields.size || ''} onChange={e => setOptFields({...optFields, size: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        {settings.colorEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">اللون</label>
            <input type="text" value={optFields.color || ''} onChange={e => setOptFields({...optFields, color: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        {settings.weightEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">الوزن</label>
            <input type="text" value={optFields.weight || ''} onChange={e => setOptFields({...optFields, weight: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        {settings.unitEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">الوحدة</label>
            <input type="text" value={optFields.unit || ''} onChange={e => setOptFields({...optFields, unit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        {settings.expiryEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">تاريخ الانتهاء</label>
            <input type="date" value={optFields.expiry || ''} onChange={e => setOptFields({...optFields, expiry: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        {settings.brandEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">الماركة</label>
            <input type="text" value={optFields.brand || ''} onChange={e => setOptFields({...optFields, brand: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        {settings.batchNumberEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">رقم التشغيلة</label>
            <input type="text" value={optFields.batchNumber || ''} onChange={e => setOptFields({...optFields, batchNumber: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        {settings.serialNumberEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">الرقم التسلسلي</label>
            <input type="text" value={optFields.serialNumber || ''} onChange={e => setOptFields({...optFields, serialNumber: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
        {settings.warrantyEnabled && (
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">الضمان</label>
            <input type="text" value={optFields.warranty || ''} onChange={e => setOptFields({...optFields, warranty: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
        )}
      </div>
    );
  };

  const renderProductBadges = (product: Product) => {
    const badges = [];
    if (settings.sizeEnabled && product.size) badges.push(product.size);
    if (settings.colorEnabled && product.color) badges.push(product.color);
    if (settings.weightEnabled && product.weight) badges.push(product.weight);
    if (settings.unitEnabled && product.unit) badges.push(product.unit);
    if (settings.brandEnabled && product.brand) badges.push(product.brand);
    
    if (badges.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {badges.map((b, i) => (
          <span key={i} className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{b}</span>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-2 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex flex-col gap-4">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">المخزون</h1>
            <p className="text-xs text-gray-500 mt-1">{products.length} منتجات • {lowStockCount} تنبيهات</p>
          </div>
          <button onClick={() => { resetForm(); setIsAddOpen(true); }} className="bg-indigo-600 text-white p-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100">
            <Plus size={20} />
            <span className="hidden sm:inline">إضافة منتج</span>
          </button>
        </div>

        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث عن منتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pr-10 p-3 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                activeCategory === cat ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredProducts.map(product => {
          const isLowStock = product.quantity <= product.lowStockLimit;
          
          return (
            <Card key={product.productId} className="!p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{product.category}</span>
                    {isLowStock && <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded font-bold">مخزون منخفض</span>}
                  </div>
                  {renderProductBadges(product)}
                  {settings.expiryEnabled && product.expiry && (
                    <p className="text-[10px] text-gray-500 mt-1">انتهاء: {product.expiry}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={(e) => handleEditClick(e, product)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={(e) => handleDeleteClick(e, product)} className="text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold text-center min-w-[3.5rem] flex flex-col items-center justify-center",
                  isLowStock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                )}>
                  <span className="block text-[10px] opacity-70 font-normal">الكمية</span>
                  <span className="text-sm">{product.quantity}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-50 mb-3">
                <div>
                  <span className="text-gray-400 text-xs ml-1">شراء:</span>
                  <span className="font-semibold text-gray-600">{formatCurrency(product.purchasePrice)}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs ml-1">بيع:</span>
                  <span className="font-bold text-indigo-600">{formatCurrency(product.salePrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button onClick={() => openAdjust(product, 'STOCK_IN')} className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors">
                  <ArrowUpCircle size={14} /> زيادة
                </button>
                <button onClick={() => openAdjust(product, 'STOCK_OUT')} className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors">
                  <ArrowDownCircle size={14} /> إنقاص
                </button>
                <button onClick={() => openEdit(product)} className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors">
                  <Edit3 size={14} /> تعديل
                </button>
              </div>
            </Card>
          )
        })}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 flex flex-col items-center gap-3 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">لا توجد منتجات حتى الآن</p>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
            >
              إضافة أول منتج
            </button>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">إضافة منتج جديد</h2>
              <button onClick={() => { setIsAddOpen(false); onAddClosed?.(); }} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">اسم المنتج</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">التصنيف</label>
                <input type="text" value={category} onChange={e => setCategory(e.target.value)} required placeholder="مثال: مشروبات" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">سعر الشراء</label>
                  <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">سعر البيع</label>
                  <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">الكمية الحالية</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">حد التنبيه</label>
                  <input type="number" value={lowStockLimit} onChange={e => setLowStockLimit(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>
              </div>
              
              {renderOptionalFields()}

              {addError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mt-4">
                  {addError}
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                حفظ المنتج
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Adjust/Edit Modal */}
      {selectedProduct && adjustType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {adjustType === 'EDIT' ? 'تعديل المنتج' : adjustType === 'STOCK_IN' ? 'إضافة كمية' : 'إنقاص كمية'}
              </h2>
              <button onClick={() => { setSelectedProduct(null); setAdjustType(null); }} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            {adjustType === 'EDIT' ? (
              <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">اسم المنتج</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">التصنيف</label>
                  <input type="text" value={category} onChange={e => setCategory(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">سعر الشراء</label>
                    <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">سعر البيع</label>
                    <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">حد التنبيه</label>
                  <input type="number" value={lowStockLimit} onChange={e => setLowStockLimit(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200 text-left" dir="ltr" />
                </div>

                {renderOptionalFields()}

                <button type="submit" className="w-full bg-indigo-600 text-white font-bold rounded-xl p-4 mt-6 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                  حفظ التعديلات
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">الكمية الحالية:</span>
                  <span className="text-lg font-bold text-gray-900">{selectedProduct.quantity}</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">الكمية المراد {adjustType === 'STOCK_IN' ? 'إضافتها' : 'إنقاصها'}</label>
                  <input type="number" value={adjustQuantity} onChange={e => setAdjustQuantity(e.target.value)} required className={cn("w-full bg-gray-50 border text-gray-900 rounded-xl p-3 outline-none focus:ring-2 text-left", adjustType === 'STOCK_IN' ? 'border-green-200 focus:ring-green-200' : 'border-rose-200 focus:ring-rose-200')} dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">ملاحظة (اختياري)</label>
                  <input type="text" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="السبب..." className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                
                {adjustError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mt-4">
                    {adjustError}
                  </div>
                )}

                <button type="submit" className={cn("w-full text-white font-bold rounded-xl p-4 mt-6 active:scale-[0.98] transition-all", adjustType === 'STOCK_IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-rose-600 hover:bg-rose-700')}>
                  تأكيد
                </button>
              </form>
            )}
          </div>
        </div>
      )}


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
                  <input type="number" value={editProduct.lowStockLimit} onChange={e => setEditProduct({ ...editProduct, lowStockLimit: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">سعر الشراء</label>
                  <input required type="number" value={editProduct.purchasePrice === 0 ? '' : editProduct.purchasePrice} onChange={e => setEditProduct({ ...editProduct, purchasePrice: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">سعر البيع</label>
                  <input required type="number" value={editProduct.salePrice === 0 ? '' : editProduct.salePrice} onChange={e => setEditProduct({ ...editProduct, salePrice: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-200" />
                </div>
              </div>
              
              {editError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mt-4">
                  {editError}
                </div>
              )}

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
