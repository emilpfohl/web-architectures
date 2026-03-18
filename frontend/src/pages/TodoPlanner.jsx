import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, User, Plus } from 'lucide-react';

const API_URL = 'http://localhost:3000/api/todos';

export default function TodoPlanner() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setTodos(data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching todos:", err));
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || !assignee.trim()) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), assignee: assignee.trim() })
      });
      const data = await res.json();
      setTodos([...todos, data]);
      setTitle('');
      setAssignee('');
    } catch (err) {
      console.error("Error adding todo:", err);
    }
  };

  const toggleTodo = async (id, currentCompleted) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentCompleted })
      });
      const data = await res.json();
      setTodos(todos.map(t => t.id === id ? data : t));
    } catch (err) {
      console.error("Error toggling todo:", err);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <h1>WG Putz- & Todo Planer 🧹</h1>
        <p>Wer ist dran mit was?</p>
      </header>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Aufgabe (z.B. Küche putzen)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ flex: 2, margin: 0, minWidth: '200px' }}
          />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Zuständig (z.B. Max)..."
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            style={{ flex: 1, margin: 0, minWidth: '120px' }}
          />
          <button type="submit" className="btn btn-primary">
            <Plus size={20} />
            Neuer Task
          </button>
        </form>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Lädt...</p>
        ) : todos.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Wow, keine Aufgaben! Habt ihr schon alles erledigt? ✨
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {todos.map(todo => (
              <div 
                key={todo.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1.5rem',
                  padding: '1.25rem',
                  background: 'white', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                  borderLeft: `4px solid ${todo.completed ? 'var(--accent-green)' : 'var(--text-secondary)'}`,
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  opacity: todo.completed ? 0.6 : 1
                }}
              >
                <div onClick={() => toggleTodo(todo.id, todo.completed)} style={{ cursor: 'pointer' }}>
                  {todo.completed ? (
                    <CheckSquare size={28} color="var(--accent-green)" />
                  ) : (
                    <Square size={28} color="var(--text-secondary)" />
                  )}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    marginBottom: '0.25rem',
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    color: todo.completed ? 'var(--text-secondary)' : 'var(--text-primary)'
                  }}>
                    {todo.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <User size={14} />
                    <span>Zuständig: <strong>{todo.assignee}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
