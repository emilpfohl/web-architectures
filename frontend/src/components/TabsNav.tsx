import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface TabsNavProps {
  wgs?: any[];
  selectedWgId?: number | null;
  onSelectWg?: (id: number) => void;
  user?: any;
  onOpenProfile?: () => void;
}

export function TabsNav({ wgs, selectedWgId, onSelectWg, user, onOpenProfile }: TabsNavProps) {
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
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore network errors
    }
    navigate('/login');
  };

  const selectedWg = wgs?.find(w => w.id === selectedWgId);

  // Get user initials from user name
  const getUserInitials = () => {
    if (!user?.name) return '?';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <nav className="relative flex items-center justify-between w-full border-b border-outline-variant/20 mb-0 pt-4 md:pt-7 px-4 md:px-8">
      {/* Left side: WG Switcher */}
      <div className="flex items-center gap-2 pb-4 min-w-[140px]">
        {wgs && wgs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px] [font-variation-settings:'FILL'_1,'wght'_300]">
              home
            </span>
            {wgs.length === 1 ? (
              <span className="font-headline text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.15em] text-on-surface">
                {selectedWg?.name || 'WG'}
              </span>
            ) : (
              <select
                value={selectedWgId || ''}
                onChange={(e) => onSelectWg?.(Number(e.target.value))}
                className="font-headline text-[11px] md:text-[12px] font-semibold uppercase tracking-[0.15em] text-on-surface bg-transparent border-none cursor-pointer focus:outline-none focus:ring-0 pr-4"
              >
                {wgs.map(wg => (
                  <option key={wg.id} value={wg.id}>{wg.name}</option>
                ))}
              </select>
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
              className={`
                relative flex items-center gap-2 transition-all duration-300 px-2 group
                ${isActive ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}
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
                  className="absolute -bottom-[12px] left-0 right-0 h-[2px] bg-primary rounded-full shadow-lg shadow-primary/10"
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
            className="flex items-center gap-2 px-3 py-2 rounded-full text-on-surface-variant hover:bg-sage-soft/30 transition-all duration-300 group border border-transparent hover:border-primary/10"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
              {getUserInitials()}
            </div>
            <span className="hidden md:inline font-headline text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
              {user.name}
            </span>
          </button>
        )}
        <button
          onClick={handleLogout}
          title="Abmelden"
          className="flex items-center gap-2 px-3 py-2 rounded-full text-on-surface-variant/50 hover:text-red-500 hover:bg-red-50/50 transition-all duration-300 group border border-transparent hover:border-red-100"
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
