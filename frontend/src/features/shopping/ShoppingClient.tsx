import { useEffect, useRef, useState } from 'react';
import { authFetch } from '../../shared/lib/authFetch';
import { prepareShoppingItemInput } from '../../shared/lib/logic';
import { socket } from '../../shared/lib/socket';

export function ShoppingClient({ initialItems, onRefresh, wgId, isDarkMode = false, isAtStore = false, onToggleAtStore }: { initialItems: any[], initialCategories: string[], onRefresh: () => void, wgId: number, isDarkMode?: boolean, isAtStore?: boolean, onToggleAtStore?: (isAtStore: boolean) => void }) {
  const [newItemNames, setNewItemNames] = useState<{ [key: string]: string }>({});
  const [localCategories, setLocalCategories] = useState<string[]>(['Lebensmittel', 'Haushalt', 'Wishlist']);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const activeInputRef = useRef<HTMLInputElement | null>(null);

  const categoryColors: { [key: string]: string } = {
    'Lebensmittel': 'bg-primary',
    'Haushalt': 'bg-secondary',
    'Wishlist': 'bg-accent-peach'
  };

  const toggleAtStore = async () => {
    const nextValue = !isAtStore;
    onToggleAtStore?.(nextValue);
    if (!wgId) return;
    await authFetch('/api/users/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wgId, isShopping: nextValue })
    });
  };

  const addItem = async (cat: string) => {
    const itemName = newItemNames[cat];
    const preparedItem = prepareShoppingItemInput(itemName, cat);
    if (!preparedItem.isValid || !wgId) return;

    const response = await authFetch('/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: preparedItem.name, category: preparedItem.category, wgId })
    });
    if (!response.ok) return;

    const newEntry = await response.json();
    socket.emit('chat eintrag', {
      wgId,
      entry: newEntry
    });

    setNewItemNames(prev => ({ ...prev, [cat]: '' }));
    setActiveCategory(null);
    onRefresh();
  };

  useEffect(() => {
    if (activeCategory) {
      activeInputRef.current?.focus();
    }
  }, [activeCategory]);

  useEffect(() => {
    const handleChatEintrag = (payload: { wgId?: number }) => {
      if (!payload?.wgId || payload.wgId !== wgId) return;
      onRefresh();
    };

    socket.on('chat eintrag', handleChatEintrag);

    return () => {
      socket.off('chat eintrag', handleChatEintrag);
    };
  }, [wgId, onRefresh]);

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
    <div className={`animate-fade-in w-full max-w-2xl mx-auto space-y-12 pb-32 ${isDarkMode ? 'text-white' : ''}`} data-cy="shopping-view">

      {/* Live Status Toggle */}
      <section className={`p-8 rounded-[2.5rem] border chill-shadow ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-sage-soft/20 border-sage-soft/30'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`font-headline text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-primary'}`}>Einkaufen?</h2>
            <p className={`text-sm font-bold opacity-70 uppercase tracking-widest ${isDarkMode ? 'text-white/80' : 'text-on-surface-variant'}`}>Lass die WG wissen, dass du einkaufen bist</p>
          </div>
          <button
            onClick={toggleAtStore}
            data-cy="toggle-at-store"
            className={`w-16 h-10 rounded-full transition-all relative ${isAtStore ? 'bg-primary' : isDarkMode ? 'bg-black/30' : 'bg-stone-200'}`}
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
          className={`flex-1 px-6 py-4 rounded-2xl border text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-sm ${isDarkMode ? 'bg-black/20 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-outline-variant/20'}`}
          value={newCategoryName}
          onChange={e => setNewCategoryName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addCategory()}
        />
        <button
          onClick={addCategory}
          className={`px-8 py-4 rounded-2xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg ${isDarkMode ? 'bg-white/20 text-white border border-white/30' : 'bg-primary text-white'}`}
        >
          Liste erstellen
        </button>
      </section>

      {/* Categories Grid */}
      <div className="space-y-16">
        {localCategories.map(cat => {
          const catItems = initialItems.filter(i => (i.category || 'Lebensmittel') === cat);
          const isActive = activeCategory === cat;
          return (
            <section
              key={cat}
              data-cy={`shopping-category-${cat}`}
              className={`animate-fade-in p-8 rounded-[3.5rem] border shadow-sm relative ${isDarkMode ? 'bg-black/15 border-white/10' : 'bg-white/50 border-outline-variant/10'}`}
            >
              <button
                onClick={() => deleteCategory(cat)}
                className={`absolute top-8 right-8 transition-colors ${isDarkMode ? 'text-white/40 hover:text-red-300' : 'text-on-surface-variant/30 hover:text-red-500'}`}
                title="Liste löschen"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>

              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-10 ${categoryColors[cat] || 'bg-stone-300'} rounded-full`} />
                  <h3 className={`font-headline text-3xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>{cat}</h3>
                </div>
                <span className={`text-[12px] font-bold uppercase tracking-[0.2em] mr-8 ${isDarkMode ? 'text-white/60' : 'text-primary opacity-40'}`}>
                  {catItems.length.toString().padStart(2, '0')} Artikel
                </span>
              </div>

              <div className="space-y-4 mb-6">
                {catItems.map(item => (
                  <div key={item.id} data-cy={`shopping-item-${item.id}`} className={`p-6 rounded-[2.5rem] flex items-center justify-between group chill-shadow border hover:scale-[1.02] transition-transform cursor-pointer ${isDarkMode ? 'bg-black/20 border-white/10' : 'bg-white border-outline-variant/10'}`} onClick={() => toggleItem(item.id, item.checked)}>
                    <div className="flex items-center gap-6">
                      <div className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${item.checked ? 'bg-primary border-primary text-white scale-90' : isDarkMode ? 'border-white/30 bg-black/20' : 'border-stone-200 bg-stone-50'}`}>
                        {item.checked && <span className="material-symbols-outlined text-[20px] font-bold">check</span>}
                      </div>
                      <div className={item.checked ? 'opacity-40' : ''}>
                        <h4 className={`font-bold text-xl leading-tight ${isDarkMode ? 'text-white' : 'text-on-surface'} ${item.checked ? 'line-through' : ''}`}>{item.name}</h4>
                        {!item.checked && item.id % 4 === 0 && (
                          <span className="inline-block mt-1 px-3 py-1 rounded-full bg-accent-peach/20 text-accent-peach text-[10px] font-bold uppercase tracking-[0.1em]">Dringend</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => deleteItem(e, item.id)}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isDarkMode ? 'border-white/10 text-white/40 hover:text-red-300 hover:bg-red-950/40' : 'border-outline-variant/10 text-on-surface-variant/20 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}

                {catItems.length === 0 && (
                  <div className={`text-center py-12 rounded-[2.5rem] border-2 border-dashed ${isDarkMode ? 'bg-black/10 border-white/10' : 'bg-stone-100/30 border-stone-200/50'}`}>
                    <p className={`font-bold text-sm tracking-tight uppercase ${isDarkMode ? 'text-white/40' : 'text-on-surface-variant opacity-30'}`}>Alles da für {cat}</p>
                  </div>
                )}
              </div>

              {isActive ? (
                <form
                  className={`flex gap-2 p-2 rounded-full ${isDarkMode ? 'bg-black/20' : 'bg-stone-100/50'}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    addItem(cat);
                  }}
                >
                  <input
                    ref={activeInputRef}
                    type="text"
                    placeholder={`${cat} hinzufügen...`}
                    className={`flex-1 px-6 py-3 rounded-full bg-transparent border-none text-sm font-bold focus:ring-0 transition-all ${isDarkMode ? 'text-white placeholder:text-white/50' : ''}`}
                    value={newItemNames[cat] || ''}
                    onChange={(e) => setNewItemNames(prev => ({ ...prev, [cat]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Escape' && setActiveCategory(null)}
                    data-cy={`new-item-input-${cat}`}
                  />
                  <button
                    type="submit"
                    className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                    data-cy={`new-item-submit-${cat}`}
                  >
                    <span className="material-symbols-outlined">add</span>
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  data-cy={`add-item-toggle-${cat}`}
                  className={`w-full mt-2 px-6 py-4 rounded-[2rem] border-2 border-dashed text-left text-sm font-bold uppercase tracking-[0.2em] transition-all ${isDarkMode ? 'border-white/20 text-white/60 hover:text-white hover:border-white/40 hover:bg-white/10' : 'border-stone-200 text-on-surface-variant/40 hover:text-primary hover:border-primary/20 hover:bg-primary/5'}`}
                >
                  Eintrag hinzufügen
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
