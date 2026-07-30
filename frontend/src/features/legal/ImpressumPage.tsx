import { StaticPage } from './StaticPage';

export function ImpressumPage() {
  return (
    <StaticPage eyebrow="Impressum" title="Impressum" intro="Angaben gemäß § 5 TMG.">
      <div className="space-y-8 text-sm text-on-surface-variant">
        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            Angaben zum Betreiber
          </h2>
          <p className="mt-2">
            Emil Pfohl
            <br />
            Osianderstr. 6
            <br />
            90443 Nürnberg
            <br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">Kontakt</h2>
          <p className="mt-2">
            E-Mail: hallo@wehgehts.de
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
          </h2>
          <p className="mt-2">
            Emil Pfohl
            <br />
            Osianderstr. 6
            <br />
            90443 Nürnberg
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">Haftungsausschluss</h2>
          <p className="mt-2">
            Die Inhalte dieser Seiten wurden mit größtmöglicher Sorgfalt erstellt.
            Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können
            wir jedoch keine Gewähr übernehmen.
          </p>
        </section>
      </div>
    </StaticPage>
  );
}
