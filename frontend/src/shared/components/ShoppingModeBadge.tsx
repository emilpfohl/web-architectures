import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function ShoppingModeBadge() {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      <motion.button
        key="shopping-mode-badge"
        onClick={() => navigate('/?tab=shopping')}
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        data-cy="shopping-mode-badge"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-4 pr-5 py-3 rounded-full bg-primary text-on-primary shadow-lg hover:scale-[1.03] active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-[20px] [font-variation-settings:'FILL'_1,'wght'_300]">
          shopping_basket
        </span>
        <span className="font-headline text-[11px] font-bold uppercase tracking-[0.15em]">
          Du bist einkaufen
        </span>
      </motion.button>
    </AnimatePresence>
  );
}
