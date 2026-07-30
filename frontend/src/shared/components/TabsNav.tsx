import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAccountInitials } from '../lib/logic';
import { authFetch } from '../lib/authFetch';

interface TabsNavProps {
  wgs?: any[];
  selectedWgId?: number | null;
  onSelectWg?: (id: number) => void;
  user?: any;
  onOpenProfile?: () => void;
  onOpenWgSettings?: () => void;
  isDarkMode?: boolean;
}

export function TabsNav({ wgs, selectedWgId, onSelectWg, user, onOpenProfile, onOpenWgSettings, isDarkMode = false }: TabsNavProps) {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';
  const navigate = useNavigate();

  const tabs = [
    { id: 'dashboard', label: 'Start', icon: 'home_app_logo' },
    { id: 'todos', label: 'Aufgaben', icon: 'assignment' },
    { id: 'finance', label: 'Finanzen', icon: 'payments' },
    { id: 'shopping', label: 'Einkauf', icon: 'shopping_basket' },
  ];

  const handleLogout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors
    }
    navigate('/login');
  };

  const selectedWg = wgs?.find(w => w.id === selectedWgId);

  // Get user initials from user name
  return (
    <nav className={`relative flex items-center justify-between w-full border-b mb-0 pt-4 md:pt-7 px-4 md:px-8 ${isDarkMode ? 'border-white/10 bg-black/40 backdrop-blur-2xl backdrop-saturate-150 sticky top-0 z-30' : 'border-outline-variant/20'}`}>
      {/* Left side: WG Switcher */}
      <div className="flex items-center gap-2 pb-4 min-w-[140px]">
        {wgs && wgs.length > 0 && (
          <div className="flex items-center gap-2">
            {wgs.length === 1 ? (
              <button
                onClick={onOpenWgSettings}
                title="WG bearbeiten"
                className="flex items-center gap-2 group"
              >
                {selectedWg?.icon ? (
                  <span className="text-[16px] leading-none">{selectedWg.icon}</span>
                ) : (
                  <span className={`material-symbols-outlined text-[20px] [font-variation-settings:'FILL'_1,'wght'_300] ${isDarkMode ? 'text-white' : 'text-primary'}`}>
                    home
                  </span>
                )}
                <span className={`font-headline text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.15em] group-hover:opacity-70 transition-opacity ${isDarkMode ? 'text-white' : 'text-on-surface'}`}>
                  {selectedWg?.name || 'WG'}
                </span>
              </button>
            ) : (
              <>
                {selectedWg?.icon ? (
                  <span className="text-[16px] leading-none">{selectedWg.icon}</span>
                ) : (
                  <span className={`material-symbols-outlined text-[20px] [font-variation-settings:'FILL'_1,'wght'_300] ${isDarkMode ? 'text-white' : 'text-primary'}`}>
                    home
                  </span>
                )}
                <select
                  value={selectedWgId || ''}
                  onChange={(e) => onSelectWg?.(Number(e.target.value))}
                  className={`font-headline text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.15em] bg-transparent border-none cursor-pointer focus:outline-none focus:ring-0 pr-4 ${isDarkMode ? 'text-white' : 'text-on-surface'}`}
                >
                  {wgs.map(wg => (
                    <option key={wg.id} value={wg.id}>{wg.name}</option>
                  ))}
                </select>
                <button
                  onClick={onOpenWgSettings}
                  title="WG bearbeiten"
                  className={`material-symbols-outlined text-[16px] transition-colors ${isDarkMode ? 'text-white/50 hover:text-white' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}`}
                >
                  settings
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center: Tabs */}
      <div className="flex items-center justify-center gap-3 md:gap-16 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              to={`/?tab=${tab.id}`}
              data-cy={`nav-tab-${tab.id}`}
              className={`
                relative flex items-center gap-2 transition-all duration-300 px-2 group
                ${isActive ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/50 hover:text-white' : 'text-on-surface-variant/40 hover:text-on-surface-variant')}
              `}
            >
              <span className={`material-symbols-outlined text-[18px] md:text-[20px] transition-all duration-500 ${isActive ? "[font-variation-settings:'FILL'_1,'wght'_300]" : "[font-variation-settings:'FILL'_0,'wght'_200]"}`}>
                {tab.icon}
              </span>
              <span className="font-headline text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.2em]">
                {tab.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeUnderline"
                  className={`absolute -bottom-[12px] left-0 right-0 h-[2px] rounded-full shadow-lg ${isDarkMode ? 'bg-white shadow-white/20' : 'bg-primary shadow-primary/10'}`}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Right side: Profile + Logout */}
      <div className="flex items-center gap-2 pb-4 min-w-[140px] justify-end">
        {user && (
          <button
            onClick={onOpenProfile}
            title="Profil bearbeiten"
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 group border ${isDarkMode ? 'text-white hover:bg-white/10 border-transparent hover:border-white/20' : 'text-on-surface-variant hover:bg-sage-soft/30 border-transparent hover:border-primary/10'}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] ${isDarkMode ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'} ${!user?.icon ? 'text-[10px] font-black uppercase' : ''}`}>
              {user?.icon || getAccountInitials(user?.name)}
            </div>
            <span className={`hidden md:inline font-headline text-[10px] font-bold uppercase tracking-[0.15em] ${isDarkMode ? 'text-white/80' : 'text-on-surface-variant'}`}>
              {user.name}
            </span>
          </button>
        )}
        <button
          onClick={handleLogout}
          title="Abmelden"
          data-cy="logout-button"
          className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 group border border-transparent ${isDarkMode ? 'text-white/50 hover:text-red-300 hover:bg-red-950/30 hover:border-red-300/20' : 'text-on-surface-variant/50 hover:text-red-500 hover:bg-red-50/50 hover:border-red-100'}`}
        >
          <span className="material-symbols-outlined text-[18px] md:text-[20px] transition-all duration-300 group-hover:scale-110 [font-variation-settings:'FILL'_0,'wght'_300]">
            logout
          </span>
          <span className="hidden md:inline font-headline text-[10px] font-bold uppercase tracking-[0.2em]">
            Abmelden
          </span>
        </button>
      </div>
    </nav>
  );
}
