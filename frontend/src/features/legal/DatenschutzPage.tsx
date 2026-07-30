import { StaticPage } from './StaticPage';

export function DatenschutzPage() {
  return (
    <StaticPage
      eyebrow="Datenschutz"
      title="Datenschutzerklärung"
      intro="Informationen gemäß Art. 13, 14 DSGVO."
    >
      <div className="space-y-8 text-sm text-on-surface-variant">
        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            1. Verantwortlicher
          </h2>
          <p className="mt-2">
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
            <br />
            <br />
            Emil Pfohl
            <br />
            Osianderstr. 6
            <br />
            90443 Nürnberg
            <br />
            Deutschland
            <br />
            E-Mail: hallo@wehgehts.de
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            2. Allgemeines zur Datenverarbeitung
          </h2>
          <p className="mt-2">
            Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur,
            soweit dies zur Bereitstellung einer funktionsfähigen Website sowie
            unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung
            personenbezogener Daten erfolgt regelmäßig nur nach Einwilligung des
            Nutzers oder auf Grundlage einer gesetzlichen Erlaubnis (Art. 6 Abs. 1
            DSGVO).
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            3. Bereitstellung der Website und Erstellung von Logfiles
          </h2>
          <p className="mt-2">
            Bei jedem Aufruf unserer Website erfasst unser System automatisiert
            Daten und Informationen vom Computersystem des aufrufenden Rechners
            (z. B. IP-Adresse, Datum und Uhrzeit des Zugriffs, verwendeter Browser
            und Betriebssystem). Diese Daten werden in Logfiles gespeichert und
            dienen ausschließlich der Gewährleistung eines störungsfreien
            Betriebs sowie der Systemsicherheit. Rechtsgrundlage ist Art. 6 Abs. 1
            lit. f DSGVO (berechtigtes Interesse).
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            4. Konto- und Nutzungsdaten
          </h2>
          <p className="mt-2">
            Wenn du ein Konto bei uns erstellst, verarbeiten wir die von dir
            angegebenen Daten (z. B. Name, E-Mail-Adresse, Passwort in
            gehashter Form sowie die im Rahmen der Nutzung anfallenden Daten zu
            WG, Aufgaben, Einkäufen, Finanzen, Kalender und Nachrichten) zur
            Bereitstellung und Durchführung des Vertragsverhältnisses.
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO. Ohne diese Daten ist
            die Nutzung der Plattform nicht möglich.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            5. Google Fonts
          </h2>
          <p className="mt-2">
            Diese Website nutzt zur einheitlichen Darstellung von Schriftarten
            sogenannte Web Fonts, die von Google LLC, 1600 Amphitheatre Parkway,
            Mountain View, CA 94043, USA ("Google"), bereitgestellt werden
            (Google Fonts). Beim Aufruf einer Seite lädt dein Browser die
            benötigten Schriftarten direkt von Servern von Google, wobei eine
            Verbindung zu Servern von Google hergestellt und dabei deine
            IP-Adresse an Google übermittelt wird. Google erhält dadurch
            Kenntnis darüber, dass über deine IP-Adresse unsere Website
            aufgerufen wurde.
          </p>
          <p className="mt-2">
            Die Nutzung von Google Fonts erfolgt im Interesse einer einheitlichen
            und ansprechenden Darstellung unserer Online-Angebote. Dies stellt
            ein berechtigtes Interesse im Sinne von Art. 6 Abs. 1 lit. f DSGVO
            dar. Sofern eine entsprechende Einwilligung abgefragt wurde, erfolgt
            die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit.
            a DSGVO; die Einwilligung ist jederzeit widerrufbar.
          </p>
          <p className="mt-2">
            Die USA werden vom Europäischen Gerichtshof als Land mit einem nach
            EU-Standards unzureichendem Datenschutzniveau eingestuft. Es
            besteht insbesondere das Risiko, dass deine Daten durch US-Behörden
            verarbeitet werden können, ohne dass dir hiergegen wirksame
            Rechtsbehelfe zustehen. Google LLC ist unter dem EU-US Data Privacy
            Framework zertifiziert, wodurch ein angemessenes Datenschutzniveau
            sichergestellt werden soll.
          </p>
          <p className="mt-2">
            Weitere Informationen zu Google Fonts findest du unter{' '}
            <a
              href="https://developers.google.com/fonts/faq"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:opacity-80"
            >
              developers.google.com/fonts/faq
            </a>{' '}
            sowie in der Datenschutzerklärung von Google unter{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:opacity-80"
            >
              policies.google.com/privacy
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            6. Speicherdauer
          </h2>
          <p className="mt-2">
            Wir speichern personenbezogene Daten nur so lange, wie dies für die
            Erfüllung der jeweiligen Zwecke erforderlich ist oder wie es
            gesetzliche Aufbewahrungsfristen vorsehen. Nach Löschung deines
            Kontos werden deine Daten gelöscht, soweit keine gesetzlichen
            Aufbewahrungspflichten entgegenstehen.
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            7. Deine Rechte
          </h2>
          <p className="mt-2">
            Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art.
            16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung
            (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) sowie
            Widerspruch gegen die Verarbeitung (Art. 21 DSGVO). Zudem steht dir
            ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde zu (Art.
            77 DSGVO).
          </p>
        </section>

        <section>
          <h2 className="font-headline text-base font-semibold text-foreground">
            8. Kontakt zum Datenschutz
          </h2>
          <p className="mt-2">
            Bei Fragen zum Datenschutz kannst du dich jederzeit unter
            hallo@wehgehts.de an uns wenden.
          </p>
        </section>
      </div>
    </StaticPage>
  );
}
