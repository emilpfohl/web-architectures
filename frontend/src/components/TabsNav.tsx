import Link from 'next/link';
import { Home, ShoppingCart, CheckSquare, Wallet } from 'lucide-react';

export function TabsNav({ currentTab }: { currentTab: string }) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home, color: 'text-slate-700' },
    { id: 'shopping', label: 'Einkauf', icon: ShoppingCart, color: 'text-blue-500' },
    { id: 'todos', label: 'Putzplan', icon: CheckSquare, color: 'text-violet-500' },
    { id: 'finance', label: 'Finanzen', icon: Wallet, color: 'text-emerald-500' },
  ];

  return (
    <>
      {/* Desktop Navigation (Top Pills) */}
      <nav className="hidden md:flex gap-2 overflow-x-auto pb-4 mb-4 w-full" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <Link 
              key={tab.id} 
              href={`/?tab=${tab.id}`}
              className={`
                flex items-center gap-2 px-5 py-3 rounded-full font-semibold transition-all whitespace-nowrap
                ${isActive 
                  ? 'bg-white shadow-md border border-slate-200 text-slate-900' 
                  : 'bg-transparent text-slate-500 hover:bg-white/50 hover:text-slate-800'}
              `}
            >
              <tab.icon size={18} className={isActive ? tab.color : ''} />
              {tab.label === 'Home' ? 'Dashboard' : tab.label}
            </Link>
          )
        })}
      </nav>

      {/* Mobile Navigation (Bottom Bar) */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center w-full h-20 px-2 max-w-4xl mx-auto">
          {tabs.map(tab => {
            const isActive = currentTab === tab.id;
            return (
              <Link 
                key={tab.id} 
                href={`/?tab=${tab.id}`}
                className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full font-bold transition-all relative ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
              >
                <div className={`
                  p-1.5 rounded-xl transition-all duration-300
                  ${isActive ? 'bg-slate-50' : 'bg-transparent'}
                `}>
                  <tab.icon size={22} className={isActive ? tab.color : ''} />
                </div>
                <span className="text-[10px] tracking-tight uppercase">{tab.label}</span>
                {isActive && (
                  <div className="absolute top-0 w-8 h-1 bg-slate-900 rounded-b-full"></div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  );
}
