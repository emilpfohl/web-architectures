import { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../../shared/lib/authFetch';
import { calculateFinanceSummary, calculateNetDebts } from '../../shared/lib/logic';

export function FinanceClient({ initialExpenses, initialDebts, onRefresh, wgId, user, isDarkMode = false }: { initialExpenses: any[], initialDebts: any[], onRefresh: () => void, wgId: number, user: any, isDarkMode?: boolean }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(user?.name || '');
  const [showDetails, setShowDetails] = useState(false);
  const [payerFilter, setPayerFilter] = useState<string | null>(null);

  const [members, setMembers] = useState<any[]>([]);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [debtFromId, setDebtFromId] = useState<string>('');
  const [debtToId, setDebtToId] = useState<string>('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDescription, setDebtDescription] = useState('');

  useEffect(() => {
    if (user?.name && !paidBy) {
      setPaidBy(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (!wgId) return;
    authFetch(`/api/users?wgId=${wgId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));
  }, [wgId]);

  useEffect(() => {
    if (user?.id && !debtFromId) {
      setDebtFromId(String(user.id));
    }
  }, [user]);

  const { total, averagePerPerson, balances: userBalances, members: expenseMembers } = calculateFinanceSummary(initialExpenses);

  const netDebts = useMemo(
    () => calculateNetDebts((initialDebts || []).filter((d: any) => !d.settledAt)),
    [initialDebts]
  );

  const filteredExpenses = useMemo(() => {
    const list = initialExpenses.slice().reverse();
    return payerFilter ? list.filter((e: any) => e.paidBy === payerFilter) : list;
  }, [initialExpenses, payerFilter]);

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

  const addDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtFromId || !debtToId || debtFromId === debtToId || !debtAmount || !wgId) return;

    await authFetch('/api/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wgId,
        fromUserId: parseInt(debtFromId),
        toUserId: parseInt(debtToId),
        amount: parseFloat(debtAmount),
        description: debtDescription.trim()
      })
    });
    setDebtAmount('');
    setDebtDescription('');
    setDebtToId('');
    setShowDebtForm(false);
    onRefresh();
  };

  const settleNetDebt = async (fromUserName: string, toUserName: string) => {
    const involvedIds = (initialDebts || [])
      .filter((d: any) => !d.settledAt && (
        (d.fromUserName === fromUserName && d.toUserName === toUserName) ||
        (d.fromUserName === toUserName && d.toUserName === fromUserName)
      ))
      .map((d: any) => d.id);

    await Promise.all(involvedIds.map((id: number) =>
      authFetch(`/api/debts/${id}/settle`, { method: 'POST' })
    ));
    onRefresh();
  };

  const isDebtParticipant = (fromUserName: string, toUserName: string) =>
    user?.name === fromUserName || user?.name === toUserName;

  return (
    <div className={`animate-fade-in w-full max-w-2xl mx-auto space-y-12 pb-32 ${isDarkMode ? 'text-white' : ''}`}>

      <header className="px-4">
        <h2 className={`font-headline text-4xl font-bold tracking-tighter ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>Gemeinsame Ausgaben</h2>
        <p className={`font-bold text-[10px] uppercase tracking-[0.3em] mt-2 opacity-60 ${isDarkMode ? 'text-white/80' : 'text-on-surface-variant'}`}>WG-Finanzen im Überblick</p>
      </header>

      {/* Gruppen-Bilanz Card */}
      <section className="bg-primary p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden transition-all hover:scale-[1.01]">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60 mb-3">Gruppen-Bilanz · Gesamtausgaben</p>
          <div className="flex items-baseline gap-3">
            <span className="text-7xl font-bold tracking-tighter">{total.toFixed(2)}</span>
            <span className="text-2xl font-bold opacity-40">€</span>
          </div>

          <div className="mt-8 space-y-2 border-t border-white/10 pt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-4">Einzelbilanzen (Soll: {averagePerPerson.toFixed(2)}€ p.P.)</p>
            {expenseMembers.map(m => {
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
            <button
              className="btn bg-white/20 backdrop-blur-xl text-white border-none hover:bg-white/30 text-xs py-4 px-8 font-bold uppercase tracking-widest"
              onClick={() => setShowDetails(v => !v)}
            >
              {showDetails ? 'Buchungen verbergen' : 'Details'}
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
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl opacity-30"></div>
      </section>

      {/* Direkte Schulden Card */}
      <section className="bg-accent-peach p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden transition-all hover:scale-[1.01]">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60 mb-3">Direkte Schulden</p>
          <p className="text-sm font-bold opacity-80 mb-8">Wer schuldet wem direkt Geld</p>

          {netDebts.length > 0 ? (
            <div className="space-y-3">
              {netDebts.map(nd => (
                <div key={`${nd.fromUserName}-${nd.toUserName}`} className="flex justify-between items-center bg-white/10 px-6 py-4 rounded-2xl">
                  <span className="font-bold text-sm tracking-tight">
                    {nd.fromUserName} schuldet {nd.toUserName}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="font-headline font-bold text-lg">{nd.amount.toFixed(2)}€</span>
                    {isDebtParticipant(nd.fromUserName, nd.toUserName) && (
                      <button
                        className="text-[10px] font-bold uppercase tracking-widest bg-white text-accent-peach px-4 py-2 rounded-full hover:scale-105 transition-all"
                        onClick={() => settleNetDebt(nd.fromUserName, nd.toUserName)}
                      >
                        Begleichen
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 rounded-[2.5rem] py-10 text-center border border-dashed border-white/20">
              <span className="material-symbols-outlined text-4xl mb-3 block opacity-60">handshake</span>
              <p className="text-xs font-bold uppercase tracking-widest opacity-70">Keine offenen direkten Schulden</p>
            </div>
          )}

          <div className="mt-8">
            {!showDebtForm ? (
              <button
                className="btn bg-white text-accent-peach border-none hover:scale-105 text-xs py-4 px-8 font-bold uppercase tracking-widest"
                onClick={() => setShowDebtForm(true)}
              >
                Schuld eintragen
              </button>
            ) : (
              <form onSubmit={addDebt} className="bg-white/10 rounded-[2.5rem] p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-70 px-2">Wer schuldet</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border-none text-sm font-bold text-on-surface"
                      value={debtFromId}
                      onChange={e => setDebtFromId(e.target.value)}
                    >
                      <option value="">Auswählen…</option>
                      {members.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-70 px-2">Wem</label>
                    <select
                      className="w-full px-4 py-3 rounded-xl border-none text-sm font-bold text-on-surface"
                      value={debtToId}
                      onChange={e => setDebtToId(e.target.value)}
                    >
                      <option value="">Auswählen…</option>
                      {members.filter((m: any) => String(m.id) !== debtFromId).map((m: any) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-70 px-2">Betrag (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl border-none text-sm font-bold text-on-surface"
                      value={debtAmount}
                      onChange={e => setDebtAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-70 px-2">Grund (optional)</label>
                    <input
                      type="text"
                      placeholder="z.B. Kino"
                      className="w-full px-4 py-3 rounded-xl border-none text-sm font-bold text-on-surface"
                      value={debtDescription}
                      onChange={e => setDebtDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 btn bg-white text-accent-peach border-none hover:scale-105 text-xs py-3 font-bold uppercase tracking-widest"
                    disabled={!debtFromId || !debtToId || debtFromId === debtToId || !debtAmount}
                  >
                    Eintragen
                  </button>
                  <button
                    type="button"
                    className="btn bg-white/20 text-white border-none hover:bg-white/30 text-xs py-3 px-6 font-bold uppercase tracking-widest"
                    onClick={() => setShowDebtForm(false)}
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-2xl opacity-30"></div>
      </section>

      {/* Transaction List */}
      {showDetails && (
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between px-6">
            <h3 className={`font-headline text-xl font-black ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>Buchungen</h3>
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/60' : 'text-primary'}`}>{filteredExpenses.length} Einträge</span>
          </div>

          {expenseMembers.length > 1 && (
            <div className="flex flex-wrap gap-2 px-6">
              <button
                onClick={() => setPayerFilter(null)}
                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all ${!payerFilter ? 'bg-primary text-white' : (isDarkMode ? 'bg-white/10 text-white/70' : 'bg-stone-100 text-on-surface-variant')}`}
              >
                Alle
              </button>
              {expenseMembers.map(m => (
                <button
                  key={m}
                  onClick={() => setPayerFilter(m)}
                  className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all ${payerFilter === m ? 'bg-primary text-white' : (isDarkMode ? 'bg-white/10 text-white/70' : 'bg-stone-100 text-on-surface-variant')}`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {filteredExpenses.map((exp: any) => (
              <div key={exp.id} className={`p-7 rounded-[2.5rem] flex items-center justify-between border chill-shadow group transition-all cursor-default ${isDarkMode ? 'bg-black/20 border-white/10 hover:bg-black/30' : 'bg-white border-outline-variant/10 hover:bg-stone-50'}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-110 ${isDarkMode ? 'bg-white/10 text-white group-hover:bg-white/15' : 'bg-sage-soft/40 text-primary group-hover:bg-sage-soft/60'}`}>
                    <span className="material-symbols-outlined text-3xl font-bold">payments</span>
                  </div>
                  <div>
                    <h4 className={`font-bold text-xl leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>{exp.description}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isDarkMode ? 'text-white bg-white/15' : 'text-primary bg-primary/10'}`}>{exp.paidBy}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right pr-2">
                  <span className={`font-headline font-bold text-2xl tracking-tighter ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>-{exp.amount.toFixed(2)}€</span>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1 ${isDarkMode ? 'text-white/80' : 'text-on-surface-variant'}`}>Beglichen</p>
                </div>
              </div>
            ))}

            {filteredExpenses.length === 0 && (
              <div className={`text-center py-24 rounded-[4rem] border-2 border-dashed ${isDarkMode ? 'bg-black/10 border-white/10' : 'bg-stone-100/50 border-stone-200'}`}>
                <span className={`material-symbols-outlined text-7xl mb-6 block ${isDarkMode ? 'text-white/30' : 'text-stone-300'}`}>account_balance_wallet</span>
                <p className={`font-bold text-sm tracking-widest opacity-40 uppercase ${isDarkMode ? 'text-white' : 'text-on-surface-variant'}`}>Keine Ausgaben vorhanden</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Expense Addition FAB style Interface */}
      <div className="fixed bottom-32 right-8 z-50 flex flex-col items-end gap-6">
        {description && (
          <div className={`p-8 rounded-[3rem] shadow-2xl border backdrop-blur-xl animate-fade-in flex flex-col gap-5 min-w-[320px] ${isDarkMode ? 'bg-black/60 border-white/10' : 'bg-white/90 border-outline-variant/30'}`}>
            <p className={`text-[10px] font-black uppercase tracking-widest px-2 ${isDarkMode ? 'text-white/70' : 'text-on-surface-variant'}`}>Ausgabe eintragen</p>
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest opacity-50 px-2 ${isDarkMode ? 'text-white' : 'text-on-surface-variant'}`}>Betrag (€)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className={`w-full px-6 py-4 rounded-2xl border-none text-sm font-black focus:ring-2 focus:ring-primary/20 transition-all ${isDarkMode ? 'bg-white/10 text-white placeholder:text-white/40' : 'bg-stone-100'}`}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className={`text-[9px] font-black uppercase tracking-widest opacity-50 px-2 ${isDarkMode ? 'text-white' : 'text-on-surface-variant'}`}>Wer hat bezahlt?</label>
                <input
                  type="text"
                  placeholder="Zahler"
                  className={`w-full px-6 py-4 rounded-2xl border-none text-sm font-black focus:ring-2 focus:ring-primary/20 transition-all ${isDarkMode ? 'bg-white/10 text-white placeholder:text-white/40' : 'bg-stone-100'}`}
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
            className={`w-full max-w-[280px] px-8 py-5 rounded-full shadow-2xl border-2 focus:outline-none text-sm font-black transition-all ${isDarkMode ? 'bg-black/40 backdrop-blur-xl border-white/20 text-white placeholder:text-white/40 focus:border-white/40' : 'bg-white border-primary/10 focus:border-primary/40'}`}
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
