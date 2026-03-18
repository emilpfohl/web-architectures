import React from 'react';
import { ShoppingCart, CheckSquare, Wallet } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <h1>Willkommen Zuhause! 🏠</h1>
        <p>Hier ist die aktuelle Übersicht für eure WG.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--accent-blue)' }}>
            <ShoppingCart size={32} />
            <h2>Einkauf</h2>
          </div>
          <p>2 Artikel auf der Einkaufsliste fehlen noch.</p>
          <a href="/shopping" className="btn btn-secondary" style={{ marginTop: 'auto', textDecoration: 'none', textAlign: 'center' }}>Zur Liste</a>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--accent-violet)' }}>
            <CheckSquare size={32} />
            <h2>Putzplan</h2>
          </div>
          <p>Max ist diese Woche mit der Küche dran.</p>
          <a href="/todos" className="btn btn-secondary" style={{ marginTop: 'auto', textDecoration: 'none', textAlign: 'center' }}>Zum Plan</a>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--accent-green)' }}>
            <Wallet size={32} />
            <h2>Finanzen</h2>
          </div>
          <p>Dieser Monat sieht gut aus! Keine offenen Schulden ermittelt.</p>
          <a href="/finance" className="btn btn-secondary" style={{ marginTop: 'auto', textDecoration: 'none', textAlign: 'center' }}>Zum Finanzcheck</a>
        </div>
      </div>
    </div>
  );
}
