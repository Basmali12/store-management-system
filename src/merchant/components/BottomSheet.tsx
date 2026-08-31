import React, { useEffect, useState } from 'react';
import { X, HandCoins, ArrowDownToLine, ShoppingCart, Truck, PackagePlus, UserPlus, FileMinus } from 'lucide-react';
import { cn } from '../../shared/utils/utils';
import { motion, AnimatePresence } from 'motion/react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string) => void;
}

export function BottomSheet({ isOpen, onClose, onAction }: BottomSheetProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const actions = [
    { id: 'add_debt', icon: HandCoins, label: 'إضافة دين', color: 'text-white', bg: 'bg-indigo-600' },
    { id: 'add_payment', icon: ArrowDownToLine, label: 'تسجيل تسديد', color: 'text-white', bg: 'bg-green-600' },
    { id: 'sale', icon: ShoppingCart, label: 'عملية بيع', color: 'text-white', bg: 'bg-amber-500' },
    { id: 'purchase', icon: Truck, label: 'عملية شراء', color: 'text-white', bg: 'bg-blue-600' },
    { id: 'add_product', icon: PackagePlus, label: 'إضافة منتج', color: 'text-white', bg: 'bg-purple-600' },
    { id: 'add_customer', icon: UserPlus, label: 'إضافة زبون', color: 'text-white', bg: 'bg-teal-600' },
    { id: 'add_supplier', icon: UserPlus, label: 'إضافة مورد', color: 'text-white', bg: 'bg-cyan-600' },
    { id: 'add_expense', icon: FileMinus, label: 'إضافة مصروف', color: 'text-white', bg: 'bg-rose-600' },
  ];
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 overflow-hidden shadow-2xl pb-safe"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">إجراء سريع</h2>
              <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 grid grid-cols-4 gap-y-6 gap-x-2">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button key={index} className="flex flex-col items-center gap-2 group" onClick={() => onAction ? onAction(action.id) : onClose()}>
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 shadow-md", action.bg, action.color)}>
                      <Icon size={24} strokeWidth={2} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
