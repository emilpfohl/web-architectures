import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';

const API_URL = 'http://localhost:3000/api/shopping';

export default function ShoppingList() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching shopping list:", err));
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName.trim() })
      });
      const data = await res.json();
      setItems([...items, data]);
      setNewItemName('');
    } catch (err) {
      console.error("Error adding item:", err);
    }
  };

  const toggleCheck = async (id, currentChecked) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: !currentChecked })
      });
      const data = await res.json();
      setItems(items.map(item => item.id === id ? data : item));
    } catch (err) {
      console.error("Error toggling item:", err);
    }
  };

  const deleteItem = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <h1>Einkaufsliste 🛒</h1>
        <p>Was fehlt uns noch in der WG?</p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Neuer Artikel (z.B. Hafermilch)..."
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
          <button type="submit" className="btn btn-primary">
            <Plus size={20} />
            Hinzufügen
          </button>
        </form>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Lädt...</p>
        ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Die Liste ist leer. Zeit für den Wocheneinkauf? 🥦
          </p>
        ) : (
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {items.map(item => (
              <li 
                key={item.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  background: 'white', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                  borderRadius: '12px',
                  transition: 'background 0.2s',
                  opacity: item.checked ? 0.6 : 1
                }}
              >
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flex: 1 }}
                  onClick={() => toggleCheck(item.id, item.checked)}
                >
                  {item.checked ? (
                    <CheckCircle2 size={24} color="var(--accent-green)" />
                  ) : (
                    <Circle size={24} color="var(--text-secondary)" />
                  )}
                  <span style={{ 
                    fontSize: '1.1rem',
                    textDecoration: item.checked ? 'line-through' : 'none',
                    color: item.checked ? 'var(--text-secondary)' : 'var(--text-primary)'
                  }}>
                    {item.name}
                  </span>
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '0.5rem', opacity: 0.8, transition: 'opacity 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
                >
                  <Trash2 size={20} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
