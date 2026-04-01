'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export function TabsNav() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const tabs = [
    { id: 'dashboard', label: 'Vibe', icon: 'home_app_logo' },
    { id: 'todos', label: 'Tasks', icon: 'assignment' },
    { id: 'finance', label: 'Money', icon: 'payments' },
    { id: 'shopping', label: 'Stock', icon: 'shopping_basket' },
  ];

  return (
    <nav className="flex items-center justify-center w-full border-b border-outline-variant/20 mb-12 pt-4 md:pt-7">
      <div className="flex items-center justify-center gap-3 md:gap-16 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
        {tabs.map(tab => {
          const isActive = currentTab === tab.id;
          return (
            <Link 
              key={tab.id} 
              href={`/?tab=${tab.id}`}
              className={`
                relative flex items-center gap-2 transition-all duration-300 px-2 group
                ${isActive ? 'text-primary' : 'text-on-surface-variant/40 hover:text-on-surface-variant'}
              `}
            >
              <span className={`material-symbols-outlined text-[18px] md:text-[20px] transition-all duration-500 ${isActive ? '[font-variation-settings:\'FILL\'_1,\'wght\'_300]' : '[font-variation-settings:\'FILL\'_0,\'wght\'_200]'}`}>
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
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                    mass: 0.8
                  }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  );
}
