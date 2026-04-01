'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Square, User, Plus } from 'lucide-react';

export function TodoClient({ initialTodos }: { initialTodos: any[] }) {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const router = useRouter();

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignee.trim()) return;

    await fetch('http://localhost:3000/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), assignee: assignee.trim() })
    });
    setTitle('');
    setAssignee('');
    router.refresh();
  };

  const toggleTodo = async (id: number, currentCompleted: boolean) => {
    await fetch(`http://localhost:3000/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !currentCompleted })
    });
    router.refresh();
  };

  return (
    <div className="glass-panel p-8 max-w-3xl animate-fade-in flex flex-col gap-6 w-full">
      <div className="flex items-center gap-3 text-violet-500 mb-2">
        <CheckSquare size={28} />
        <h2 className="text-2xl font-semibold m-0 text-slate-900 border-none">WG Putz- & Todo Planer 🧹</h2>
      </div>

      <form onSubmit={handleCreateTask} className="flex gap-3 flex-col sm:flex-row mt-2">
        <input 
          type="text" 
          className="flex-[2] px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-violet-200 transition-all font-medium text-slate-800"
          placeholder="Aufgabe (z.B. Küche putzen)..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input 
          type="text" 
          className="flex-1 px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-violet-200 transition-all font-medium text-slate-800"
          placeholder="Wer? (Max)"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        />
        <button type="submit" className="btn btn-primary m-0 whitespace-nowrap h-[52px]">
          <Plus size={20} />
          Neuer Task
        </button>
      </form>

      {initialTodos.length === 0 ? (
        <p className="text-center py-8 text-slate-500">Wow, keine Aufgaben! Habt ihr schon alles erledigt? ✨</p>
      ) : (
        <div className="flex flex-col gap-4">
          {initialTodos.map(todo => (
            <div 
              key={todo.id} 
              className={`flex items-center gap-6 p-5 bg-white border border-slate-100 shadow-sm rounded-xl transition-all ${todo.completed ? 'opacity-60 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-slate-300'}`}
            >
              <div onClick={() => toggleTodo(todo.id, todo.completed)} className="cursor-pointer">
                {todo.completed ? (
                  <CheckSquare size={28} className="text-emerald-500" />
                ) : (
                  <Square size={28} className="text-slate-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className={`text-xl font-semibold mb-1 ${todo.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {todo.title}
                </h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <User size={14} />
                  <span>Zuständig: <strong className="text-slate-700">{todo.assignee}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
