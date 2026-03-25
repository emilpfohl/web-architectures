'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Trash2, Plus, ShoppingCart } from 'lucide-react';

export function ShoppingClient({ initialItems }: { initialItems: any[] }) {
  const [newItemName, setNewItemName] = useState('');
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    await fetch('http://localhost:3000/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItemName.trim() })
    });
    setNewItemName('');
    router.refresh();
  };

  const toggleCheck = async (id: number, currentChecked: boolean) => {
    setLoadingIds(prev => new Set(prev).add(id));
    await fetch(`http://localhost:3000/api/shopping/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !currentChecked })
    });
    router.refresh();
    setLoadingIds(prev => { 
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const deleteItem = async (id: number) => {
    setLoadingIds(prev => new Set(prev).add(id));
    await fetch(`http://localhost:3000/api/shopping/${id}`, { method: 'DELETE' });
    router.refresh();
    setLoadingIds(prev => { 
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="glass-panel p-8 max-w-3xl animate-fade-in flex flex-col gap-6 w-full">
      <div className="flex items-center gap-3 text-blue-500 mb-2">
        <ShoppingCart size={28} />
        <h2 className="text-2xl font-semibold m-0 text-slate-900 border-none">Einkaufsliste</h2>
      </div>

      <form onSubmit={handleAdd} className="flex gap-4 flex-wrap sm:flex-nowrap">
        <input 
          type="text" 
          className="flex-1 px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 transition-all font-medium text-slate-800 min-w-[200px]"
          placeholder="Neuer Artikel (z.B. Hafermilch)..."
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary m-0 whitespace-nowrap">
          <Plus size={20} />
          Hinzufügen
        </button>
      </form>

      {initialItems.length === 0 ? (
        <p className="text-center py-8 text-slate-500">Die Liste ist leer. Zeit für den Wocheneinkauf? 🥦</p>
      ) : (
        <ul className="flex flex-col gap-3 m-0 p-0">
          {initialItems.map(item => (
            <li 
              key={item.id} 
              className={`flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-xl transition-all ${item.checked ? 'opacity-60' : 'opacity-100'} ${loadingIds.has(item.id) ? 'animate-pulse' : ''}`}
            >
              <div 
                className="flex items-center gap-4 cursor-pointer flex-1"
                onClick={() => toggleCheck(item.id, item.checked)}
              >
                {item.checked ? (
                  <CheckCircle2 size={24} className="text-emerald-500" />
                ) : (
                  <Circle size={24} className="text-slate-400 cursor-pointer" />
                )}
                <span className={`text-lg font-medium ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {item.name}
                </span>
              </div>
              <button 
                onClick={() => deleteItem(item.id)}
                className="p-2 text-rose-400 hover:text-rose-600 transition-colors opacity-80 hover:opacity-100 bg-transparent border-none cursor-pointer"
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
