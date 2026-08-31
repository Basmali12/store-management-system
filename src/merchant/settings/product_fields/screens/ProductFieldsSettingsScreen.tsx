
import React, { useState } from 'react';
import { ChevronRight, Settings2 } from 'lucide-react';
import { getProductFieldSettings, saveProductFieldSettings } from '../services/productFieldsService';
import { ProductFieldSettings } from '../models/ProductFieldSettings';
import { cn } from '../../../../shared/utils/utils';

interface Props {
  onBack: () => void;
}

export function ProductFieldsSettingsScreen({ onBack }: Props) {
  const [settings, setSettings] = useState<ProductFieldSettings>(getProductFieldSettings());

  const fields = [
    { key: 'barcodeEnabled', label: 'الباركود' },
    { key: 'sizeEnabled', label: 'المقاس' },
    { key: 'colorEnabled', label: 'اللون' },
    { key: 'weightEnabled', label: 'الوزن' },
    { key: 'unitEnabled', label: 'الوحدة' },
    { key: 'expiryEnabled', label: 'تاريخ الانتهاء' },
    { key: 'brandEnabled', label: 'الماركة' },
    { key: 'batchNumberEnabled', label: 'رقم التشغيلة' },
    { key: 'serialNumberEnabled', label: 'الرقم التسلسلي' },
    { key: 'warrantyEnabled', label: 'الضمان' },
  ] as const;

  const handleToggle = (key: keyof ProductFieldSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveProductFieldSettings(newSettings);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 font-[Cairo]">
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-4 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -mr-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 shadow-sm transition-colors">
          <ChevronRight size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">تخصيص حقول المنتجات</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
          <Settings2 className="text-blue-500 mt-0.5 shrink-0" size={20} />
          <p className="text-sm text-blue-800 font-semibold leading-relaxed">
            المنتجات لها حقول أساسية ثابتة (الاسم، السعر، التصنيف). يمكنك تفعيل الحقول الإضافية التي تناسب نشاطك التجاري لكي تظهر في واجهات إضافة وتعديل وعرض المنتجات.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {fields.map(field => (
            <div key={field.key} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <span className="font-bold text-gray-800 text-sm">{field.label}</span>
              <button
                onClick={() => handleToggle(field.key)}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center",
                  settings[field.key] ? "bg-indigo-600" : "bg-gray-200"
                )}
              >
                <div 
                  className={cn(
                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out",
                    settings[field.key] ? "translate-x-0" : "-translate-x-6"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
