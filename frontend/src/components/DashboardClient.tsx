'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, CheckSquare, Wallet, CheckCircle2, Circle, Square, Plus } from 'lucide-react';
import Link from 'next/link';

export function DashboardClient({ shopping, todos, finances }: { shopping: any[], todos: any[], finances: any[] }) {
  const router = useRouter();

  const toggleShopping = async (id: number, currentChecked: boolean) => {
    await fetch(`http://localhost:3000/api/shopping/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checked: !currentChecked })
    });
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

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  const quickAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !amount || !paidBy.trim()) return;

    await fetch('http://localhost:3000/api/finances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        description: desc.trim(), 
        amount: parseFloat(amount), 
        paidBy: paidBy.trim() 
      })
    });
    setDesc('');
    setAmount('');
    setPaidBy('');
    router.refresh();
  };

  const missingItems = shopping.filter((i: any) => !i.checked);
  const openTodos = todos.filter((i: any) => !i.completed);
  const totalFinances = finances.reduce((sum: number, exp: any) => sum + exp.amount, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in w-full pb-8">
      
      {/* SHOPPING QUICK VIEW */}
      <div className="glass-panel p-8 flex flex-col gap-4">
        <Link href="/?tab=shopping" className="flex items-center gap-3 text-blue-500 hover:opacity-80 transition-opacity no-underline">
          <ShoppingCart size={28} />
          <h2 className="text-2xl font-semibold m-0 text-slate-900 border-none">Einkauf</h2>
        </Link>
        <p className="text-slate-600 mb-2">
          {missingItems.length === 0 ? "Alles besorgt! 🎉" : `${missingItems.length} Artikel fehlen.`}
        </p>
        
        <div className="flex flex-col gap-2">
          {missingItems.slice(0, 3).map(item => (
            <div 
              key={item.id} 
              onClick={() => toggleShopping(item.id, item.checked)}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Circle size={20} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-800 font-medium truncate">{item.name}</span>
            </div>
          ))}
          {missingItems.length > 3 && (
            <div className="text-sm text-slate-500 text-center mt-1">
              + {missingItems.length - 3} weitere
            </div>
          )}
        </div>
      </div>

      {/* TODO QUICK VIEW */}
      <div className="glass-panel p-8 flex flex-col gap-4">
        <Link href="/?tab=todos" className="flex items-center gap-3 text-violet-500 hover:opacity-80 transition-opacity no-underline">
          <CheckSquare size={28} />
          <h2 className="text-2xl font-semibold m-0 text-slate-900 border-none">Putzplan</h2>
        </Link>
        <p className="text-slate-600 mb-2">
          {openTodos.length === 0 ? "Keine offenen Aufgaben. ✨" : "Die nächsten Aufgaben:"}
        </p>

        <div className="flex flex-col gap-2">
          {openTodos.slice(0, 2).map((todo: any) => (
            <div 
              key={todo.id} 
              onClick={() => toggleTodo(todo.id, todo.completed)}
              className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Square size={20} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-slate-800 font-medium truncate">{todo.title}</span>
                <span className="text-xs text-slate-500 mt-0.5">{todo.assignee}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FINANCE QUICK VIEW */}
      <div className="glass-panel p-8 flex flex-col gap-4">
        <Link href="/?tab=finance" className="flex items-center gap-3 text-emerald-500 hover:opacity-80 transition-opacity no-underline">
          <Wallet size={28} />
          <h2 className="text-2xl font-semibold m-0 text-slate-900 border-none">Finanzen</h2>
        </Link>
        <p className="text-slate-600 mb-2">Gesamtausgaben: <strong className="text-slate-900">{totalFinances.toFixed(2)} €</strong></p>

        <form onSubmit={quickAddExpense} className="flex flex-col gap-3 mt-auto bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 m-0">Schnell-Ausgabe</h3>
          <input 
            type="text" 
            placeholder="Wofür?" 
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-400"
            value={desc} onChange={e => setDesc(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="number" 
              step="0.01" 
              placeholder="0.00 €" 
              className="w-full sm:w-1/2 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-400"
              value={amount} onChange={e => setAmount(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Wer?" 
              className="w-full sm:w-1/2 px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-400"
              value={paidBy} onChange={e => setPaidBy(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-sm font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors border-none cursor-pointer">
            <Plus size={16} /> Hintragen
          </button>
        </form>
      </div>

    </div>
  );
}
