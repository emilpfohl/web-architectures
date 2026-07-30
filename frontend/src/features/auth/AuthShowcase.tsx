import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: 'checklist',
    title: 'Aufgaben, die niemand vergisst',
    text: 'Verteilt To-Dos in der WG, seht sofort wer dran ist.',
  },
  {
    icon: 'shopping_cart',
    title: 'Einkaufsliste in Echtzeit',
    text: 'Kein doppeltes Klopapier mehr – alle sehen live, was fehlt.',
  },
  {
    icon: 'payments',
    title: 'Faire Finanzen',
    text: 'Ausgaben automatisch aufteilen, transparent abrechnen.',
  },
  {
    icon: 'forum',
    title: 'Ein Chat für alles',
    text: 'Absprachen und Erinnerungen im gemeinsamen WG-Feed.',
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AuthShowcase() {
  return (
    <div className="relative hidden h-full w-full flex-col items-center overflow-hidden px-12 pt-4 pb-16 text-on-primary lg:flex">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-gray-300/40 bg-white/10 p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
          <div className="flex items-center gap-2 border-b border-white/15 pb-4">
            <div className="h-3 w-3 rounded-full bg-accent-peach" />
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <div className="h-3 w-3 rounded-full bg-sage-soft" />
            <span className="ml-3 text-sm font-medium text-on-primary/70">Wehgehts</span>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mt-4 grid gap-3"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={item}
                whileHover={{ y: -2 }}
                className="flex items-start gap-3 rounded-xl bg-white/10 p-3.5 transition-colors hover:bg-white/15"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <span className="material-symbols-outlined text-lg leading-none">{feature.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{feature.title}</p>
                  <p className="text-xs text-on-primary/70">{feature.text}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
    </div>
  );
}
