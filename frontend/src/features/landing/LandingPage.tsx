import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: 'checklist',
    title: 'Aufgaben, die niemand vergisst',
    text: 'Verteilt To-Dos in der WG, seht sofort wer dran ist und wer zuletzt geputzt hat.',
  },
  {
    icon: 'shopping_cart',
    title: 'Einkaufsliste in Echtzeit',
    text: 'Wer gerade einkaufen ist, sieht live, was noch fehlt – kein doppeltes Klopapier mehr.',
  },
  {
    icon: 'payments',
    title: 'Faire Finanzen',
    text: 'Ausgaben eintragen, automatisch aufteilen, transparent abrechnen – ohne Excel-Chaos.',
  },
  {
    icon: 'forum',
    title: 'Ein Chat für alles',
    text: 'Absprachen, Ankündigungen und Erinnerungen landen direkt im gemeinsamen WG-Feed.',
  },
];

const STATS = [
  { value: '< 1 Min', label: 'bis eure WG startklar ist' },
  { value: '100%', label: 'kostenlos, keine Werbung' },
  { value: '0', label: 'Excel-Tabellen mehr nötig' },
];

export function LandingPage() {
  return (
    <div className="login-page relative min-h-screen overflow-hidden font-body text-foreground">
      <div className="bg-flare" />

      {/* Above the fold */}
      <section className="relative z-10 overflow-hidden px-6 pt-10 pb-24 sm:pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto h-56 w-full max-w-3xl rounded-full bg-[radial-gradient(ellipse_at_center,white_0%,white_40%,rgba(94,96,91,0.1)_70%,rgba(94,96,91,0)_100%)] blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-sage-soft px-4 py-1.5 text-sm font-medium text-primary">
            Für WGs gemacht
          </span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-6 font-headline text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            Eure WG, endlich organisiert
            <br />
            <span className="text-primary">ohne Zettel-Chaos an der Kühlschranktür</span>
          </motion.h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-on-surface-variant">
            Aufgaben, Einkaufsliste, Finanzen und Chat an einem Ort – alle Mitbewohner
            sehen sofort, was Sache ist. Kostenlos, in unter einer Minute eingerichtet.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="w-full rounded-2xl bg-primary px-8 py-4 text-center font-medium text-on-primary shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 sm:w-auto"
            >
              Kostenlos starten
            </Link>
            <Link
              to="/login"
              className="w-full rounded-2xl border border-white/60 bg-white/70 px-8 py-4 text-center font-medium text-foreground backdrop-blur-xl transition-all hover:bg-white sm:w-auto"
            >
              Ich habe schon ein Konto
            </Link>
          </div>

          <div className="relative z-10 mx-auto mt-8 mb-4 grid max-w-lg grid-cols-3 gap-4 sm:mt-10">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-headline text-2xl font-bold text-primary sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Illustrative "hero" mock without a real screenshot yet: a stylised
            preview card built from existing UI primitives, not a stock photo. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 mx-auto mt-16 max-w-2xl rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-2xl shadow-primary/10 backdrop-blur-2xl sm:p-8"
        >
          <div className="flex items-center gap-2 border-b border-outline-variant pb-4">
            <div className="h-3 w-3 rounded-full bg-accent-peach" />
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <div className="h-3 w-3 rounded-full bg-sage-soft" />
            <span className="ml-3 text-sm font-medium text-on-surface-variant">WG Wehgehts</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-sage-soft/60 p-4">
              <p className="text-sm font-semibold text-primary">Küche putzen</p>
              <p className="text-xs text-on-surface-variant">Fällig heute · Marco</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold">Einkaufsliste</p>
              <p className="text-xs text-on-surface-variant">3 offene Artikel</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features & Nutzen */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center font-headline text-3xl font-bold">
            Alles, was eure WG wirklich braucht
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/60 bg-white/70 p-6 text-left backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-soft">
                  <span className="material-symbols-outlined text-primary leading-none">{feature.icon}</span>
                </div>
                <h3 className="mt-4 font-headline text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative z-10 px-6 pb-32 sm:pb-36">
        <div className="mx-auto max-w-2xl rounded-[2rem] bg-primary px-8 py-12 text-center text-on-primary shadow-2xl shadow-primary/20">
          <h2 className="font-headline text-2xl font-bold sm:text-3xl">
            Bereit für weniger WG-Chaos?
          </h2>
          <p className="mt-3 text-on-primary/80">
            Registriert eure WG in unter einer Minute – keine Kreditkarte, keine Werbung.
          </p>
          <Link
            to="/register"
            className="mt-7 inline-block rounded-2xl bg-white px-8 py-4 font-medium text-primary shadow-lg transition-all hover:-translate-y-0.5"
          >
            Kostenlos starten
          </Link>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-center justify-between px-4 py-4 sm:px-[30px] sm:py-[30px]">
        <div className="pointer-events-auto flex items-center gap-4 sm:gap-5">
          <Link to="/contact" className="text-xs font-medium text-primary transition-opacity hover:opacity-80 sm:text-sm">
            Kontakt
          </Link>
          <Link to="/impressum" className="text-xs font-medium text-primary transition-opacity hover:opacity-80 sm:text-sm">
            Impressum
          </Link>
        </div>
        <div className="pointer-events-auto hidden lg:flex">
          <Link to="/about" className="text-sm font-medium text-primary transition-opacity hover:opacity-80">
            Über uns
          </Link>
        </div>
      </div>
    </div>
  );
}
