'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Circle, Trash2, Plus, ShoppingCart } from 'lucide-react';

export function ShoppingClient({ initialItems, initialCategories = ['Lebensmittel', 'Haushalt', 'Wishlist'] }: { initialItems: any[], initialCategories: string[] }) {
  const [activeCategory, setActiveCategory] = useState(initialCategories[0] || 'Lebensmittel');
  const [newItemName, setNewItemName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    await fetch('http://localhost:3000/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItemName.trim(), category: activeCategory })
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await fetch('http://localhost:3000/api/shopping/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName.trim() })
    });
    setActiveCategory(newCategoryName.trim());
    setNewCategoryName('');
    setShowAddCategory(false);
    router.refresh();
  };

  // Ensure items have category, default to 'Lebensmittel'
  const filteredItems = initialItems.filter(i => (i.category || 'Lebensmittel') === activeCategory);

  return (
    <div className="glass-panel p-8 max-w-3xl animate-fade-in flex flex-col gap-6 w-full">
      <div className="flex items-center gap-3 text-blue-500 mb-2">
        <ShoppingCart size={28} />
        <h2 className="text-2xl font-semibold m-0 text-slate-900 border-none">Einkaufsliste</h2>
      </div>

      {/* Categories Tabs */}
      <div className="flex flex-wrap gap-3 items-center">
        {initialCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border-none cursor-pointer ${
              activeCategory === cat 
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
                : 'bg-white text-slate-600 shadow-sm border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
        {!showAddCategory ? (
          <button 
            onClick={() => setShowAddCategory(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white text-slate-400 shadow-sm border border-slate-100 hover:text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Neue Kategorie"
          >
            <Plus size={18} />
          </button>
        ) : (
          <form onSubmit={handleAddCategory} className="flex gap-2 items-center">
            <input 
              type="text" 
              autoFocus
              className="px-4 py-2 rounded-full border border-slate-200 text-sm outline-none focus:border-blue-400 shadow-sm"
              placeholder="Name..."
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
            />
            <button type="submit" className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 border-none cursor-pointer">
              <CheckCircle2 size={16} />
            </button>
            <button type="button" onClick={() => setShowAddCategory(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 border-none cursor-pointer">
              ✕
            </button>
          </form>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-4 flex-wrap sm:flex-nowrap mt-2">
        <input 
          type="text" 
          className="flex-1 px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 transition-all font-medium text-slate-800 min-w-[200px]"
          placeholder={`Neuer Artikel in ${activeCategory}...`}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary m-0 whitespace-nowrap">
          <Plus size={20} />
          Hinzufügen
        </button>
      </form>

      {filteredItems.length === 0 ? (
        <p className="text-center py-10 font-medium text-slate-400">Alles da in der Kategorie <strong>{activeCategory}</strong>! 🥦</p>
      ) : (
        <ul className="flex flex-col gap-3 m-0 p-0">
          {filteredItems.map(item => (
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
