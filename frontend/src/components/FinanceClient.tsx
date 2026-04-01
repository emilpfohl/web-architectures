'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Plus, DollarSign, Users, ArrowRight } from 'lucide-react';

export function FinanceClient({ initialExpenses }: { initialExpenses: any[] }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [membersStr, setMembersStr] = useState('Max, Julius');
  const router = useRouter();

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount || !paidBy.trim()) return;

    await fetch('http://localhost:3000/api/finances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        description: description.trim(), 
        amount: parseFloat(amount), 
        paidBy: paidBy.trim() 
      })
    });
    setDescription('');
    setAmount('');
    setPaidBy('');
    router.refresh();
  };

  const totalExpenses = initialExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const members = Array.from(new Set([
    ...membersStr.split(',').map(m => m.trim()).filter(m => m),
    ...initialExpenses.map(e => e.paidBy)
  ]));

  const perPerson = members.length > 0 ? totalExpenses / members.length : 0;

  const balances: Record<string, number> = {};
  members.forEach(m => balances[m] = 0);
  initialExpenses.forEach(exp => {
    if(balances[exp.paidBy] !== undefined) {
      balances[exp.paidBy] += exp.amount;
    }
  });

  const debts = members.map(person => ({
    person,
    balance: balances[person] - perPerson
  }));

  const creditors = debts.filter(d => d.balance > 0.01).map(d => ({ ...d }));
  const debtors = debts.filter(d => d.balance < -0.01).map(d => ({ ...d }));

  const transactions = [];
  let i = 0; 
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const settleAmount = Math.min(creditor.balance, Math.abs(debtor.balance));
    
    transactions.push({
      from: debtor.person,
      to: creditor.person,
      amount: settleAmount
    });
    
    creditor.balance -= settleAmount;
    debtor.balance += settleAmount; 
    
    if (creditor.balance < 0.01) i++;
    if (Math.abs(debtor.balance) < 0.01) j++;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full animate-fade-in">
        
      <div className="w-full lg:w-2/3">
        <div className="glass-panel p-4 md:p-8 mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-semibold m-0 mb-4 text-slate-900 border-none">Neue Ausgabe erfassen</h2>
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
            <div className="col-span-1 md:col-span-2">
              <input 
                type="text" 
                className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium text-slate-800"
                placeholder="Wofür? (z.B. Wocheneinkauf)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <input 
              type="number" 
              step="0.01"
              className="px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium text-slate-800"
              placeholder="Betrag in €"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <input 
              type="text" 
              className="px-5 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-200 transition-all font-medium text-slate-800"
              placeholder="Wer? (Max)"
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
            />
            <button type="submit" className="btn btn-primary col-span-1 md:col-span-2 m-0 bg-emerald-300 hover:bg-emerald-400 text-emerald-900 shadow-emerald-300/50 py-3">
              <Plus size={20} />
              Ausgabe hinzufügen
            </button>
          </form>
        </div>

        <div className="glass-panel p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-semibold m-0 text-slate-900 border-none">Letzte Ausgaben</h2>
          {initialExpenses.length === 0 ? (
            <p className="text-slate-500 mt-4">Noch keine Ausgaben erfasst.</p>
          ) : (
            <ul className="flex flex-col gap-3 md:gap-4 mt-6 p-0 m-0">
              {initialExpenses.slice().reverse().map(exp => (
                <li key={exp.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600">
                      <DollarSign size={20} />
                    </div>
                    <div className="overflow-hidden">
                      <strong className="text-slate-800 font-semibold block truncate">{exp.description}</strong>
                      <div className="text-xs md:text-sm text-slate-500">Von {exp.paidBy}</div>
                    </div>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-slate-800 ml-2 whitespace-nowrap">
                    {exp.amount.toFixed(2)} €
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex-1 w-full lg:w-1/3 flex flex-col gap-6 md:gap-8">
        
        <div className="glass-panel p-6 md:p-8 flex flex-col items-center text-center">
          <Wallet size={48} className="text-emerald-500 mb-4" />
          <h3 className="text-slate-500 mb-2 font-medium">Gesamtausgaben</h3>
          <span className="text-5xl font-bold text-slate-800 m-0 leading-none">
            {totalExpenses.toFixed(2)} €
          </span>
          <div className="w-full h-px bg-slate-200 my-6"></div>
          
          <div className="w-full text-left">
            <label className="text-sm text-slate-500 mb-2 block font-medium">
              WG Mitglieder (kommagetrennt)
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-sm font-medium text-slate-700"
              value={membersStr}
              onChange={(e) => setMembersStr(e.target.value)}
            />
          </div>
          
          <p className="text-sm text-slate-500 mt-4">
            Pro Person: <strong className="text-slate-800 text-base">{perPerson.toFixed(2)} €</strong>
          </p>
        </div>

        <div className="glass-panel p-8">
          <h2 className="flex items-center gap-2 text-xl font-semibold mb-6 m-0 border-none text-slate-800">
            <Users size={24} className="text-blue-500" /> Wer schuldet wem?
          </h2>
          
          {transactions.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              Alles ausgeglichen! Niemand schuldet jemandem etwas. 🎉
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {transactions.map((acc, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-100 shadow-sm rounded-xl">
                  <div className="flex items-center gap-2">
                    <strong className="text-rose-500">{acc.from}</strong>
                    <ArrowRight size={16} className="text-slate-400" />
                    <strong className="text-emerald-500">{acc.to}</strong>
                  </div>
                  <strong className="text-slate-800 text-lg">{acc.amount.toFixed(2)} €</strong>
                </div>
              ))}
            </div>
          )}
          
        </div>

      </div>

    </div>
  );
}
