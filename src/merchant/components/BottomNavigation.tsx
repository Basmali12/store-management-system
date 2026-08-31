import React from 'react';
import { Home, Wallet, ShoppingCart, Grid, Plus } from 'lucide-react';
import { cn } from '../../shared/utils/utils';

interface BottomNavigationProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  onAddClick: () => void;
}

export function BottomNavigation({ currentTab, onChangeTab, onAddClick }: BottomNavigationProps) {
  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'accounts', label: 'الحسابات', icon: Wallet },
    { id: 'placeholder', label: '', icon: null }, // space for fab
    { id: 'sales', label: 'المبيعات', icon: ShoppingCart },
    { id: 'more', label: 'المزيد', icon: Grid },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center pb-6 px-4">
      
      {/* Container for floating nav and FAB */}
      <div className="relative w-full max-w-md">
        
        {/* Floating Action Button (FAB) */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
          <button
            onClick={onAddClick}
            className="bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(79,70,229,0.5)] border-[4px] border-gray-50 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        </div>

        {/* Floating Glassmorphic Pill */}
        <div className="bg-white/95 backdrop-blur-xl border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.1)] rounded-[2rem] w-full p-2 flex items-center justify-between pointer-events-auto relative z-30">
          {tabs.map((tab) => {
            if (tab.id === 'placeholder') {
              return <div key={tab.id} className="w-[18%]" />; // Space for FAB
            }
            const Icon = tab.icon!;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center w-[18%] py-2 transition-all duration-300 rounded-2xl",
                  isActive ? "text-indigo-600 bg-indigo-50/50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
                )}
              >
                {isActive && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-600 rounded-b-full shadow-[0_2px_8px_rgba(79,70,229,0.5)]" />
                )}
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform duration-300", isActive ? "-translate-y-1" : "")} />
                <span className={cn(
                  "text-[10px] mt-1 transition-all duration-300",
                  isActive ? "font-bold opacity-100 translate-y-0" : "font-medium opacity-70 translate-y-0.5"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
