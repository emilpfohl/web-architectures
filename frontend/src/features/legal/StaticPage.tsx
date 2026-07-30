import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Footer } from '../../shared/components/Footer';

export function StaticPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="login-page relative min-h-screen overflow-hidden font-body text-foreground">
      <div className="bg-flare" />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-10 flex items-center bg-gradient-to-b from-background via-background/90 to-transparent px-4 py-4 sm:px-[30px] sm:py-[30px]">
        <Link
          to="/welcome"
          className="pointer-events-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-opacity hover:opacity-80 sm:text-sm"
        >
          <span className="material-symbols-outlined text-lg leading-none">arrow_back</span>
          Zurück zur Startseite
        </Link>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-24 pb-24 sm:pt-28 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          <span className="inline-block rounded-full bg-sage-soft px-4 py-1.5 text-sm font-medium text-primary">
            {eyebrow}
          </span>
          <h1 className="mt-5 font-headline text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 max-w-xl text-lg text-on-surface-variant">{intro}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:p-10"
        >
          {children}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
