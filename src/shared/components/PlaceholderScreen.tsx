import React from 'react';
import { ChevronRight, Wrench } from 'lucide-react';

export function PlaceholderScreen({ title, onBack }: { title: string, onBack: () => void }) {
  return (
    <div className="h-full flex flex-col font-[Cairo] bg-gray-50">
      <div className="bg-white p-4 flex items-center gap-3 border-b border-gray-100 z-20 sticky top-0">
        <button onClick={onBack} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
          <ChevronRight size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <Wrench size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">قريباً</h2>
        <p className="text-gray-500 max-w-xs">هذه الميزة ({title}) قيد التطوير وسيتم إضافتها في التحديث القادم.</p>
      </div>
    </div>
  );
}
