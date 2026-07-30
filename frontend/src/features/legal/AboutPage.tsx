import { StaticPage } from './StaticPage';

const VALUES = [
  {
    icon: 'favorite',
    title: 'Für WGs, von WG-Bewohnern',
    text: 'Wehgehts entstand aus echtem WG-Alltag – vergessenen Spülplänen, verschwundenem Klopapier, unklaren Finanzen.',
  },
  {
    icon: 'lock',
    title: 'Eure Daten bleiben eure Daten',
    text: 'Kein Weiterverkauf, keine versteckte Werbung. Wir verdienen kein Geld mit euren Informationen.',
  },
  {
    icon: 'bolt',
    title: 'Einfach statt überladen',
    text: 'Statt zehn Apps für zehn Probleme: ein Ort für Aufgaben, Einkauf, Finanzen und Kommunikation.',
  },
];

export function AboutPage() {
  return (
    <StaticPage
      eyebrow="Über uns"
      title="Warum es Wehgehts gibt"
      intro="Wir glauben, dass gutes Zusammenleben nicht an Excel-Tabellen und vergessenen Zetteln scheitern sollte."
    >
      <div className="space-y-5 text-on-surface-variant">
        <p>
          Wehgehts ist als kleines Side-Project entstanden, weil unsere eigene WG
          irgendwann den Überblick verloren hatte: Wer hat zuletzt geputzt? Wer hat das
          letzte Bier bezahlt? Wer wollte nochmal was vom Markt mitbringen? Wir haben
          nach einer App gesucht, die das alles einfach löst – und keine gefunden, die
          uns überzeugt hat. Also haben wir sie selbst gebaut.
        </p>
        <p>
          Heute ist Wehgehts eine kostenlose Plattform für WGs jeder Größe: Aufgaben
          verteilen, gemeinsam einkaufen, Ausgaben fair aufteilen und im WG-Chat
          alles Wichtige an einem Ort besprechen.
        </p>
      </div>

      <div className="mt-8 grid gap-4 border-t border-outline-variant pt-8 sm:grid-cols-3">
        {VALUES.map((value) => (
          <div key={value.title}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-soft">
              <span className="material-symbols-outlined text-primary leading-none">
                {value.icon}
              </span>
            </div>
            <h3 className="mt-4 font-headline text-base font-semibold">{value.title}</h3>
            <p className="mt-1.5 text-sm text-on-surface-variant">{value.text}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
