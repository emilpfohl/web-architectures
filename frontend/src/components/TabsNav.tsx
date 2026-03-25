import Link from 'next/link';
import { Home, ShoppingCart, CheckSquare, Wallet } from 'lucide-react';

export function TabsNav({ currentTab }: { currentTab: string }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-slate-700' },
    { id: 'shopping', label: 'Einkaufsliste', icon: ShoppingCart, color: 'text-blue-500' },
    { id: 'todos', label: 'Putzplan', icon: CheckSquare, color: 'text-violet-500' },
    { id: 'finance', label: 'Finanzen', icon: Wallet, color: 'text-emerald-500' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 mb-4 w-full" style={{ scrollbarWidth: 'none' }}>
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
            {tab.label}
          </Link>
        )
      })}
    </div>
  );
}
