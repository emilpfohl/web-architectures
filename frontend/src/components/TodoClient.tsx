import { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

export function TodoClient({ initialTodos, onRefresh, wgId, user }: { initialTodos: any[], onRefresh: () => void, wgId: number, user: any }) {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [assignee, setAssignee] = useState(user?.name || '');

  useEffect(() => {
    if (user?.name && !assignee) {
      setAssignee(user.name);
    }
  }, [user]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !wgId) return;

    await authFetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title: newTodoTitle.trim(), 
        assignee: assignee.trim() || user?.name || '',
        completed: false,
        wgId
      })
    });
    setNewTodoTitle('');
    setAssignee(user?.name || '');
    onRefresh();
  };

  const toggleTodo = async (id: number, currentCompleted: boolean) => {
    await authFetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !currentCompleted })
    });
    onRefresh();
  };

  return (
    <div className="animate-fade-in w-full max-w-2xl mx-auto space-y-10 pb-32">
      
      <header className="px-4">
        <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tighter">Aufgaben & Rotation</h2>
        <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.3em] mt-2 opacity-60">Halte den WG-Fluss am Laufen</p>
      </header>

      <div className="space-y-6">
        {initialTodos.map((todo: any) => (
          <div 
            key={todo.id} 
            onClick={() => toggleTodo(todo.id, todo.completed)}
            className={`
              bg-white p-8 rounded-[3.5rem] flex items-center justify-between group chill-shadow border border-outline-variant/10 transition-all cursor-pointer
              ${todo.completed ? 'opacity-30 grayscale scale-[0.98]' : 'hover:scale-[1.02] hover:bg-sage-soft/5'}
            `}
          >
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-primary border-primary text-white scale-90' : 'border-stone-200 bg-stone-50'}`}>
                {todo.completed ? <span className="material-symbols-outlined text-3xl font-bold">check</span> : <span className="material-symbols-outlined text-stone-300 text-3xl">assignment</span>}
              </div>
              <div>
                <h4 className={`font-bold text-2xl text-on-surface leading-tight ${todo.completed ? 'line-through' : ''}`}>{todo.title}</h4>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{todo.assignee}</span>
                  <span className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">Aktiv • {todo.id % 2 === 0 ? 'Dringend' : 'Routine'}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right pr-2">
              <span className="text-primary font-headline font-bold text-2xl tracking-tighter">{(todo.id * 150 + 400).toString()}</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-40">Pkt</p>
            </div>
          </div>
        ))}

        {initialTodos.length === 0 && (
          <div className="text-center py-24 bg-stone-100/50 rounded-[3.5rem] border-2 border-dashed border-stone-200">
            <span className="material-symbols-outlined text-7xl text-stone-300 mb-6 block">fact_check</span>
            <p className="text-on-surface-variant font-bold text-sm tracking-widest opacity-40 uppercase">Alle Aufgaben erledigt</p>
          </div>
        )}
      </div>

      {/* Adding Chore Interface via FAB style */}
      <div className="fixed bottom-32 right-8 z-50 flex flex-col items-end gap-6">
        {newTodoTitle && (
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-outline-variant/30 animate-fade-in flex flex-col gap-5 min-w-[300px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-2">Zuweisen</p>
            <input 
              type="text" 
              placeholder="Wer ist zuständig?"
              className="w-full px-6 py-4 rounded-2xl bg-stone-100 border-none text-sm font-black focus:ring-2 focus:ring-primary/20 transition-all"
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
            />
          </div>
        )}
        <form onSubmit={addTodo} className="flex items-center gap-4 translate-y-2">
          <input 
            id="todo-title-input"
            data-testid="todo-title-input"
            type="text" 
            placeholder="Neue Aufgabe eintragen..."
            className="w-full max-w-[260px] px-8 py-5 rounded-full bg-white shadow-2xl border-2 border-primary/10 focus:outline-none focus:border-primary/40 text-sm font-black transition-all"
            value={newTodoTitle}
            onChange={e => setNewTodoTitle(e.target.value)}
          />
          <button id="add-todo-btn" data-testid="add-todo-btn" type="submit" className="w-20 h-20 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-4xl font-black">add_task</span>
          </button>
        </form>
      </div>

    </div>
  );
}
