import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { buildLeaderboard } from '../utils/leaderboard';
import { formatMessageTimestamp } from '../utils/logic';

export function DashboardClient({ wgId, user, wgName, wgIcon, todos = [] }: { shopping: any[], todos: any[], finances: any[], onRefresh: () => void, wgId: number, user: any, wgName?: string, wgIcon?: string }) {
  const navigate = useNavigate();

  const availableMoods = [
    { name: 'Entspannt', icon: 'spa' },
    { name: 'Fokussiert', icon: 'menu_book' },
    { name: 'Kochen', icon: 'restaurant' },
    { name: 'Putzen', icon: 'cleaning_services' },
    { name: 'Ausruhen', icon: 'bedtime' }
  ];

  const [allResidents, setAllResidents] = useState<any[]>([]);

  const applyResidentStatusUpdate = (isHome?: boolean, mood?: string) => {
    if (!user?.id) return;

    setAllResidents(prevResidents =>
      prevResidents.map(resident => {
        if (resident.id !== user.id) return resident;

        return {
          ...resident,
          ...(isHome !== undefined ? { isHome } : {}),
          ...(mood !== undefined ? { mood } : {})
        };
      })
    );
  };

  // Fetch Residents of this WG
  const fetchResidents = async () => {
    if (!wgId) return;
    try {
      const res = await authFetch(`/api/users?wgId=${wgId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllResidents(data.map((u: any) => ({ 
            ...u, 
            img: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random` 
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching residents:', err);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [wgId]);

  const updateStatus = async (isHome?: boolean, mood?: string) => {
    if (!wgId) return;

    const previousResidents = allResidents;
    applyResidentStatusUpdate(isHome, mood);

    try {
      const res = await authFetch('/api/users/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wgId, isHome, mood })
      });
      if (res.ok) {
        fetchResidents(); 
      } else {
        setAllResidents(previousResidents);
      }
    } catch (err) {
      setAllResidents(previousResidents);
      console.error('Error updating status:', err);
    }
  };

  const currentUserData = allResidents.find(r => r.id === user?.id);
  const isUserHome = currentUserData?.isHome ?? true;
  const userMood = currentUserData?.mood ?? 'Chill';
  const leaderboard = buildLeaderboard(allResidents, todos);

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch messages with polling
  useEffect(() => {
    if (!wgId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await authFetch(`/api/messages?wgId=${wgId}`);
        if (!res.ok) return; 
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [wgId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wgId,
          content: newMessage,
          type: 'user'
        })
      });
      if (res.ok) {
        setNewMessage('');
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="animate-fade-in w-full space-y-12 pb-20">
      
      {/* Vibe / Hero Section */}
      <section className="space-y-8 animate-fade-in py-6">
        <div>
          <h1 className="font-headline text-5xl md:text-7xl font-semibold text-on-surface tracking-tighter leading-[1.05] mb-4 flex items-center gap-4 md:gap-6 flex-wrap">
            {wgIcon && (
              <span className="text-7xl md:text-9xl leading-none">{wgIcon}</span>
            )}
            <span>
              {wgName ? (
                <>
                  {wgName}
                  <br/>
                </>
              ) : <>Willkommen Zuhause, <br/></>}
              <span className="text-primary italic font-light text-4xl md:text-6xl">Alles im Griff</span>
            </span>
          </h1>
          <p className="text-on-surface-variant font-medium text-lg md:text-xl leading-relaxed opacity-70 max-w-lg">
            Dein Rückzugsort in der WG. Alles ist im Fluss, alle Aufgaben sind verteilt und die Stimmung ist Zen.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-4 -mx-4 no-scrollbar scroll-smooth items-center">
          {availableMoods.map((moodObj) => {
            const isActive = userMood === moodObj.name;
            return (
              <button 
                type="button"
                key={moodObj.name} 
                onClick={() => updateStatus(undefined, moodObj.name)}
                className={`flex-shrink-0 px-8 py-4 rounded-full font-headline font-bold flex items-center gap-2 transition-all h-[60px] ${isActive ? 'bg-primary text-white chill-shadow scale-105' : 'bg-white border border-outline-variant/30 text-on-surface-variant hover:bg-stone-100'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{moodObj.icon}</span>
                {moodObj.name}
              </button>
            );
          })}

          <div className="w-[1px] h-8 bg-outline-variant/30 flex-shrink-0 mx-2" />

          {/* Apple-Style Home Switch Integrated */}
          <div className="flex-shrink-0 flex items-center gap-4 bg-white border border-outline-variant/30 px-6 py-3 rounded-full shadow-sm transition-all hover:bg-stone-50 h-[60px]">
             <div className="flex flex-col -space-y-1 w-20">
                <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50">Status</span>
                <span className="text-[12px] font-bold text-on-surface whitespace-nowrap">{isUserHome ? 'Zuhause' : 'Unterwegs'}</span>
             </div>
             <button 
               type="button"
                onClick={() => updateStatus(!isUserHome)}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0 ${isUserHome ? 'bg-primary' : 'bg-stone-300'}`}
             >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 transform ${isUserHome ? 'translate-x-5' : 'translate-x-0'}`} />
             </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Grid Left */}
        <div className="space-y-8">
          {/* Who's Home Card */}
          <div className="glass-panel stagger-1">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline text-xl font-semibold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary zen-pulse"></span>
                Wer ist Zuhause
              </h3>
            </div>

            <div className="flex gap-8">
              {allResidents.map((res, i) => {
                const moodObj = availableMoods.find(m => m.name === res.mood) || availableMoods[0];
                return (
                  <div key={res.id} className={`flex flex-col items-center gap-3 transition-all duration-700 stagger-${i+2} ${res.isHome ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}>
                    <div className={`w-20 h-20 rounded-full p-1 border-2 transition-all ${res.isHome ? 'border-primary/60 shadow-lg shadow-primary/5' : 'border-transparent'}`}>
                      <img alt={res.name} className="w-full h-full rounded-full object-cover bg-stone-100" src={res.img}/>
                    </div>
                    <div className="text-center space-y-1">
                      <span className={`font-headline text-[12px] font-bold uppercase tracking-widest ${res.isHome ? 'text-primary' : 'text-on-surface-variant'}`}>{res.name}</span>
                      <div className="flex items-center justify-center gap-1.5 opacity-60">
                        <span className="material-symbols-outlined text-[14px]">{moodObj.icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-tighter">{moodObj.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blackboard */}
          <section className="mt-4 stagger-4 transition-all">
            <div className="bg-slate-900 rounded-[2rem] p-8 pb-10 border-[6px] border-stone-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-screen"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10 border-b-2 border-slate-700/50 pb-4">
                <h3 className="font-headline text-2xl font-black text-slate-100 flex items-center gap-3 italic">
                  <span className="material-symbols-outlined text-slate-300">edit_note</span>
                  Blackboard
                </h3>
                <span className="text-[10px] font-headline text-slate-400 uppercase tracking-[0.2em] font-bold">Neueste Einträge</span>
              </div>
              
              <div className="space-y-6 relative z-10 max-h-[400px] overflow-y-auto no-scrollbar scroll-smooth pr-2">
                {messages.length === 0 && (
                  <p className="text-slate-500 italic text-sm text-center py-10">Keine Nachrichten vorhanden...</p>
                )}
                {messages.map((msg: any) => {
                  if (msg.type === 'system') {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700/50">
                          <p className="text-[11px] text-slate-400 italic">
                            <span className="material-symbols-outlined text-[12px] align-middle mr-1">info</span>
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  const sender = allResidents.find(r => r.id === msg.senderId);
                  const isMe = msg.senderId === user?.id;
                  
                  return (
                    <div key={msg.id} className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-700/50 shadow-md">
                        <img alt="User" src={sender?.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || 'U')}&background=random`}/>
                      </div>
                      <div className={`max-w-[80%] space-y-1 ${isMe ? 'items-end' : ''}`}>
                        <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'}`}>
                          {msg.content}
                        </div>
                        <p className={`text-[9px] font-headline font-bold text-slate-500 uppercase ${isMe ? 'text-right' : ''}`}>
                          {msg.senderName || 'Unbekannt'} • {formatMessageTimestamp(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={sendMessage} className="mt-8 relative z-10">
                <div className="relative">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nachricht an die WG..." 
                    className="w-full bg-slate-800/80 border-2 border-slate-700/50 rounded-2xl py-3 pl-4 pr-12 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-all text-sm"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-1.5 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 transition-transform active:scale-95"
                  >
                    <span className="material-symbols-outlined text-xl">send</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
 
        {/* Status Grid Right */}
        <div className="space-y-8">
          {/* Vibe Leaders */}
          <div className="bg-sage-soft/20 rounded-[3rem] p-8 border border-sage-soft/30">
            <h3 className="font-headline text-xl font-black mb-1">WG Rangliste</h3>
            <p className="font-headline text-on-surface-variant text-[10px] uppercase tracking-widest font-black mb-8 opacity-60">Aufgaben-Serien Belohnungen</p>
            
            <div className="space-y-4">
              {leaderboard.length > 0 ? leaderboard.map((leader, i) => (
                <div key={leader.id} className={`flex items-center justify-between p-5 rounded-3xl transition-all stagger-${i+3} ${i === 0 ? 'bg-white shadow-lg shadow-sage-soft/20' : 'bg-white/40'}`}>
                  <div className="flex items-center gap-4">
                    <span className="font-headline text-2xl font-black italic text-primary/20">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="font-black text-sm text-on-surface">{leader.name}</p>
                      <p className="text-[11px] font-medium text-on-surface-variant">{leader.taskLabel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-primary font-headline font-extrabold text-lg">{leader.pointsLabel}</span>
                    <p className="text-[9px] uppercase font-headline font-black text-on-surface-variant">{leader.rankLabel} Aufgaben</p>
                  </div>
                </div>
              )) : (
                <div className="bg-white/60 p-5 rounded-3xl text-sm font-medium text-on-surface-variant">
                  Noch keine Aufgaben für eine Rangliste vorhanden.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <section className="grid grid-cols-2 gap-4">
            <div onClick={() => navigate('/?tab=shopping')} className="p-6 rounded-[2rem] bg-white border border-outline-variant/30 hover:bg-sage-soft/10 transition-all group cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">shopping_basket</span>
              <p className="font-headline font-black text-lg">Einkaufen</p>
              <p className="text-[10px] text-on-surface-variant font-bold opacity-60">Milch, Eier, Snacks...</p>
            </div>
            <div onClick={() => navigate('/?tab=todos')} className="p-6 rounded-[2rem] bg-white border border-outline-variant/30 hover:bg-sage-soft/10 transition-all group cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-primary mb-3 text-3xl group-hover:scale-110 transition-transform">task_alt</span>
              <p className="font-headline font-black text-lg">Aufgabe erledigt</p>
              <p className="text-[10px] text-on-surface-variant font-bold opacity-60">Punkte sammeln</p>
            </div>
          </section>
        </div>
      </div>

    </div>
  );
}
