import React, { useState, useEffect } from 'react';
import { Wallet, Plus, DollarSign, Users, ArrowRight } from 'lucide-react';

const API_URL = 'http://localhost:3000/api/finances';

export default function Finance() {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [membersStr, setMembersStr] = useState('Max, Julius');

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setExpenses(data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching finances:", err));
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || !paidBy.trim()) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: description.trim(), 
          amount: parseFloat(amount), 
          paidBy: paidBy.trim() 
        })
      });
      const data = await res.json();
      setExpenses([...expenses, data]);
      setDescription('');
      setAmount('');
      setPaidBy('');
    } catch (err) {
      console.error("Error adding expense:", err);
    }
  };

  // --- SCHULDEN BERECHNUNG ---
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const members = Array.from(new Set([
    ...membersStr.split(',').map(m => m.trim()).filter(m => m),
    ...expenses.map(e => e.paidBy)
  ]));

  const perPerson = totalExpenses / (members.length || 1);

  const balances = {};
  members.forEach(m => balances[m] = 0);
  expenses.forEach(exp => {
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
    debtor.balance += settleAmount; // debtor.balance is negative
    
    if (creditor.balance < 0.01) i++;
    if (Math.abs(debtor.balance) < 0.01) j++;
  }
  // ---------------------------

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <h1>WG Finanzcheck 💸</h1>
        <p>Den Überblick über gemeinsame Ausgaben behalten und Schulden fair aufteilen.</p>
      </header>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Form and List Column */}
        <div style={{ flex: 2, minWidth: '300px' }}>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2>Neue Ausgabe erfassen</h2>
            <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Wofür? (z.B. Wocheneinkauf)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', margin: 0 }}
                />
              </div>
              <input 
                type="number" 
                step="0.01"
                className="input-field" 
                placeholder="Betrag in €"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ margin: 0 }}
              />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Wer hat bezahlt? (z.B. Max)"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                style={{ margin: 0 }}
              />
              <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>
                <Plus size={20} />
                Ausgabe hinzufügen
              </button>
            </form>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2>Letzte Ausgaben</h2>
            {loading ? (
              <p>Lädt...</p>
            ) : expenses.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Noch keine Ausgaben erfasst.</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {expenses.slice().reverse().map(exp => (
                  <li key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'white', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <strong>{exp.description}</strong>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bezahlt von {exp.paidBy}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {exp.amount.toFixed(2)} €
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Stats & Split Column */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Wallet size={48} color="var(--accent-green)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Gesamtausgaben</h3>
            <span style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {totalExpenses.toFixed(2)} €
            </span>
            <div style={{ width: '100%', height: '1px', background: 'var(--panel-border)', margin: '1.5rem 0' }}></div>
            
            <div style={{ width: '100%', textAlign: 'left' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                WG Mitglieder (kommagetrennt)
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={membersStr}
                onChange={(e) => setMembersStr(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
              />
            </div>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem' }}>
              Pro Person: <strong>{perPerson.toFixed(2)} €</strong>
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Users size={24} color="var(--accent-blue)" /> Wer schuldet wem?
            </h2>
            
            {transactions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem 0' }}>
                Alles ausgeglichen! Niemand schuldet jemandem etwas. 🎉
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {transactions.map((acc, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'white',
                    border: '1px solid rgba(0,0,0,0.04)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ color: 'var(--accent-red)' }}>{acc.from}</strong>
                      <ArrowRight size={16} color="var(--text-secondary)" />
                      <strong style={{ color: 'var(--accent-green)' }}>{acc.to}</strong>
                    </div>
                    <strong style={{ fontSize: '1.1rem' }}>{acc.amount.toFixed(2)} €</strong>
                  </div>
                ))}
              </div>
            )}
            
          </div>

        </div>

      </div>
    </div>
  );
}
