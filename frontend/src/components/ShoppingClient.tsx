import { useState } from 'react';
import { authFetch } from '../utils/authFetch';

export function ShoppingClient({ initialItems, onRefresh, wgId }: { initialItems: any[], initialCategories: string[], onRefresh: () => void, wgId: number }) {
  const [newItemNames, setNewItemNames] = useState<{ [key: string]: string }>({});
  const [isAtStore, setIsAtStore] = useState(false);
  const [localCategories, setLocalCategories] = useState<string[]>(['Lebensmittel', 'Haushalt', 'Wishlist']);
  const [newCategoryName, setNewCategoryName] = useState('');

  const categoryColors: { [key: string]: string } = {
    'Lebensmittel': 'bg-primary',
    'Haushalt': 'bg-secondary',
    'Wishlist': 'bg-accent-peach'
  };

  const addItem = async (cat: string) => {
    const itemName = newItemNames[cat];
    if (!itemName?.trim() || !wgId) return;

    await authFetch('/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: itemName.trim(), category: cat, wgId })
    });
    setNewItemNames(prev => ({ ...prev, [cat]: '' }));
    onRefresh();
  };

  const addCategory = () => {
    if (newCategoryName.trim() && !localCategories.includes(newCategoryName.trim())) {
      setLocalCategories([...localCategories, newCategoryName.trim()]);
      setNewCategoryName('');
    }
  };

  const deleteCategory = (cat: string) => {
    setLocalCategories(localCategories.filter(c => c !== cat));
  };

  const toggleItem = async (id: number, currentChecked: boolean) => {
    await authFetch(`/api/shopping/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !currentChecked })
    });
    onRefresh();
  };

  const deleteItem = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Verhindert das togglen beim Löschen
    if (window.confirm('Artikel wirklich löschen?')) {
      await authFetch(`/api/shopping/${id}`, {
        method: 'DELETE'
      });
      onRefresh();
    }
  };

  return (
    <div className="animate-fade-in w-full max-w-2xl mx-auto space-y-12 pb-32">
      
      {/* Live Status Toggle */}
      <section className="p-8 rounded-[2.5rem] bg-sage-soft/20 border border-sage-soft/30 chill-shadow">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-headline text-2xl font-bold text-primary mb-1">Einkaufen?</h2>
            <p className="text-on-surface-variant text-sm font-bold opacity-70 uppercase tracking-widest">Lass die WG wissen, dass du einkaufen bist</p>
          </div>
          <button 
            onClick={() => setIsAtStore(!isAtStore)}
            className={`w-16 h-10 rounded-full transition-all relative ${isAtStore ? 'bg-primary' : 'bg-stone-200'}`}
          >
            <div className={`absolute top-1 w-8 h-8 rounded-full bg-white shadow-sm transition-all ${isAtStore ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </section>

      {/* Add Category Section */}
      <section className="flex gap-4 px-2">
        <input 
          type="text" 
          placeholder="Neue Liste (z.B. Baumarkt)..."
          className="flex-1 px-6 py-4 rounded-2xl bg-white border border-outline-variant/20 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          value={newCategoryName}
          onChange={e => setNewCategoryName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCategory()}
        />
        <button 
          onClick={addCategory}
          className="px-8 py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
        >
          Liste erstellen
        </button>
      </section>

      {/* Categories Grid */}
      <div className="space-y-16">
        {localCategories.map(cat => {
          const catItems = initialItems.filter(i => (i.category || 'Lebensmittel') === cat);
          return (
            <section key={cat} className="animate-fade-in bg-white/50 p-8 rounded-[3.5rem] border border-outline-variant/10 shadow-sm relative">
              <button 
                onClick={() => deleteCategory(cat)}
                className="absolute top-8 right-8 text-on-surface-variant/30 hover:text-red-500 transition-colors"
                title="Liste löschen"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>

              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-10 ${categoryColors[cat] || 'bg-stone-300'} rounded-full`} />
                  <h3 className="font-headline text-3xl font-bold tracking-tighter text-on-surface">{cat}</h3>
                </div>
                <span className="text-[12px] font-bold text-primary uppercase tracking-[0.2em] opacity-40 mr-8">
                  {catItems.length.toString().padStart(2, '0')} Artikel
                </span>
              </div>

              <div className="space-y-4 mb-8">
                {catItems.map(item => (
                  <div key={item.id} className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between group chill-shadow border border-outline-variant/10 hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => toggleItem(item.id, item.checked)}>
                    <div className="flex items-center gap-6">
                      <div className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${item.checked ? 'bg-primary border-primary text-white scale-90' : 'border-stone-200 bg-stone-50'}`}>
                        {item.checked && <span className="material-symbols-outlined text-[20px] font-bold">check</span>}
                      </div>
                      <div className={item.checked ? 'opacity-40' : ''}>
                        <h4 className={`font-bold text-xl text-on-surface leading-tight ${item.checked ? 'line-through' : ''}`}>{item.name}</h4>
                        {!item.checked && item.id % 4 === 0 && (
                          <span className="inline-block mt-1 px-3 py-1 rounded-full bg-accent-peach/20 text-accent-peach text-[10px] font-bold uppercase tracking-[0.1em]">Dringend</span>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={(e) => deleteItem(e, item.id)}
                      className="w-10 h-10 rounded-full border border-outline-variant/10 flex items-center justify-center text-on-surface-variant/20 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}

                {catItems.length === 0 && (
                  <div className="text-center py-12 bg-stone-100/30 rounded-[2.5rem] border-2 border-dashed border-stone-200/50">
                    <p className="text-on-surface-variant font-bold text-sm tracking-tight opacity-30 uppercase">Alles da für {cat}</p>
                  </div>
                )}
              </div>

              {/* Individual Add Button per List */}
              <div className="flex gap-2 p-2 bg-stone-100/50 rounded-full">
                <input 
                  type="text" 
                  placeholder={`${cat} hinzufügen...`}
                  className="flex-1 px-6 py-3 rounded-full bg-transparent border-none text-sm font-bold focus:ring-0 transition-all"
                  value={newItemNames[cat] || ''}
                  onChange={(e) => setNewItemNames(prev => ({ ...prev, [cat]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addItem(cat)}
                />
                <button 
                  onClick={() => addItem(cat)}
                  className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
