import { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

interface WgSettingsModalProps {
  wg: any;
  currentUserId: number;
  onClose: () => void;
  onUpdated: (updatedWg: any) => void;
  onLeft: () => void;
}

const ICON_OPTIONS = ['🏠', '🌿', '🌻', '🌊', '🔥', '🎨', '🐝', '🌙'];
const COLOR_OPTIONS = [
  { name: 'Salbei', value: '#50644e' },
  { name: 'Ozean', value: '#2f6690' },
  { name: 'Terrakotta', value: '#c1553c' },
  { name: 'Lavendel', value: '#7a5c9e' },
  { name: 'Sonnenuntergang', value: '#d98e3f' },
  { name: 'Beere', value: '#a63a56' }
];

export function WgSettingsModal({ wg, currentUserId, onClose, onUpdated, onLeft }: WgSettingsModalProps) {
  const [name, setName] = useState(wg?.name || '');
  const [icon, setIcon] = useState(wg?.icon || '🏠');
  const [themeColor, setThemeColor] = useState(wg?.themeColor || '#50644e');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);

  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await authFetch(`/api/wgs/${wg.id}/members`);
      if (res.ok) setMembers(await res.json());
    } catch (err) {
      console.error('Error loading WG members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wg?.id]);

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError('Name darf nicht leer sein.');
      return;
    }
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const res = await authFetch(`/api/wgs/${wg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon, themeColor })
      });
      if (res.ok) {
        const updatedWg = await res.json();
        onUpdated(updatedWg);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        const data = await res.json();
        setSaveError(data.error || 'Fehler beim Speichern');
      }
    } catch {
      setSaveError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (userId: number) => {
    setRemovingUserId(userId);
    try {
      const res = await authFetch(`/api/wgs/${wg.id}/members/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadMembers();
      }
    } catch (err) {
      console.error('Error removing member:', err);
    } finally {
      setRemovingUserId(null);
    }
  };

  const generateInvite = async () => {
    setIsGeneratingInvite(true);
    setInviteCopied(false);
    try {
      const res = await authFetch(`/api/wgs/${wg.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const invite = await res.json();
        setInviteCode(invite.token);
        setInviteLink(`${window.location.origin}/?join=${invite.token}`);
      }
    } catch (err) {
      console.error('Error generating invite:', err);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (err) {
      console.error('Error copying invite link:', err);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      const res = await authFetch(`/api/wgs/${wg.id}/members/${currentUserId}`, { method: 'DELETE' });
      if (res.ok) {
        onLeft();
      }
    } catch (err) {
      console.error('Error leaving WG:', err);
    } finally {
      setLeaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl border border-outline-variant/20 animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-all"
        >
          <span className="material-symbols-outlined text-on-surface-variant">close</span>
        </button>

        <div className="mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-3xl">
            {icon}
          </div>
          <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">WG bearbeiten</h2>
          <p className="text-on-surface-variant text-sm mt-1 opacity-70">Name, Symbol, Farbe, Mitglieder und Einladungen verwalten</p>
        </div>

        {/* Name / Icon / Theme */}
        <div className="space-y-5 pb-8 border-b border-outline-variant/20">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 px-2">
              WG-Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-none text-base font-bold focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 px-2">
              Symbol
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIcon(opt)}
                  className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all ${icon === opt ? 'bg-primary/15 ring-2 ring-primary scale-105' : 'bg-stone-50 hover:bg-stone-100'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 px-2">
              Farbe
            </label>
            <div className="flex flex-wrap gap-3">
              {COLOR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.name}
                  onClick={() => setThemeColor(opt.value)}
                  style={{ backgroundColor: opt.value }}
                  className={`w-9 h-9 rounded-full transition-all ${themeColor === opt.value ? 'ring-2 ring-offset-2 ring-on-surface scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
          </div>

          {saveError && <p className="text-red-500 text-xs font-bold px-2">{saveError}</p>}

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {saving ? 'Speichert...' : saveSuccess ? 'Gespeichert!' : 'Speichern'}
          </button>
        </div>

        {/* Members */}
        <div className="py-8 border-b border-outline-variant/20 space-y-3">
          <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant opacity-70">
            Mitglieder
          </h3>
          {membersLoading ? (
            <p className="text-sm text-on-surface-variant italic">Lädt...</p>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.userId} className="flex items-center justify-between bg-stone-50 rounded-2xl px-5 py-3">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{m.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant opacity-50">{m.role}</p>
                  </div>
                  {m.userId !== currentUserId && (
                    <button
                      onClick={() => removeMember(m.userId)}
                      disabled={removingUserId === m.userId}
                      className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600 disabled:opacity-50 transition-all"
                    >
                      {removingUserId === m.userId ? '...' : 'Entfernen'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite */}
        <div className="py-8 border-b border-outline-variant/20 space-y-3">
          <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant opacity-70">
            Einladungscode
          </h3>
          {!inviteLink && !isGeneratingInvite && (
            <button
              onClick={generateInvite}
              className="w-full py-3.5 bg-primary/10 text-primary rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-primary/15 transition-all"
            >
              Code erstellen
            </button>
          )}
          {isGeneratingInvite && <p className="text-sm text-on-surface-variant italic">Einladung wird erstellt...</p>}
          {inviteLink && (
            <div className="bg-stone-50 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50">Code</span>
                  <p className="font-headline font-bold text-lg tracking-wider text-primary">{inviteCode}</p>
                </div>
                <button
                  type="button"
                  onClick={generateInvite}
                  title="Neuen Code erzeugen"
                  className="w-8 h-8 rounded-full bg-white border border-outline-variant/30 flex items-center justify-center hover:bg-stone-100 transition-all flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-outline-variant/30 text-xs font-medium truncate"
                />
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest whitespace-nowrap hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {inviteCopied ? 'Kopiert!' : 'Kopieren'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leave */}
        <div className="pt-8 space-y-3">
          {!confirmingLeave ? (
            <button
              onClick={() => setConfirmingLeave(true)}
              className="w-full py-3.5 text-red-500 font-bold uppercase tracking-widest text-xs hover:text-red-600 transition-all"
            >
              WG verlassen
            </button>
          ) : (
            <div className="bg-red-50 rounded-2xl p-5 space-y-3 text-center">
              <p className="text-sm text-red-600 font-medium">
                Sicher, dass du die WG verlassen willst? Wenn du das letzte Mitglied bist, werden alle WG-Daten gelöscht.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingLeave(false)}
                  className="flex-1 py-3 bg-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-stone-50 transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleLeave}
                  disabled={leaving}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {leaving ? '...' : 'Verlassen'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
