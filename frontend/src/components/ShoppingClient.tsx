import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function ShoppingClient({ initialItems, initialCategories = ['Lebensmittel', 'Haushalt', 'Wishlist'], onRefresh }: { initialItems: any[], initialCategories: string[], onRefresh: () => void }) {
  const navigate = useNavigate();
  const [newItemName, setNewItemName] = useState('');
  const [activeCategory, setActiveCategory] = useState(initialCategories[0] || 'Essentials');
  const [isAtStore, setIsAtStore] = useState(false);

  const categoryColors: { [key: string]: string } = {
    'Essentials': 'bg-primary',
    'Snacks': 'bg-secondary',
    'Household': 'bg-accent-peach',
    'Lebensmittel': 'bg-primary',
    'Haushalt': 'bg-secondary',
    'Wishlist': 'bg-accent-peach'
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    await fetch('/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newItemName.trim(), category: activeCategory, wgId: 1 })
    });
    setNewItemName('');
    onRefresh();
  };

  const toggleItem = async (id: number, currentChecked: boolean) => {
    await fetch(`/api/shopping/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !currentChecked })
    });
    onRefresh();
  };

  return (
    <div className="animate-fade-in w-full max-w-2xl mx-auto space-y-12 pb-32">
      
      {/* Live Status Toggle */}
      <section className="p-8 rounded-[2.5rem] bg-sage-soft/20 border border-sage-soft/30 chill-shadow">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-headline text-2xl font-bold text-primary mb-1">Stocking Up?</h2>
            <p className="text-on-surface-variant text-sm font-bold opacity-70 uppercase tracking-widest">Let the flat know you're at the store</p>
          </div>
          <button 
            onClick={() => setIsAtStore(!isAtStore)}
            className={`w-16 h-10 rounded-full transition-all relative ${isAtStore ? 'bg-primary' : 'bg-stone-200'}`}
          >
            <div className={`absolute top-1 w-8 h-8 rounded-full bg-white shadow-sm transition-all ${isAtStore ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </section>

      {/* Categories Grid */}
      <div className="space-y-16">
        {initialCategories.map(cat => {
          const catItems = initialItems.filter(i => (i.category || 'Essentials') === cat);
          return (
            <section key={cat} className="animate-fade-in">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-10 ${categoryColors[cat] || 'bg-primary'} rounded-full`} />
                  <h3 className="font-headline text-3xl font-bold tracking-tighter text-on-surface">{cat}</h3>
                </div>
                <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] opacity-40">
                  {catItems.length.toString().padStart(2, '0')} Items
                </span>
              </div>

              <div className="space-y-4">
                {catItems.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between group chill-shadow border border-outline-variant/10 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => toggleItem(item.id, item.checked)}>
                    <div className="flex items-center gap-6">
                      <div className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${item.checked ? 'bg-primary border-primary text-white scale-90' : 'border-stone-200 bg-stone-50'}`}>
                        {item.checked && <span className="material-symbols-outlined text-[20px] font-bold">check</span>}
                      </div>
                      <div className={item.checked ? 'opacity-40' : ''}>
                        <h4 className={`font-bold text-xl text-on-surface leading-tight ${item.checked ? 'line-through' : ''}`}>{item.name}</h4>
                        {!item.checked && item.id % 4 === 0 && (
                          <span className="inline-block mt-1 px-3 py-1 rounded-full bg-accent-peach/20 text-accent-peach text-[10px] font-bold uppercase tracking-[0.1em]">Urgent</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center -space-x-3 opacity-80">
                      <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZJEUoIHFV4RkKBkaZUOOO14SoJ8Lm_KK7S4fmuL6OpQKgnKlWtFvHXasTPSEBf4B7x4sURs-Zh_q5_u9KZ5jXv3LRMgq8hIDHr1mwHYmcHPyc1xe-QSVWwoKxkaWGObnQQ1xSTzPPCuD3n014KT2-jzYr597GzlfHzFaKmPyklEZX17z_rSOCzAieFVEfiQWnn0VLXtCaDYa-Xv8Xrz9eZ49hcrS0tczS2yh6JIiWamSYVLJwMIwErBaDIKz6rxUrGcAqXD64fvIW" alt="assigned"/>
                      <div className="w-10 h-10 rounded-full bg-sage-soft border-2 border-white flex items-center justify-center text-[10px] font-black text-primary">+1</div>
                    </div>
                  </div>
                ))}

                {catItems.length === 0 && (
                  <div className="text-center py-12 bg-stone-100/50 rounded-[2.5rem] border-2 border-dashed border-stone-200">
                    <p className="text-on-surface-variant font-bold text-sm tracking-tight opacity-40 uppercase">Inventory full for {cat}</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* Custom Addition FAB Interface */}
      <div className="fixed bottom-32 right-8 z-50 flex flex-col items-end gap-6">
        {newItemName && (
          <div className="bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-outline-variant/30 animate-fade-in flex flex-col gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-2">Category</p>
            <div className="flex gap-2">
              {initialCategories.map(c => (
                <button 
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === c ? 'bg-primary text-white' : 'bg-stone-100 text-on-surface-variant hover:bg-stone-200'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={addItem} className="flex items-center gap-4 translate-y-2">
          <input 
            id="shopping-item-input"
            data-testid="shopping-item-input"
            type="text" 
            placeholder="Stock item name..."
            className="w-full max-w-[240px] px-8 py-5 rounded-full bg-white shadow-2xl border-2 border-primary/10 focus:outline-none focus:border-primary/40 text-sm font-black transition-all"
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
          />
          <button id="add-shopping-item-btn" data-testid="add-shopping-item-btn" type="submit" className="w-20 h-20 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-4xl font-black">add</span>
          </button>
        </form>
      </div>

    </div>
  );
}
