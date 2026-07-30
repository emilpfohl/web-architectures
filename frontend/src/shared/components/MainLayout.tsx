import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TabsNav } from './TabsNav';
import { DashboardClient } from '../../features/dashboard/DashboardClient';
import { ShoppingClient } from '../../features/shopping/ShoppingClient';
import { TodoClient } from '../../features/tasks/TodoClient';
import { FinanceClient } from '../../features/finances/FinanceClient';
import { ProfileModal } from '../../features/wg/ProfileModal';
import { WgSettingsModal } from '../../features/wg/WgSettingsModal';
import { ShoppingModeBadge } from './ShoppingModeBadge';
import { Footer } from './Footer';
import { authFetch } from '../lib/authFetch';

export function MainLayout() {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const [user, setUser] = useState<any>(null);
  const [wgs, setWgs] = useState<any[]>([]);
  const [selectedWgId, setSelectedWgId] = useState<number | null>(null);
  const [shopping, setShopping] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [finances, setFinances] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWgSettings, setShowWgSettings] = useState(false);
  const [isShoppingActive, setIsShoppingActive] = useState(false);

  const refresh = () => {
    setLoading(true);
    setRefreshCounter(prev => prev + 1);
  };

  // 1. Fetch User and WGs
  useEffect(() => {
    const fetchUserAndWgs = async () => {
      try {
        const userRes = await authFetch('/api/auth/me');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          
          const wgsRes = await authFetch(`/api/wgs?userId=${userData.id}`);
          if (wgsRes.ok) {
            const wgsData = await wgsRes.json();
            setWgs(wgsData);
            
            // If we have WGs but no selection, pick the first one
            if (wgsData.length > 0 && !selectedWgId) {
              setSelectedWgId(wgsData[0].id);
            } else if (wgsData.length === 0) {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setLoading(false);
      }
    };
    fetchUserAndWgs();
  }, [refreshCounter]);

  // 2. Fetch Tab Data based on selectedWgId
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedWgId) return;
      
      setLoading(true);
      try {
        const promises = [];
        
        if (currentTab === 'dashboard' || currentTab === 'shopping') {
          promises.push(
            authFetch(`/api/shopping?wgId=${selectedWgId}`)
              .then(r => r.json())
              .then(d => Array.isArray(d) ? setShopping(d) : setShopping([]))
          );
          promises.push(
            authFetch('/api/shopping/categories')
              .then(r => r.json())
              .then(d => setCategories(d || []))
          );
        }
        
        if (currentTab === 'dashboard' || currentTab === 'todos') {
          promises.push(
            authFetch(`/api/todos?wgId=${selectedWgId}`)
              .then(r => r.json())
              .then(d => Array.isArray(d) ? setTodos(d) : setTodos([]))
          );
        }
        
        if (currentTab === 'dashboard' || currentTab === 'finance') {
          promises.push(
            authFetch(`/api/finances?wgId=${selectedWgId}`)
              .then(r => r.json())
              .then(d => Array.isArray(d) ? setFinances(d) : setFinances([]))
          );
          promises.push(
            authFetch(`/api/debts?wgId=${selectedWgId}`)
              .then(r => r.json())
              .then(d => Array.isArray(d) ? setDebts(d) : setDebts([]))
          );
        }

        await Promise.all(promises);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentTab, refreshCounter, selectedWgId]);

  // Shopping-Modus-Status des aktuellen Nutzers laden (unabhängig vom Tab,
  // damit der Modus über Tab-Wechsel und Reload hinweg bestehen bleibt)
  useEffect(() => {
    if (!selectedWgId || !user?.id) return;

    let cancelled = false;
    authFetch(`/api/users?wgId=${selectedWgId}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled || !Array.isArray(data)) return;
        const me = data.find((u: any) => u.id === user.id);
        setIsShoppingActive(!!me?.isShopping);
      })
      .catch(err => console.error('Error fetching shopping status:', err));

    return () => { cancelled = true; };
  }, [selectedWgId, user?.id]);

  const [newWgName, setNewWgName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  // Pre-fill the invite code from a shared "?join=CODE" link
  useEffect(() => {
    const joinCode = searchParams.get('join');
    if (joinCode) {
      setInviteToken(joinCode);
      setShowJoinForm(true);
    }
  }, [searchParams]);
  const isShoppingDarkMode = isShoppingActive;
  const selectedWg = wgs.find(w => w.id === selectedWgId);

  useEffect(() => {
    document.title = selectedWg?.name ? `${selectedWg.name}` : 'Sanctuary';
  }, [selectedWg?.name]);

  if (!loading && wgs.length === 0) {
    return (
      <div className="font-body min-h-screen flex flex-col bg-background relative overflow-hidden" data-cy="wg-onboarding">
        {/* Subtle background flare */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-accent-peach/5 rounded-full blur-3xl" />
        
        <TabsNav wgs={wgs} selectedWgId={selectedWgId} onSelectWg={setSelectedWgId} user={user} onOpenProfile={() => setShowProfileModal(true)} onOpenWgSettings={() => setShowWgSettings(true)} isDarkMode={isShoppingDarkMode} />
        <main className="flex-1 flex items-start justify-center p-6 pt-4 pb-24 animate-fade-in relative z-10">
          <div className="max-w-md w-full space-y-12 text-center">
            <header className="space-y-4">
              <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-primary/5">
                <span className="material-symbols-outlined text-5xl text-primary font-bold">home_work</span>
              </div>
              <h1 className="text-5xl font-bold text-on-surface tracking-tighter">Willkommen!</h1>
              <p className="text-on-surface-variant font-medium text-lg leading-relaxed opacity-70">
                Du bist noch in keiner WG. Starte dein neues WG-Leben hier.
              </p>
            </header>

            <div className="grid gap-6">
              {/* Create WG */}
              <div className="space-y-4">
                <button
                  onClick={() => { setShowCreateForm(!showCreateForm); setShowJoinForm(false); }}
                  className={`w-full group relative p-8 bg-white rounded-[2.5rem] border transition-all text-left ${showCreateForm ? 'border-primary shadow-lg ring-4 ring-primary/5' : 'border-outline-variant/20 chill-shadow hover:scale-[1.01]'}`}
                  data-cy="create-wg-toggle"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${showCreateForm ? 'bg-primary text-white scale-110' : 'bg-sage-soft text-primary group-hover:scale-110'}`}>
                      <span className="material-symbols-outlined text-3xl font-bold">add</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-on-surface">WG gründen</h3>
                      <p className="text-on-surface-variant text-sm opacity-60 font-bold uppercase tracking-widest mt-1">Eigene Gruppe erstellen</p>
                    </div>
                  </div>
                </button>

                {showCreateForm && (
                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-primary/10 animate-slide-up shadow-xl space-y-4">
                    <input
                      type="text"
                      placeholder="Name deiner WG..."
                      className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-none text-base font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      value={newWgName}
                      onChange={e => setNewWgName(e.target.value)}
                      data-cy="create-wg-name-input"
                    />
                    <button
                      onClick={async () => {
                        if (newWgName.trim() && user) {
                          const res = await authFetch('/api/wgs', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newWgName.trim(), userId: user.id })
                          });
                          if (res.ok) {
                            setNewWgName('');
                            setShowCreateForm(false);
                            refresh();
                          }
                        }
                      }}
                      disabled={!newWgName.trim()}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                      data-cy="create-wg-submit-button"
                    >
                      WG erstellen
                    </button>
                  </div>
                )}
              </div>

              {/* Join WG */}
              <div className="space-y-4">
                <button 
                  onClick={() => { setShowJoinForm(!showJoinForm); setShowCreateForm(false); }}
                  className={`w-full group relative p-8 bg-white rounded-[2.5rem] border transition-all text-left ${showJoinForm ? 'border-accent-peach shadow-lg ring-4 ring-accent-peach/5' : 'border-outline-variant/20 chill-shadow hover:scale-[1.01]'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${showJoinForm ? 'bg-accent-peach text-white scale-110' : 'bg-accent-peach/10 text-accent-peach group-hover:scale-110'}`}>
                      <span className="material-symbols-outlined text-3xl font-bold">group_add</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-on-surface">WG beitreten</h3>
                      <p className="text-on-surface-variant text-sm opacity-60 font-bold uppercase tracking-widest mt-1">Über Einladungscode</p>
                    </div>
                  </div>
                </button>

                {showJoinForm && (
                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-accent-peach/10 animate-slide-up shadow-xl space-y-4">
                    <input 
                      type="text" 
                      placeholder="Einladungscode..."
                      className="w-full px-6 py-4 rounded-2xl bg-stone-50 border-none text-base font-bold focus:ring-2 focus:ring-accent-peach/20 transition-all"
                      value={inviteToken}
                      onChange={e => setInviteToken(e.target.value)}
                    />
                    <button 
                      onClick={async () => {
                        if (inviteToken.trim() && user) {
                          const res = await authFetch('/api/invitations/join', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: inviteToken.trim(), userId: user.id })
                          });
                          if (res.ok) {
                            setInviteToken('');
                            setShowJoinForm(false);
                            refresh();
                          } else {
                            const err = await res.json();
                            alert(err.error || 'Beitritt fehlgeschlagen');
                          }
                        }
                      }}
                      disabled={!inviteToken.trim()}
                      className="w-full py-4 bg-accent-peach text-white rounded-2xl font-bold uppercase tracking-[0.2em] shadow-lg shadow-accent-peach/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      WG beitreten
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className={`font-body h-full min-h-screen flex flex-col ${isShoppingActive ? 'shopping-mode' : ''}`}
      style={selectedWg?.themeColor ? { '--color-primary': selectedWg.themeColor } as React.CSSProperties : undefined}
      data-cy="main-app"
    >
      <div className="bg-flare" />
      <TabsNav wgs={wgs} selectedWgId={selectedWgId} onSelectWg={setSelectedWgId} user={user} onOpenProfile={() => setShowProfileModal(true)} onOpenWgSettings={() => setShowWgSettings(true)} isDarkMode={isShoppingActive} />
      <main className={`flex-1 p-6 md:p-16 lg:p-24 pb-24 overflow-x-hidden animate-fade-in ${isShoppingActive ? 'shopping-mode-main' : ''}`}>
        <div className="w-full max-w-6xl mx-auto space-y-12">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="material-symbols-outlined animate-spin text-primary/40 text-4xl">progress_activity</div>
            </div>
          ) : (
            <>
              {selectedWgId ? (
                <>
                  {currentTab === 'dashboard' && <DashboardClient shopping={shopping} todos={todos} finances={finances} onRefresh={refresh} wgId={selectedWgId} user={user} wgName={selectedWg?.name} wgIcon={selectedWg?.icon} />}
                  {currentTab === 'shopping' && <ShoppingClient initialItems={shopping} initialCategories={categories} onRefresh={refresh} wgId={selectedWgId} isDarkMode={isShoppingActive} isAtStore={isShoppingActive} onToggleAtStore={setIsShoppingActive} />}
                  {currentTab === 'todos' && <TodoClient initialTodos={todos} onRefresh={refresh} wgId={selectedWgId} user={user} />}
                  {currentTab === 'finance' && <FinanceClient initialExpenses={finances} initialDebts={debts} onRefresh={refresh} wgId={selectedWgId} user={user} isDarkMode={isShoppingActive} />}
                </>
              ) : (
                <div className="text-center py-20 text-on-surface-variant italic">
                  Bitte wähle eine WG aus...
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer variant={isShoppingActive ? 'dark' : 'default'} />
      {isShoppingActive && currentTab !== 'shopping' && <ShoppingModeBadge />}
      {showProfileModal && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onUpdated={(updatedUser) => {
            setUser(updatedUser);
            setShowProfileModal(false);
          }}
        />
      )}
      {showWgSettings && selectedWg && user && (
        <WgSettingsModal
          wg={selectedWg}
          currentUserId={user.id}
          onClose={() => setShowWgSettings(false)}
          onUpdated={(updatedWg) => {
            setWgs(prev => prev.map(wg => wg.id === updatedWg.id ? updatedWg : wg));
          }}
          onLeft={() => {
            setShowWgSettings(false);
            setSelectedWgId(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
