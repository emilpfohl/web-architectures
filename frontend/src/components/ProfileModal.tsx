import { useState } from 'react';
import { authFetch } from '../utils/authFetch';

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdated: (updatedUser: any) => void;
}

export function ProfileModal({ user, onClose, onUpdated }: ProfileModalProps) {
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name darf nicht leer sein.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        onUpdated(updatedUser);
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Speichern');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-outline-variant/20 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-all"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl text-primary">person</span>
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">Profil bearbeiten</h2>
          <p className="text-on-surface-variant text-sm mt-1 opacity-70">Ändere deinen Anzeigenamen</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 px-2">
              Anzeigename
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dein Name..."
              className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent text-base font-bold focus:ring-0 focus:border-primary/30 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 px-2">
              E-Mail
            </label>
            <input
              type="text"
              value={user?.email || ''}
              disabled
              className="w-full px-6 py-4 rounded-2xl bg-stone-100 border-2 border-transparent text-base font-medium text-on-surface-variant/60 cursor-not-allowed"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold px-2">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold uppercase tracking-[0.15em] text-sm text-on-surface-variant bg-stone-100 hover:bg-stone-200 transition-all"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 py-4 rounded-2xl font-bold uppercase tracking-[0.15em] text-sm text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
}
