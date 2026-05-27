import { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

export function FinanceClient({ initialExpenses, onRefresh, wgId, user }: { initialExpenses: any[], onRefresh: () => void, wgId: number, user: any }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(user?.name || '');

  useEffect(() => {
    if (user?.name && !paidBy) {
      setPaidBy(user.name);
    }
  }, [user]);

  const total = initialExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Group by user to show balance
  const userBalances = initialExpenses.reduce((acc: any, exp: any) => {
    acc[exp.paidBy] = (acc[exp.paidBy] || 0) + exp.amount;
    return acc;
  }, {});

  const members = Object.keys(userBalances);
  const averagePerPerson = members.length > 0 ? total / members.length : 0;

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !wgId) return;

    await authFetch('/api/finances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        description: description.trim(), 
        amount: parseFloat(amount), 
        paidBy: paidBy.trim() || user?.name || '',
        paidById: user?.id || 1,
        wgId
      })
    });
    setDescription('');
    setAmount('');
    setPaidBy(user?.name || '');
    onRefresh();
  };

  return (
    <div className="animate-fade-in w-full max-w-2xl mx-auto space-y-12 pb-32">
      
      <header className="px-4">
        <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tighter">Gemeinsame Ausgaben</h2>
        <p className="text-on-surface-variant font-bold text-[10px] uppercase tracking-[0.3em] mt-2 opacity-60">WG-Finanzen im Überblick</p>
      </header>

      {/* Balance Card */}
      <section className="bg-primary p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden transition-all hover:scale-[1.01] cursor-pointer">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60 mb-3">Gesamtausgaben</p>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-bold tracking-tighter">{total.toFixed(2)}</span>
            <span className="text-2xl font-bold opacity-40">€</span>
          </div>
          
          <div className="mt-8 space-y-2 border-t border-white/10 pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-4">Einzelbilanzen (Soll: {averagePerPerson.toFixed(2)}€ p.P.)</p>
            {members.map(m => {
              const diff = userBalances[m] - averagePerPerson;
              return (
                <div key={m} className="flex justify-between items-center bg-white/5 px-6 py-3 rounded-2xl">
                  <span className="font-bold text-sm tracking-tight">{m}</span>
                  <span className={`font-headline font-bold text-lg ${diff >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {diff >= 0 ? '+' : ''}{diff.toFixed(2)}€
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex gap-4">
            <button className="btn bg-white/20 backdrop-blur-xl text-white border-none hover:bg-white/30 text-xs py-4 px-8 font-bold uppercase tracking-widest">
              Details
            </button>
            <button 
              className="btn bg-white text-primary border-none hover:scale-105 text-xs py-4 px-8 font-bold uppercase tracking-widest"
              onClick={async () => {
                if (window.confirm('Möchtest du wirklich alle Ausgaben für alle abrechnen?')) {
                  await authFetch(`/api/finances/settle?wgId=${wgId}`, { method: 'POST' });
                  onRefresh();
                }
              }}
            >
              Für alle abrechnen
            </button>
          </div>
        </div>
        {/* Abstract background elements */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl opacity-30"></div>
      </section>

      {/* Transaction List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-6">
          <h3 className="font-headline text-xl font-black text-on-surface">Buchungen</h3>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{initialExpenses.length} Einträge</span>
        </div>
        
        <div className="space-y-4">
          {initialExpenses.slice().reverse().map((exp: any) => (
            <div key={exp.id} className="bg-white p-7 rounded-[2.5rem] flex items-center justify-between border border-outline-variant/10 chill-shadow group hover:bg-stone-50 transition-all cursor-default">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-sage-soft/40 flex items-center justify-center text-primary transition-all group-hover:scale-110 group-hover:bg-sage-soft/60">
                  <span className="material-symbols-outlined text-3xl font-bold">payments</span>
                </div>
                <div>
                  <h4 className="font-bold text-xl text-on-surface leading-tight tracking-tight">{exp.description}</h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">{exp.paidBy}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">Eingetragen • Heute</span>
                  </div>
                </div>
              </div>
              <div className="text-right pr-2">
                <span className="font-headline font-bold text-2xl text-on-surface tracking-tighter">-{exp.amount.toFixed(2)}€</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant opacity-40 mt-1">Beglichen</p>
              </div>
            </div>
          ))}

          {initialExpenses.length === 0 && (
            <div className="text-center py-24 bg-stone-100/50 rounded-[4rem] border-2 border-dashed border-stone-200">
              <span className="material-symbols-outlined text-7xl text-stone-300 mb-6 block">account_balance_wallet</span>
              <p className="text-on-surface-variant font-bold text-sm tracking-widest opacity-40 uppercase">Keine Ausgaben vorhanden</p>
            </div>
          )}
        </div>
      </section>

      {/* Expense Addition FAB style Interface */}
      <div className="fixed bottom-32 right-8 z-50 flex flex-col items-end gap-6">
        {description && (
          <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-outline-variant/30 animate-fade-in flex flex-col gap-5 min-w-[320px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant px-2">Ausgabe eintragen</p>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50 px-2">Betrag (€)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-6 py-4 rounded-2xl bg-stone-100 border-none text-sm font-black focus:ring-2 focus:ring-primary/20 transition-all"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50 px-2">Wer hat bezahlt?</label>
                <input 
                  type="text" 
                  placeholder="Zahler"
                  className="w-full px-6 py-4 rounded-2xl bg-stone-100 border-none text-sm font-black focus:ring-2 focus:ring-primary/20 transition-all"
                  value={paidBy}
                  onChange={e => setPaidBy(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        <form onSubmit={addExpense} className="flex items-center gap-4 translate-y-2">
          <input 
            id="finance-description-input"
            data-testid="finance-description-input"
            type="text" 
            placeholder="Was wurde gekauft?"
            className="w-full max-w-[280px] px-8 py-5 rounded-full bg-white shadow-2xl border-2 border-primary/10 focus:outline-none focus:border-primary/40 text-sm font-black transition-all"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <button id="add-expense-btn" data-testid="add-expense-btn" type="submit" className="w-20 h-20 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all">
            <span className="material-symbols-outlined text-4xl font-black">receipt_long</span>
          </button>
        </form>
      </div>

    </div>
  );
}
