import { useState } from 'react';
import { authFetch } from '../../shared/lib/authFetch';

interface ProfileModalProps {
  user: any;
  onClose: () => void;
  onUpdated: (updatedUser: any) => void;
}

export function ProfileModal({ user, onClose, onUpdated }: ProfileModalProps) {
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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

  const handlePasswordSave = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword || !newPassword) {
      setPasswordError('Bitte beide Passwortfelder ausfüllen.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Die Passwörter stimmen nicht überein.');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await authFetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Passwort erfolgreich geändert.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Fehler beim Ändern des Passworts');
      }
    } catch {
      setPasswordError('Netzwerkfehler');
    } finally {
      setPasswordSaving(false);
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

        {/* Password Section */}
        <div className="space-y-4 mt-8 pt-8 border-t border-outline-variant/10">
          <h3 className="font-headline text-lg font-bold text-on-surface tracking-tight">Passwort ändern</h3>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 px-2">
              Aktuelles Passwort
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent text-base font-bold focus:ring-0 focus:border-primary/30 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 px-2">
              Neues Passwort
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent text-base font-bold focus:ring-0 focus:border-primary/30 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 px-2">
              Neues Passwort bestätigen
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSave()}
              className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-2 border-transparent text-base font-bold focus:ring-0 focus:border-primary/30 transition-all"
            />
          </div>

          {passwordError && (
            <p className="text-red-500 text-sm font-bold px-2">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-primary text-sm font-bold px-2">{passwordSuccess}</p>
          )}

          <button
            onClick={handlePasswordSave}
            disabled={passwordSaving}
            className="w-full py-4 rounded-2xl font-bold uppercase tracking-[0.15em] text-sm text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {passwordSaving ? 'Ändern...' : 'Passwort ändern'}
          </button>
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
