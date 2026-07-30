import { StaticPage } from './StaticPage';

const CHANNELS = [
  {
    icon: 'mail',
    title: 'E-Mail',
    text: 'Für Fragen, Feedback oder Kooperationen.',
    action: 'hallo@wehgehts.app',
    href: 'mailto:hallo@wehgehts.app',
  },
  {
    icon: 'support_agent',
    title: 'Support',
    text: 'Probleme mit eurem Konto oder eurer WG?',
    action: 'support@wehgehts.app',
    href: 'mailto:support@wehgehts.app',
  },
  {
    icon: 'bug_report',
    title: 'Bug melden',
    text: 'Etwas funktioniert nicht wie erwartet.',
    action: 'bugs@wehgehts.app',
    href: 'mailto:bugs@wehgehts.app',
  },
];

export function ContactPage() {
  return (
    <StaticPage
      eyebrow="Kontakt"
      title="Sag uns Bescheid"
      intro="Ob Frage, Idee oder Problem – wir lesen jede Nachricht und antworten so schnell wir können."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map((channel) => (
          <a
            key={channel.title}
            href={channel.href}
            className="group flex flex-col rounded-2xl border border-outline-variant bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-soft">
              <span className="material-symbols-outlined text-primary leading-none">
                {channel.icon}
              </span>
            </div>
            <h3 className="mt-4 font-headline text-base font-semibold">{channel.title}</h3>
            <p className="mt-1.5 text-sm text-on-surface-variant">{channel.text}</p>
            <span className="mt-3 text-sm font-medium text-primary transition-opacity group-hover:opacity-80">
              {channel.action}
            </span>
          </a>
        ))}
      </div>

      <div className="mt-8 border-t border-outline-variant pt-6 text-sm text-on-surface-variant">
        <p>
          Wir sind ein kleines Team – in der Regel meldet sich jemand innerhalb von
          1–2 Werktagen bei euch zurück.
        </p>
      </div>
    </StaticPage>
  );
}
