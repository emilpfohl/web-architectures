import Link from 'next/link';
import { Home, ShoppingCart, CheckSquare, Wallet } from 'lucide-react';

export function TabsNav({ currentTab }: { currentTab: string }) {
  const tabs = [
    { id: 'dashboard', label: 'Vibe', icon: 'home_app_logo' },
    { id: 'todos', label: 'Tasks', icon: 'assignment' },
    { id: 'finance', label: 'Money', icon: 'payments' },
    { id: 'shopping', label: 'Stock', icon: 'shopping_basket' },
  ];

  return (
    <>
      {/* Desktop Navigation (Top Pills) */}
      <nav className="hidden md:flex gap-4 pb-6 mb-8 w-full border-b border-outline-variant/30">
        {tabs.map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <Link 
              key={tab.id} 
              href={`/?tab=${tab.id}`}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-full font-headline font-bold transition-all whitespace-nowrap
                ${isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}
              `}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {/* Mobile Navigation (Bottom Bar) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-outline-variant/20 pb-safe shadow-[0_-4px_20px_rgba(49,51,47,0.03)] rounded-t-[3rem]">
        <div className="flex justify-around items-center w-full h-24 px-4 max-w-lg mx-auto">
          {tabs.map(tab => {
            const isActive = currentTab === tab.id;
            return (
              <Link 
                key={tab.id} 
                href={`/?tab=${tab.id}`}
                className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${isActive ? 'bg-sage-soft text-primary rounded-[2rem] px-6 py-3 scale-110' : 'text-on-surface-variant opacity-70'}`}
              >
                <span className={`material-symbols-outlined text-[24px] ${isActive ? '[font-variation-settings:\'FILL\'_1]' : ''}`}>
                  {tab.icon}
                </span>
                <span className="font-body text-[12px] font-bold tracking-tight">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  );
}
