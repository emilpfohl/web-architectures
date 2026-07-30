import { useEffect, useState } from 'react';
import { authFetch } from '../../shared/lib/authFetch';

type CustomField = { label: string; value: string };

type WgInfo = {
  address: string;
  landlordName: string;
  landlordPhone: string;
  janitorName: string;
  janitorPhone: string;
  wifiName: string;
  wifiPassword: string;
  notes: string;
  customFields: CustomField[];
};

const emptyInfo: WgInfo = {
  address: '',
  landlordName: '',
  landlordPhone: '',
  janitorName: '',
  janitorPhone: '',
  wifiName: '',
  wifiPassword: '',
  notes: '',
  customFields: []
};

export function WgInfoCard({ wgId }: { wgId: number }) {
  const [info, setInfo] = useState<WgInfo>(emptyInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<WgInfo>(emptyInfo);
  const [isSaving, setIsSaving] = useState(false);

  const fetchInfo = async () => {
    if (!wgId) return;
    try {
      const res = await authFetch(`/api/wginfo?wgId=${wgId}`);
      if (res.ok) {
        const data = await res.json();
        setInfo({ ...emptyInfo, ...data, customFields: Array.isArray(data.customFields) ? data.customFields : [] });
      }
    } catch (err) {
      console.error('Error fetching wg info:', err);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, [wgId]);

  const startEditing = () => {
    setDraft({ ...info, customFields: info.customFields.map(f => ({ ...f })) });
    setIsEditing(true);
  };

  const saveInfo = async () => {
    if (!wgId) return;
    setIsSaving(true);
    try {
      const cleanCustomFields = draft.customFields.filter(f => f.label.trim() || f.value.trim());
      const res = await authFetch('/api/wginfo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wgId, ...draft, customFields: cleanCustomFields })
      });
      if (res.ok) {
        const data = await res.json();
        setInfo({ ...emptyInfo, ...data, customFields: Array.isArray(data.customFields) ? data.customFields : [] });
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error saving wg info:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const addCustomField = () => {
    setDraft(prev => ({ ...prev, customFields: [...prev.customFields, { label: '', value: '' }] }));
  };

  const updateCustomField = (index: number, key: keyof CustomField, value: string) => {
    setDraft(prev => ({
      ...prev,
      customFields: prev.customFields.map((f, i) => (i === index ? { ...f, [key]: value } : f))
    }));
  };

  const removeCustomField = (index: number) => {
    setDraft(prev => ({ ...prev, customFields: prev.customFields.filter((_, i) => i !== index) }));
  };

  const fields: { key: keyof Omit<WgInfo, 'notes' | 'customFields'>; label: string; icon: string; type?: 'tel' | 'text' }[] = [
    { key: 'address', label: 'Adresse', icon: 'home_pin' },
    { key: 'landlordName', label: 'Vermieter', icon: 'person' },
    { key: 'landlordPhone', label: 'Vermieter Telefon', icon: 'call', type: 'tel' },
    { key: 'janitorName', label: 'Hausmeister', icon: 'engineering' },
    { key: 'janitorPhone', label: 'Hausmeister Telefon', icon: 'call', type: 'tel' },
    { key: 'wifiName', label: 'WLAN Name', icon: 'wifi' },
    { key: 'wifiPassword', label: 'WLAN Passwort', icon: 'password' }
  ];

  const hasAnyValue = fields.some(f => info[f.key]) || info.notes || info.customFields.length > 0;

  if (isEditing) {
    return (
      <div className="bg-white rounded-[3rem] p-8 border border-outline-variant/30 shadow-sm" data-cy="wg-info-card-edit">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline text-xl font-black">Wichtige Infos bearbeiten</h3>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-on-surface-variant/50 hover:text-red-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-headline font-black uppercase tracking-widest text-on-surface-variant opacity-60">{f.label}</label>
              <input
                type="text"
                value={draft[f.key]}
                onChange={e => setDraft(prev => ({ ...prev, [f.key]: e.target.value }))}
                data-cy={`wg-info-input-${f.key}`}
                className="w-full mt-1 px-4 py-3 rounded-2xl border border-outline-variant/30 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-headline font-black uppercase tracking-widest text-on-surface-variant opacity-60">Notizen</label>
            <textarea
              value={draft.notes}
              onChange={e => setDraft(prev => ({ ...prev, notes: e.target.value }))}
              rows={4}
              data-cy="wg-info-input-notes"
              className="w-full mt-1 px-4 py-3 rounded-2xl border border-outline-variant/30 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Mülltermine, Notfallkontakte, Sicherungskasten..."
            />
          </div>

          {/* Eigene Felder */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-headline font-black uppercase tracking-widest text-on-surface-variant opacity-60">Eigene Infos</label>
              <button
                type="button"
                onClick={addCustomField}
                data-cy="wg-info-add-custom-field"
                className="flex items-center gap-1 text-[10px] font-headline font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Hinzufügen
              </button>
            </div>

            {draft.customFields.length === 0 ? (
              <p className="text-sm font-medium text-on-surface-variant opacity-50">Noch keine eigenen Einträge.</p>
            ) : (
              <div className="space-y-3">
                {draft.customFields.map((f, i) => (
                  <div key={i} className="flex items-start gap-2" data-cy={`wg-info-custom-field-${i}`}>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={f.label}
                        onChange={e => updateCustomField(i, 'label', e.target.value)}
                        placeholder="Bezeichnung (z.B. Müllabholung)"
                        data-cy={`wg-info-custom-label-${i}`}
                        className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <input
                        type="text"
                        value={f.value}
                        onChange={e => updateCustomField(i, 'value', e.target.value)}
                        placeholder="Wert (z.B. Dienstags)"
                        data-cy={`wg-info-custom-value-${i}`}
                        className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomField(i)}
                      data-cy={`wg-info-remove-custom-${i}`}
                      className="mt-1 w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-on-surface-variant/40 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Entfernen"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={saveInfo}
          disabled={isSaving}
          data-cy="wg-info-save"
          className="w-full mt-6 px-8 py-4 rounded-2xl bg-primary text-white font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg disabled:opacity-60"
        >
          {isSaving ? 'Speichert...' : 'Speichern'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] p-8 border border-outline-variant/30 shadow-sm" data-cy="wg-info-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-headline text-xl font-black mb-1">Wichtige Infos</h3>
          <p className="font-headline text-on-surface-variant text-[10px] uppercase tracking-widest font-black opacity-60">Adresse & Kontakte</p>
        </div>
        <button
          type="button"
          onClick={startEditing}
          data-cy="wg-info-edit-button"
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant/40 hover:text-primary hover:bg-primary/5 transition-all"
          title="Bearbeiten"
        >
          <span className="material-symbols-outlined text-[20px]">edit</span>
        </button>
      </div>

      {!hasAnyValue ? (
        <p className="text-sm font-medium text-on-surface-variant opacity-60">Noch keine Infos hinterlegt.</p>
      ) : (
        <div className="space-y-3">
          {fields.filter(f => info[f.key]).map(f => (
            <div key={f.key} className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50">
              <span className="material-symbols-outlined text-primary text-[20px]">{f.icon}</span>
              <div className="min-w-0">
                <p className="text-[9px] font-headline font-black uppercase tracking-widest text-on-surface-variant opacity-50">{f.label}</p>
                {f.type === 'tel' ? (
                  <a href={`tel:${info[f.key]}`} className="text-sm font-bold text-on-surface truncate hover:text-primary transition-colors">
                    {info[f.key]}
                  </a>
                ) : f.key === 'address' ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(info.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-on-surface truncate hover:text-primary transition-colors"
                  >
                    {info[f.key]}
                  </a>
                ) : (
                  <p className="text-sm font-bold text-on-surface truncate">{info[f.key]}</p>
                )}
              </div>
            </div>
          ))}
          {info.customFields.map((f, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-stone-50" data-cy={`wg-info-custom-display-${i}`}>
              <span className="material-symbols-outlined text-primary text-[20px]">notes</span>
              <div className="min-w-0">
                <p className="text-[9px] font-headline font-black uppercase tracking-widest text-on-surface-variant opacity-50">{f.label}</p>
                <p className="text-sm font-bold text-on-surface truncate">{f.value}</p>
              </div>
            </div>
          ))}
          {info.notes && (
            <div className="p-4 rounded-2xl bg-stone-50">
              <p className="text-[9px] font-headline font-black uppercase tracking-widest text-on-surface-variant opacity-50 mb-1">Notizen</p>
              <p className="text-sm font-medium text-on-surface whitespace-pre-wrap">{info.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
