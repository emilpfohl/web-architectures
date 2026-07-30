import { useState, useEffect } from 'react';
import { authFetch } from '../../shared/lib/authFetch';
import { buildTodoDisplayState } from '../../shared/lib/logic';
import { getAccountInitials } from '../../shared/lib/logic';

export function TodoClient({ initialTodos, onRefresh, wgId }: { initialTodos: any[], onRefresh: () => void, wgId: number, user: any }) {
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [openAssignMenuId, setOpenAssignMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (!wgId) return;
    authFetch(`/api/users?wgId=${wgId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));
  }, [wgId]);

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !wgId) return;

    await authFetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTodoTitle.trim(),
        completed: false,
        wgId
      })
    });
    setNewTodoTitle('');
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

  const assignTodo = async (e: React.MouseEvent, id: number, assigneeId: number | null) => {
    e.stopPropagation();
    await authFetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigneeId })
    });
    setOpenAssignMenuId(null);
    onRefresh();
  };

  return (
    <div className="animate-fade-in w-full max-w-2xl mx-auto space-y-10 pb-32" data-cy="todos-view">

      <header className="px-4">
        <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tighter">Aufgaben & Rotation</h2>
        <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.3em] mt-2 opacity-60">Halte den WG-Fluss am Laufen</p>
      </header>

      <div className="space-y-6">
        {initialTodos.map((todo: any) => (
          (() => {
            const displayTodo = buildTodoDisplayState(todo);
            const hasAssignee = !!todo.assigneeId;
            const isMenuOpen = openAssignMenuId === todo.id;
            return (
          <div
            key={displayTodo.id || todo.id}
            data-cy={`todo-item-${todo.id}`}
            onClick={() => toggleTodo(todo.id, todo.completed)}
            className={`
              relative bg-white p-8 rounded-[3.5rem] flex items-center justify-between group chill-shadow border border-outline-variant/10 transition-all cursor-pointer
              ${todo.completed ? 'opacity-30 grayscale scale-[0.98]' : 'hover:scale-[1.02] hover:bg-sage-soft/5'}
            `}
          >
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-primary border-primary text-white scale-90' : 'border-stone-200 bg-stone-50'}`}>
                {todo.completed ? <span className="material-symbols-outlined text-3xl font-bold">check</span> : <span className="material-symbols-outlined text-stone-300 text-3xl">assignment</span>}
              </div>
              <div>
                <h4 className={`font-bold text-2xl text-on-surface leading-tight ${displayTodo.isCompleted ? 'line-through' : ''}`}>{displayTodo.title}</h4>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">{displayTodo.isCompleted ? 'Routine' : 'Aktiv'} • {displayTodo.urgencyLabel}</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center gap-2 pr-2" onClick={e => e.stopPropagation()}>
              {hasAssignee ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setOpenAssignMenuId(isMenuOpen ? null : todo.id); }}
                  data-cy={`todo-assignee-${todo.id}`}
                  className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-black uppercase hover:scale-105 transition-transform"
                  title={displayTodo.assignee}
                >
                  {getAccountInitials(displayTodo.assignee)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setOpenAssignMenuId(isMenuOpen ? null : todo.id); }}
                  data-cy={`todo-assign-button-${todo.id}`}
                  className="w-10 h-10 rounded-full border-2 border-dashed border-stone-300 text-stone-400 flex items-center justify-center hover:border-primary/40 hover:text-primary transition-all"
                  title="Zuweisen"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                </button>
              )}

              {isMenuOpen && (
                <div
                  data-cy={`todo-assign-menu-${todo.id}`}
                  className="absolute right-0 top-12 z-20 bg-white rounded-3xl shadow-2xl border border-outline-variant/20 p-3 flex flex-col gap-1 min-w-[180px] animate-fade-in"
                >
                  <button
                    type="button"
                    onClick={(e) => assignTodo(e, todo.id, null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-100 transition-colors text-left"
                  >
                    <span className="w-8 h-8 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-[16px] material-symbols-outlined">person_off</span>
                    <span className="text-sm font-bold text-on-surface-variant">Frei</span>
                  </button>
                  {members.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={(e) => assignTodo(e, todo.id, m.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-stone-100 transition-colors text-left"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-black uppercase">
                        {getAccountInitials(m.name)}
                      </span>
                      <span className="text-sm font-bold text-on-surface">{m.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
            );
          })()
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
        <form onSubmit={addTodo} className="flex items-center gap-4 translate-y-2">
          <input
            id="todo-title-input"
            data-testid="todo-title-input"
            data-cy="todo-title-input"
            type="text"
            placeholder="Neue Aufgabe eintragen..."
            className="w-full max-w-[260px] px-8 py-5 rounded-full bg-white shadow-2xl border-2 border-primary/10 focus:outline-none focus:border-primary/40 text-sm font-black transition-all"
            value={newTodoTitle}
            onChange={e => setNewTodoTitle(e.target.value)}
          />
          <button id="add-todo-btn" data-testid="add-todo-btn" data-cy="add-todo-button" type="submit" className="w-20 h-20 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-4xl font-black">add_task</span>
          </button>
        </form>
      </div>

    </div>
  );
}
