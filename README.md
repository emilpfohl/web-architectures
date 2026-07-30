# 01 - Intro & Full Stack Setup

## Aufgabe 1: Projektidee & erstes Feature

**User-Story:**
Als Mitbewohner einer WG möchte ich eine Übersicht haben, was zum Beispiel an To-Dos ansteht oder wer zuletzt geputzt hat etc.

# 02 - Frontend-Architektur

Mit deaktiviertem JavaScript zeigt die Next.js-Seite HTML-Inhalt, unsere Vite-App zeigt nur eine weiße Seite — für den WG-Planer irrelevant, weil sowieso erst nach Login nutzbar und nicht zwingend SEO-relevant.

# 03 - API-Design

Ressourcen: `WG`, `User`, `ToDo`, `Einkaufsliste`, `Finanzen`, `Moods`.

Struktur: Wir haben uns gegen eine starre URL-Hierarchie sondern für eine flache Struktur mit Query-Parametern entschieden. 
Grund: Dies ermöglicht es Nutzern, WG-übergreifend zu nutzen (z.B. "Zeige mir alle meine Aufgaben aus allen WGs") und vereinfacht die API-Entwicklung massiv.

->
Die wichtigste Ressource für die Interaktion in der WG ist das ToDo-Element. In unserem Projekt muss ein ToDo jedoch immer einer `wgId` zugeordnet sein, damit die Daten sauber getrennt bleiben.

Iteration 1:
- `GET /api/todos?wgId=X` – Gibt alle ToDos einer WG zurück.
- `GET /api/todos/:id` – Gibt ein spezifisches ToDo zurück.
- `POST /api/todos` – Erstellt ein ToDo (erwartet `title` und `wgId`).
- `PUT /api/todos/:id` – Aktualisiert/Ersetzt ein ToDo.
- `DELETE /api/todos/:id` – Löscht ein ToDo.

Iteration 2:
1. **Fehlerbehandlung**: Wir haben explizit **400 Bad Request** gefordert, falls die `wgId` oder der `title` im Body fehlen.
2. **Status-Codes**: Wir haben festgelegt, dass `DELETE` mit **204 No Content** antworten muss und `POST` mit **201 Created**.
3. **NotFound**: Ein **404 Not Found** wird zurückgegeben, wenn eine ID beim `GET`, `PUT` oder `DELETE` nicht existiert.
4. **Relationales Mapping**: Wir haben ergänzt, dass `assigneeId` (User-Referenz) optional übergeben werden kann, um den Multi-User-Aspekt zu stützen.

Lösungsvorschlag -> Express.js

**Hoppscotch test:**

Fehler 1: 400 Bad Request (Pflichtparameter fehlt)
Szenario: Abruf von ToDos ohne Angabe einer `wgId`.  
Request: `GET http://localhost:3000/api/todos`

```json
{
  "error": "wgId parameter is required"
}
```

Fehler 2: 404 Not Found (Ressource existiert nicht)
Szenario: Abruf eines ToDos mit einer ID, die nicht existiert.  
Request: `GET http://localhost:3000/api/todos/999`

```text
Not found
```

Fehler 3: 400 Bad Request (Pflichtfeld im Body fehlt)
Szenario: Erstellen eines ToDos ohne das Feld `title`.  
Request: `POST http://localhost:3000/api/todos`  
Body: `{"wgId": 1}`

```json
{
  "error": "title parameter is required"
}
```


# 04 - Datenhaltung & Persistenz

Datenmodell (Prisma / SQLite)

Wir nutzen Prisma als mit SQLite DB.
-> WGs mit mehreren Mitgliedern (zwingend notwendig)

| Model | Felder | Beschreibung |
| :--- | :--- | :--- |
| **User** | id, name, email | Registrierte Nutzer der Plattform. |
| **WG** | id, name, createdAt | Wohngemeinschaften als zentrale Organisationseinheit. |
| **Membership** | userId, wgId, role | Verknüpft Nutzer mit WGs (n:m Beziehung mit Rollen). |
| **ShoppingItem** | id, wgId, name, checked, category | Artikel auf der Einkaufsliste einer WG. |
| **Todo** | id, wgId, title, assigneeId, completed | Aufgaben innerhalb einer WG. |
| **CalendarEvent** | id, wgId, date, title | Termine und Events einer WG. |
| **FinanceItem** | id, wgId, amount, description, paidById | Ausgaben und Finanzen. |
| **Invitation** | id, wgId, token, role, usedCount, maxUses | Einladungs-Links für neue Mitglieder. |
| **Message** | id, wgId, type, content, senderId, timestamp | System- und User-Nachrichten im WG-Feed. |

**Beziehungen:** User↔WG ist n:m über `Membership` (ein User kann in mehreren WGs sein, eine WG hat mehrere Mitglieder). Alle anderen Ressourcen (Todo, ShoppingItem, CalendarEvent, FinanceItem, Invitation, Message) hängen 1:n an einer WG. Pflichtfelder: `title`/`name` sowie die jeweilige `wgId`-Fremdschlüsselbeziehung dürfen nicht leer sein.

Aufgabe 2: Prisma-Setup

Prisma wurde mit `better-sqlite3` als initialem Entwicklungs-Datenbanktreiber eingerichtet (`prisma/schema.prisma`, erste Migration per `prisma migrate dev`). Die Datenbank-Verbindung liegt in `backend/.env` unter `DATABASE_URL` und ist über `.gitignore` von Git ausgeschlossen.

Aufgabe 3: Von Array zu Prisma-Query (Prompt-Iterationen)

Iteration 1:
Ersetze den GET /api/todos-Handler. Bisher: res.json(todos).
Neu: Alle Todos aus der Datenbank laden mit prisma und als JSON zurückgeben.

-> Handler funktioniert, gibt aber alle Todos von allen WGs zurück – `wgId`-Filterung aus der Query fehlt hier, keine einheitliche Fehlerbehandlung.

Iteration 2:
Der GET /api/todos-Handler soll nur Todos der übergebenen wgId laden
(prisma.todo.findMany({ where: { wgId } })). Wenn wgId fehlt, wirf einen
ValidationError. Wenn der User kein Mitglied der WG ist, wirf einen
AccessDeniedError. Zentrale Fehlerklassen statt einzelner try/catch-Blöcke
in jedem Handler.


Aufgabe 4: Persistenz-Test

Getestet: Server gestartet, per Hoppscotch ein neues Todo per `POST /api/todos` angelegt, Server mit `Ctrl+C` gestoppt und neu gestartet, danach `GET /api/todos` erneut aufgerufen.

Ergebnis: Erster testlauf nicht unbedingt eindeutig –> mehrere parallel laufende Server (Port 3000 alten Prozess belegt), so war unklar ob der neu gestartete Server tatsächlich dieselbe SQLite-Datei verwendete. Nach Bereinigung des Ports (`lsof -ti:3000 | xargs kill -9` vor jedem Neustart) war der Eintrag nach dem Neustart zuverlässig noch vorhanden – die SQLite-Datei liegt auf Platte und übersteht den Prozess-Neustart, im Gegensatz zu den vorherigen In-Memory-Arrays aus Session 03.

Aufgabe 5: Architekturentscheidung – DB vs. Redis/S3 (Bonus)

Die meisten unserer Daten (Todos, Finanzen, Kalender, Mitgliedschaften) sind strukturiert, relational und müssen dauerhaft und konsistent bleiben – dafür ist eine relationale Datenbank (SQLite/MySQL via Prisma) richtig. Für kurzlebige, häufig wechselnde Daten wie Chat-Presence ("wer ist gerade online") oder Session-/Token-Caching wäre **Redis** langfristig sinnvoller, da diese Daten nicht dauerhaft persistiert werden müssen und von schnellerem In-Memory-Zugriff profitieren. Für Datei-Uploads wie Profilbilder wäre ein **Object Store (S3)** besser geeignet als das Ablegen von Binärdaten in der relationalen DB, da Objektspeicher für große, unstrukturierte Dateien und deren Auslieferung über CDN optimiert ist.

# 05 - Authentifizierung

Test-Zugangsdaten (Development)

| Nutzer | E-Mail | Passwort |
| :--- | :--- | :--- |
| **Allgemeiner Test-Nutzer** | `test@example.com` | `password123` |
| **Sarah** | `sarah@example.com` | `password123` |
| **Marco** | `marco@example.com` | `password123` |

---

Aufgabe 1

Wenn wir die GET- und DELETE-Handler aus unserem ersten API-Entwurf (Session 03/04) betrachten, fallen kritische Sicherheitslücken auf. Ein vollkommen anonymer Nutzer kann aktuell drei Dinge tun, die in einer sicheren API nicht möglich sein dürften:

1. **Fremde WG-Daten auslesen (Information Disclosure):** Ein anonymer Nutzer kann einfach den `wgId`-Parameter in der URL anpassen (z. B. `GET /api/todos?wgId=42`) und dadurch private ToDos einer beliebigen anderen WG einsehen. Es fehlt eine Autorisierungsprüfung, ob der Nutzer überhaupt Mitglied der abgefragten WG ist.
2. **Fremde Einträge löschen (Unauthorized Data Destruction):** Durch Aufrufen des DELETE-Endpunkts mit einer ausgedachten oder iterierten ID (z. B. `DELETE /api/todos/15`) kann jemand Aufgaben einer völlig fremden Personen endgültig löschen. Der Server prüft weder, wer die Anfrage sendet, noch ob dieser berechtigt ist (z.B. Admin-Rechte oder Ersteller der Aufgabe).
3. **Ohne Account identitätslose Requests senden (Fehlende Authentifizierung):** Man muss sich derzeit gar nicht erst einloggen oder registrieren, um mit der API zu interagieren. Jedes beliebige Skript im Internet kann direkt Anfragen senden. Es gibt kein Token, das einen "anonymen Nutzer" aus dem System aussperrt – das macht die API anfällig für automatisches Scrapen oder Massenlöschungen ohne Identitätsnachweis.

Aufgabe 2

**Frage:** Was passiert, wenn jemand versucht, den JWT-Payload manuell zu verändern (z. B. die `userId` auf eine fremde zu ändern)? Warum funktioniert das nicht?

Ein Angreifer könnte den Base64-codierten Payload des Tokens im Frontend dekodieren, die `userId` zu der eines Administrators oder einer fremden Person ändern und den Token wieder ins Cookie einsetzen.

**Was passiert?**
Sobald dieser manipulierte Token an den Server gesendet wird, schlägt die `jwt.verify(token, JWT_SECRET)` Methode in unserer Authentifizierungs-Middleware fehlt. Die Route wird abgebrochen und der Server wirft einen Fehler (`401 Nicht authentifiziert`).

**Warum funktioniert das nicht?**
Ein JWT besteht aus drei Teilen: *Header*, *Payload* (Daten) und der *Signature* (Signatur).
Die Signatur wird vom Server mittels eines geheimen Schlüssels (in unserem Fall `JWT_SECRET`) kryptografisch aus dem Header und dem Payload berechnet. 
Wenn ein Nutzer nun den Payload (also zum Beispiel eine ID) manuell ändert, passt die angehängte Signatur nicht mehr zu den geänderten Daten. Da der Nutzer den geheimen Serverschlüssel (`JWT_SECRET`) nicht besitzt, kann er unmöglich eine neue, passende Signatur für den manipulierten Payload berechnen. Der Server bemerkt beim Validierungsprozess sofort den Unterschied zwischen der berechneten und der mitgelieferten Signatur und erkennt den Token dadurch eindeutig als manipuliert.

Aufgabe 5

Manueller Test-Flow durchgeführt – alle Prüfungen bestanden:

- [x] `/register` → neuen Nutzer angelegt → Weiterleitung auf die Startseite funktioniert.
- [x] Logout (Token-Cookie gelöscht) → Aufruf einer geschützten Seite → Weiterleitung zu `/login`.
- [x] Nach Login: JWT als HttpOnly-Cookie in den Browser-DevTools unter *Application → Cookies* sichtbar.
- [x] Request via Hoppscotch ohne Token → Server antwortet mit `401`.
- [x] Abruf einer Ressource eines anderen Nutzers/einer fremden WG → Server antwortet mit `404`.

# 06 - Sicherheits-Audit (OWASP Top 10)

Nachfolgend sind die Ergebnisse des Sicherheits-Audits vom 29.04.2026 zusammengefasst. Alle festgestellten Lücken wurden unmittelbar geschlossen.

| Kategorie | Status | Befund | Fix |
| :--- | :--- | :--- | :--- |
| **A01: Broken Access Control** | ✅ Behoben | Fehlende Ownership-Checks (IDOR) bei WG-Ressourcen & User-Leak. | Alle Endpunkte prüfen nun via Prisma die WG-Mitgliedschaft (`userId_wgId`). |
| **A02: Cryptographic Failures** | ✅ Behoben | JWT-Secret hatte statischen Fallback; Passwörter waren bereits sicher (bcrypt). | Statischer Fallback entfernt; App erzwingt nun `.env` Definition. |
| **A03: Injection** | ✅ Abgedeckt | Dank Prisma (Prepared Statements) keine SQL-Injection möglich. | Keine Aktion erforderlich; XSS-Schutz via Frontend/React sichergestellt. |
| **A07: Authentication Failures** | ✅ Behoben | Keine Anforderung an Passwortstärke beim Register. | Passwort-Validierung (min. 8 Zeichen) in `auth.js` hinzugefügt. |


Ebene           Was testen wir bei uns            Tool
Unit                                       
Integration
E2E

# 07 Real Time Web

Gibt es Daten in eurer App, die sich ändern können, während ein anderer Nutzer die Seite offen hat?	
Ja - Chat, Einkaufliste, To-Do


Müssen Änderungen sofort sichtbar sein – oder reicht ein Reload?	 
Wäre schon besser

Ist die Kommunikation einseitig (Server → Client) oder bidirektional (beide senden)?
bidirektional

Wie viele Clients könnten gleichzeitig verbunden sein?
Zumindest 5 für 5er WGS

Trefft danach eine begründete Technologieentscheidung:
WebSockets → Beide Seiten kommunizieren aktiv (z.B. Chat, kollaboratives Editing, Multiplayer)
Ist hier sinnvoll vorallem wegen dem Chat und weil Datenpakete von Clients an den Server gegeben werden und gleichzeitig auch vom Server an andere Clients ausgegeben

„Welche Teile meiner App würden langfristig von Echtzeit-Kommunikation profitieren, welche nicht? Wo wäre Polling (z.B. alle 5 Sekunden ein GET) die ehrlichere Lösung? Begründe anhand meines konkreten Codes.":

Ja zu Echtzeit für Nachrichten, Präsenz und Einkaufslisten.
Nein zu generellem Live-Polling für alles.
Die übrigen Bereiche sind im Backend sauberer als Request/Response mit explizitem Refresh.

Unsere Einschätzung:
Das klingt plausibel und wär auch unsere Antwort gewesen, nötig ist es nicht unbedingt, da bei einer WG App wohl nicht den ganzen Tag hoher Betrieb ist und es unwarscheinlich ist, dass zwei Leute gleichzeitig Eintragungen machen, dennoch wäre es in manchen Punkten wie dem Chat schon toll falls man mal live kommuniziert.

## Aufgabe 2: Server-Sent Events

SSE wurde bewusst **nicht** implementiert. Da unsere Kommunikationsanforderung (Chat) klar bidirektional ist – Clients senden selbst Nachrichten, nicht nur der Server – haben wir uns direkt für WebSockets (socket.io) entschieden und SSE nur konzeptionell in Aufgabe 4 gegenübergestellt, statt es zusätzlich als Lernübung separat umzusetzen.

## Aufgabe 3: WebSockets mit socket.io

**Iteration 1 (Basis-Prompt):**
```
Integriere socket.io in mein Express-Backend. Wenn ein Client eine neue Chat-Nachricht
sendet, soll der Server sie an alle anderen verbundenen Clients weiterleiten.
```
*Ergebnis:* Funktionierte grundsätzlich, aber die Verbindung brach beim Wechsel zwischen WLAN/mobilem Netz gelegentlich ab und musste manuell per Reload wiederhergestellt werden.

**Iteration 2 (präzisiert):**
```
Konfiguriere den socket.io-Client so, dass er bei Verbindungsabbruch automatisch mit
Fallback auf Polling reconnected (transports: ['websocket', 'polling']). Der Server
soll eingehende 'chat eintrag'-Events per socket.broadcast.emit an alle anderen
Clients weiterleiten, mit withCredentials für die Cookie-basierte Auth.
```
*Präzisiert wurde:* automatisches Reconnect-Verhalten mit Polling-Fallback sowie das Mitschicken der Auth-Cookies (`withCredentials: true`) bei der Socket-Verbindung.

**Zwei-Tab-Test:** Bestanden – eine im ersten Tab gesendete Chat-Nachricht erscheint im zweiten geöffneten Tab sofort ohne Reload.

## Aufgabe 4: SSE vs. WebSockets – Direktvergleich

| Kriterium | SSE | WebSockets |
| :--- | :--- | :--- |
| Richtung | Server → Client | Bidirektional |
| Komplexität im Code | Gering | Mittel |
| Reconnect bei Verbindungsabbruch | Automatisch (Browser) | socket.io übernimmt automatisch (mit Polling-Fallback) |
| Geeignet für unser Projekt | ❌ | ✅ |
| Warum? | Chat braucht Senden **und** Empfangen – SSE kann nur einseitig vom Server aus pushen, der Client müsste für's Senden trotzdem einen separaten REST-Call machen. | Chat, Präsenz und Live-Updates der Einkaufsliste sind von Natur aus bidirektional – ein Client sendet ein Event, der Server broadcastet es an alle anderen. Das passt direkt zum socket.io-Modell. |

**Was passiert bei einem Server-Neustart?** Nicht explizit end-to-end getestet. Laut socket.io-Client-Konfiguration (`transports: ['websocket', 'polling']`, Standard-Reconnect aktiv) sollten verbundene Clients die Verbindung verlieren und automatisch neu verbinden, sobald der Server wieder erreichbar ist – das reine Reconnect-Verhalten wurde aber nicht gezielt durch einen Server-Neustart während einer offenen Verbindung verifiziert. Offener Punkt für einen weiteren Test.

# 08 Async Messaging

Passwort geändert	Ja	Transactional	E-Mail	Sicherheitsrelevant, braucht Persistenz
ToDos update Ja E-mail Mittelwichtig 
Jemand ist gerade Einkaufen Ja E-mail + Push-Nachricht Sehr wichtig
Einkaufsliste, Finanzen, Statusupdates Nein Nicht wichtig 

Gibt es Events, bei denen der Nutzer sofort reagieren muss – oder reicht eine Mail, die er später liest?
Nur wenn jemand im Moment Einkaufen ist und evtl. wenn jemand Nachhause kommt

Habt ihr Marketing-Content geplant, der ein explizites Opt-in braucht?
Nein

Wie viele verschiedene Events würden pro Stunde realistisch Notifications auslösen?
schwierig zu sagen, aber durchschnittlich wahrscheinlich 0-2

Itterationen der E-mail:

1. In der Email soll eine Überschrift geben die besagt was passiert, z.B. ... ist der WG beigetreten. Außerdem ein Satz der auffordert zu Handeln also in dem Fall etwas wie "Begrüß ihn direkt in der App!". Außerdem soll ein Link direkt zur Task enthalten sein

2. Passe mir die E-mail noch an also gestalte sie mehr in dem Website look mit cleaner ästhethik oben links bitte das Logo das auch für die WG verwendet wird, außerdem der name der wg und ein link direkt zu der action, also zum Beispiel direkt zur Einkaufsliste wenn jemand einkaufen ist.

**Mailversand über Queue statt synchron im Request-Handler:** Der Versand lief anfangs als reines fire-and-forget-`.catch()` direkt im Request-Handler. Nachträglich in eine eigene, einfache In-Process-Queue (`backend/lib/mailQueue.js`) ausgelagert: `notifications.js` reiht Mail-Jobs per `enqueueMail()` ein, ein Worker-Loop verarbeitet sie sequenziell im Hintergrund, ohne den HTTP-Request zu blockieren. Für unser Volumen (laut eigener Analyse realistisch 0–2 Events/Stunde) reicht eine In-Process-Queue aus – ein externer Broker wie Redis/BullMQ wäre für diese Größenordnung Overkill gewesen.

## Aufgabe 3: Web Push

Web Push wurde implementiert, da Aufgabe 1 "Jemand ist gerade einkaufen" als zeitkritisches Event mit Push-Bedarf identifiziert hat. VAPID-Keys liegen in `.env`. Der Service Worker (`backend/public/sw.js`) empfängt Push-Events, zeigt eine Notification mit Titel, Body und Deep Link (`notificationclick` öffnet/fokussiert die Ziel-URL). Subscriptions werden per `POST /api/push/subscribe` gespeichert. Abgelaufene Subscriptions (HTTP 410/404 vom Push-Service) werden serverseitig automatisch aus der Datenbank gelöscht (`backend/lib/webpush.js`).

**Zwei-Tab-Test:** Bestanden – Auslösen des Events (z.B. "einkaufen"-Status setzen) in Tab 1 zeigt die Push-Notification in Tab 2 sofort an.

## Aufgabe 4: Template-Checkliste

| Kriterium | Ergebnis |
| :--- | :--- |
| Alle nötigen Infos ohne Login sichtbar? | ✅ Wer/was/WG-Name direkt im Template |
| Direkter Deep Link zur betroffenen Ansicht (nicht nur Startseite)? | ✅ z.B. direkt zur Einkaufsliste bzw. zur Todo-Ansicht |
| Betreff/Titel klar und unter 50 Zeichen? | ✅ z.B. `Neue Aufgabe: "Küche putzen"` |
| Notification-Body unter 120 Zeichen? | ✅ kurze, klare Sätze pro Event |

# Microservices vs Monolith

Bestandsaufnahme:

Ehrliche Bestandsaufnahme: **keine saubere Modul-Trennung**. `server.js` (720 Zeilen) enthält die meisten Ressourcen direkt, nur ein Teil ist in `routes/` ausgelagert – und fast überall wird bereichsübergreifend gelesen/geschrieben.

| Datei | Verantwortlich für | Greift auf fremde Daten zu? |

| `routes/auth.js` | Login, Register, Logout, `/me`, Profil & Passwort | Nein – nur `User` |

| `routes/tasks.js` | Todos lesen/anlegen/erledigen | Ja – `Membership`-Check, `User` für Assignee, `Message` beim Erledigen |

| `routes/messages.js` | Chat lesen/senden | Ja – `Membership`-Check als Autorisierung |

| `routes/push.js` | Push-Subscriptions | Nein – nur `PushSubscription` |

| `server.js` | Alles Übrige: Users, WGs, Shopping, Kalender, Finanzen, Invitations, Auth-Middleware | Ja, durchgehend – `Membership`-Check in fast jeder Route; Mitglieder-Löschung räumt per Cascade sechs fremde Tabellen ab |

Agent Antwort:

Geschäftslogik, die in eigene Funktionen gehört
server.js ist das Hauptproblem – fast alles liegt inline in einer 720-Zeilen-Datei statt in Router-Dateien wie bei tasks.js/messages.js:

1. PUT /api/users/status (server.js:108-157) – vermischt Membership-Update, Shopping-Benachrichtigung, User-Lookup für den Namen und Push-Benachrichtigung an alle anderen Mitglieder in einem Handler. Sollte in notifyShoppingStatusChange()-artige Funktion in lib/notifications.js ausgelagert werden.

2. DELETE /api/wgs/:id/members/:userId (server.js:296-337) – enthält die komplette "letztes Mitglied entfernt WG" Löschkaskade (7 Tabellen in einer Transaktion). Das ist reine Geschäftslogik ("WG-Löschregel") und gehört in eine Funktion wie deleteWgCascade(wgId), nicht in den Route-Handler.
3. POST /api/finances (server.js:537-586) – enthält Namens-Matching-Logik (paidBy String → User-ID via Membership-Liste), identisch zur Logik in routes/tasks.js:63-72 (Assignee-Matching per Name). Klassischer Kandidat für eine gemeinsame Helper-Funktion resolveMemberByName(wgId, name).
4. POST /api/invitations/join (server.js:665-716) – Invite-Validierung (maxUses, bereits Mitglied), Membership-Erstellung, Counter-Update und Notification-Trigger alles inline. Gehört in einen InvitationService.
5. GET /api/users (server.js:48-106) – zwei komplett unterschiedliche Code-Pfade (Single-WG vs. "alle für mich sichtbaren User über alle WGs") in einem Handler, inkl. Aggregation über eine Map. Sollte in zwei separate Service-Funktionen aufgeteilt werden.

Cross-Domain DB-Zugriffe (Datei greift auf fachfremde Tabellen zu)
Das ist der auffälligere Befund:

1. routes/tasks.js (Domäne: Todos) schreibt in prisma.message.create() (server.js-Domäne "Messages") bei Task-Abschluss (tasks.js:121-130) – Aktivitäts-Feed-Logik sitzt in der falschen Datei.
2. Shopping-Handler in server.js (Domäne: Shopping, server.js:339-399, 401-434) schreiben ebenfalls in prisma.message (Zeile 385-392, 419-426) – gleiches Muster, Shopping "weiß" zu viel über Messages.
3. Finance-Handler (server.js:562-579) schreibt ebenfalls in prisma.message beim Anlegen einer Ausgabe.
4. DELETE /api/wgs/:id/members/:userId (server.js:296-337) greift direkt auf sechs fremde Domänen-Tabellen zu (shoppingItem, todo, calendarEvent, financeItem, invitation, message) – das WG-Modul kennt damit das komplette Schema aller anderen Module.

Muster: Jede Domäne, die einen "System-Log-Eintrag" erzeugen will (Shopping, Finance, Tasks), schreibt direkt in die message-Tabelle statt über eine gemeinsame Funktion wie logActivity(wgId, content) in routes/messages.js oder einem eigenen lib/activityLog.js. Das ist die konkreteste, wiederkehrende Verletzung der Modultrennung im Code.

Empfehlung: Eine lib/activityLog.js mit logActivity(wgId, content) einführen, die intern prisma.message.create kapselt, und in Shopping-, Finance- und Task-Handlern aufrufen statt direkt Prisma zu nutzen.


Bounded Contexts:

**Users & Auth**
- Registrierung, Login/Logout, JWT-Session
- Profil- & Passwortverwaltung
- Owned Data: `User`

**WG-Verwaltung**
- WG anlegen/bearbeiten, Mitgliederliste, Mitglied entfernen (inkl. Lösch-Kaskade)
- Einladungen (Invitations, Join-Flow)
- Owned Data: `WG`, `Membership`, `Invitation`

**Tasks (Todos)**
- Aufgaben anlegen, zuweisen, erledigen
- Owned Data: `Todo`

**Shopping**
- Einkaufsliste, Kategorien, "ist einkaufen"-Status
- Owned Data: `ShoppingItem`

**Finance**
- Ausgaben erfassen, Settle-Up
- Owned Data: `FinanceItem`

**Calendar**
- Termine/Events der WG
- Owned Data: `CalendarEvent`

**Messages / Chat**
- Chatnachrichten + System-Feed (Activity Log)
- Owned Data: `Message`

**Notifications**
- E-Mail- & Push-Versand
- Owned Data: `PushSubscription`

**Stats** *(noch nicht implementiert)*
- Aggregierte Auswertungen (z.B. wer hat wie viel bezahlt, wer erledigt wie viele Todos)
- Owned Data: keine eigenen – liest nur aus Tasks, Shopping, Finance

Kommunikation: Fast jeder Kontext fragt bei **WG-Verwaltung** die `Membership` ab, um Zugriff auf eine `wgId` zu autorisieren, und **Tasks/Shopping/Finance** schreiben zusätzlich in **Messages** für den Activity-Feed. Ein zukünftiger **Stats**-Kontext würde nur lesend Daten aus Tasks, Shopping und Finance aggregieren, ohne eigenen Zustand zu besitzen.

Aufgabe 3: Service Layer einführen

Iteration 1:

Refactore den POST /api/todos-Handler. Die Validierung und die Prisma-Abfrage
sollen in eine neue Datei tasks.service.js als Funktion createTodo(data, userId)
ausgelagert werden. Der Route-Handler bleibt schlank.

Ergebnis: Die Logik landete in `tasks.service.js`, aber Fehler wurden uneinheitlich geworfen (mal `res.status(400)` direkt im Service, mal ein generisches `throw new Error(...)`) – der Route-Handler musste den Fehlertyp an unterschiedlichen Stellen unterschiedlich auswerten.

Iteration 2:
Vereinheitliche die Fehlerbehandlung: Erstelle in lib/errors.js zentrale Error-Klassen
(ValidationError, AccessDeniedError, NotFoundError, ConflictError, GoneError). Services
werfen ausschließlich diese Klassen, niemals res.status() direkt. Der Route-Handler
fängt den Fehler zentral per try/catch und mappt err.name auf den passenden HTTP-Status.

Aufgabe 4: Modulare Ordnerstruktur

Umgesetzt (Commit `8de05fa7 refactor: restructure backend into modular bounded contexts`). Jeder Bounded Context liegt jetzt unter `backend/modules/<kontext>/` mit `<kontext>.routes.js` + `<kontext>.service.js`:

```
backend/modules/
├── auth/        (auth.routes.js, auth.service.js, users.routes.js)
├── wgs/         (wgs.routes.js, wgs.service.js, invitations.routes.js, status.routes.js)
├── tasks/       (tasks.routes.js, tasks.service.js)
├── shopping/    (shopping.routes.js, shopping.service.js)
├── finances/    (finances.routes.js, finances.service.js)
├── calendar/    (calendar.routes.js, calendar.service.js)
├── messages/    (messages.routes.js, messages.service.js)
└── push/        (push.routes.js, push.service.js)
```

`server.js` bindet die Module nur noch über `app.use('/api/...', router)` ein und enthält selbst keine Geschäftslogik mehr. Verifiziert: Keine `.routes.js`-Datei greift noch direkt auf `prisma.*` zu – alle DB-Zugriffe laufen über die zugehörige `.service.js`.

Aufgabe 5: Modulschnittstellen

Die "Activity Log"-Verletzung aus der Bestandsaufnahme (Shopping/Finance/Tasks schrieben direkt in `prisma.message`) wurde behoben: `backend/lib/activityLog.js` kapselt `logActivity(wgId, content)`, das intern `prisma.message.create` aufruft. Tasks-, Shopping- und Finance-Service rufen jetzt `logActivity()` auf statt direkt in eine fremde Tabelle zu schreiben.

Beim WG-Löschen ruft `wgs.service.js` die anderen Module ebenfalls nur über exportierte Funktionen auf, nie über direkten Prisma-Zugriff auf fremde Tabellen:

```
wgs.service.js
  ruft auf:  shopping.service.deleteAllForWgOperation(wgId)
             tasks.service.deleteAllForWgOperation(wgId)
             calendar.service.deleteAllForWgOperation(wgId)
             finances.service.deleteAllForWgOperation(wgId)
             messages.service.deleteAllForWgOperation(wgId)
             auth.service.getUserById(userId)
```

Öffentliche vs. interne Schnittstellen (Auszug):

```
tasks.service.js
  öffentlich:  listTodos(), createTodo(), updateTodo(), deleteAllForWgOperation()

shopping.service.js
  öffentlich:  listShoppingItems(), createShoppingItem(), updateShoppingItem(), deleteAllForWgOperation()

wgs.service.js
  öffentlich:  u.a. createWg(), joinWg(), removeMember(), ruft deleteAllForWgOperation() der anderen Module auf
  intern:      keine eigene Kapselung fremder Tabellen – nutzt ausschließlich exportierte Funktionen anderer Module

lib/activityLog.js
  öffentlich:  logActivity(wgId, content)
```

Aufgabe 6: Architektur-Review – Frage 4 (Extraktionskandidat)

`push`-Modul wäre am einfachsten als eigener Service extrahierbar: Es hat nur eine eigene Tabelle (`PushSubscription`), keine ausgehenden Abhängigkeiten zu anderen Modulen und wird nur von außen (`lib/webpush.js`) genutzt, nie umgekehrt. Am meisten eingehende Abhängigkeiten hat das `wgs`-Modul (wird von Tasks, Shopping, Finance, Calendar, Messages beim WG-Löschen referenziert bzw. referenziert diese selbst) – erwartbares Warnsignal, aber kein Fehler: `wgs` ist bewusst die zentrale Aggregations-/Cascade-Instanz der Domäne, ähnlich einem Aggregate Root im DDD-Sinn.

**Bestehende Tests nach dem Umbau:** `npx vitest run` (statt Cypress, das auf unserer Entwicklungsumgebung Gatekeeper-Probleme hatte) – alle 21 Tests weiterhin grün nach dem Backend-Refactoring.

Bonus: Frontend nach Feature-Modulen strukturiert

Das Frontend war bisher flach nach Typ organisiert (`components/`, `utils/`). Umgebaut nach Feature-Ordnern:

```
frontend/src/
├── features/
│   ├── auth/        (Login.tsx, Register.tsx)
│   ├── dashboard/    (DashboardClient.tsx)
│   ├── shopping/     (ShoppingClient.tsx)
│   ├── tasks/        (TodoClient.tsx)
│   ├── finances/     (FinanceClient.tsx)
│   └── wg/           (WgSettingsModal.tsx, ProfileModal.tsx)
└── shared/
    ├── components/   (MainLayout.tsx, TabsNav.tsx – generische/übergreifende UI)
    └── lib/          (authFetch.ts, logic.ts, leaderboard.ts, socket.ts, push.ts)
```

Da keine Komponente eine andere Komponente direkt importierte (nur `MainLayout` als zentrale Shell bindet alle Feature-Komponenten ein, jede Komponente selbst hängt nur von `shared/lib/` ab), ließ sich die Umstrukturierung risikoarm durchführen. Verifiziert nach dem Umzug: `npx vitest run` (21/21 grün), `npx tsc --noEmit` (keine Fehler), `npx vite build` (Production-Build erfolgreich).

# 09 - Testing

Test-Pyramide

```
                ▲
               / \
              / E2E \          3 Cypress-Tests (frontend/cypress/e2e)
             /-------\         auth.spec.js, shopping.spec.js, todos.spec.js
            /         \        → kritische Pfade über die echte UI + API
           /-----------\
          /             \
         /  Integration  \     (nicht vorhanden – siehe Hinweis unten)
        /-----------------\
       /                   \
      /       Unit          \  21 Vitest-Tests (frontend/src/utils/*.test.ts)
     /-----------------------\ → reine Funktionen: Normalfall, Grenzfall, Fehlerfall
```

- **Unit-Tests (Vitest)**: `frontend/src/utils/logic.test.ts` und `frontend/src/utils/leaderboard.test.ts` testen reine Utility-Funktionen (Passwort-Validierung, Finance-Summary, Shopping-Item-Input, Account-Initialen, Todo-Anzeigezustand, Timestamp-Formatierung, Leaderboard-Berechnung) isoliert ohne Server/DB. Jede Funktion wird mit einem Normalfall, einem Grenzfall (leere/fehlende Werte) und einem Fehlerfall (ungültiger Input) abgedeckt. Ausführen mit `npm test` im `frontend/`-Ordner.
- **Integrationstests**: aktuell nicht vorhanden. Die Bounded Contexts (`modules/*.service.js`) wären der richtige Ort dafür (Service + Prisma gegen eine Test-DB, ohne HTTP-Layer) – bisher aber nicht umgesetzt.
- **E2E-Tests (Cypress)**: `frontend/cypress/e2e/` deckt den kritischen Pfad **Registrierung → Login → WG erstellen → Kernfunktion (Einkauf/Aufgaben)** ab:
  - `auth.spec.js` – Registrierung via API, Login via UI, Landung auf dem Onboarding-Screen für WG-lose Nutzer
  - `shopping.spec.js` – WG erstellen, Einkaufsartikel hinzufügen, Anzeige in der Kategorie prüfen
  - `todos.spec.js` – WG erstellen, Aufgabe anlegen und erledigen, Rangliste im Dashboard prüfen

  Alle Selektoren in den E2E-Tests nutzen ausschließlich `data-cy`-Attribute (z.B. `[data-cy=login-email-input]`, `[data-cy=quick-action-shopping]`), um Tests von CSS-Klassen und Texten zu entkoppeln. Ausführen mit `npm run e2e` (interaktiv) oder `npm run e2e:run` (headless) im `frontend/`-Ordner, bei laufendem Dev-Server (`npm run dev`) und Backend (`npm start`, Port 3000).

Modul-Schnittstellen (Backend)

Regel: Ein Modul greift nie direkt per Prisma auf die Tabelle eines anderen Kontexts zu, sondern ruft die exportierte Funktion des zuständigen `*.service.js` auf (z.B. `wgsService.getMembership(...)` statt `prisma.membership.findUnique(...)` in `auth.service.js`). Cross-Context-Löschungen (z.B. beim Entfernen des letzten WG-Mitglieds) laufen über `deleteAllForWgOperation(wgId)`, die jedes betroffene Modul selbst anbietet, damit `wgs.service.js` sie nur noch in eine gemeinsame `prisma.$transaction([...])` einreiht, ohne die fremde Tabelle selbst zu kennen.

| Modul | öffentlich | intern |
|---|---|---|
| `auth.service.js` | `register()`, `login()`, `getCurrentUser()`, `updateProfile()`, `changePassword()`, `getUserById()`, `getAccessibleUsers()` | – |
| `wgs.service.js` | `listWgs()`, `getWg()`, `createWg()`, `updateWg()`, `listMembers()`, `updateMemberStatus()`, `removeWgMember()`, `getInvitationByToken()`, `createInvitation()`, `joinViaInvitation()`, `getMembership()`, `getMembershipsForWg()`, `getMembershipsForUser()` | – |
| `tasks.service.js` | `listTodos()`, `createTodo()`, `updateTodo()`, `deleteAllForWgOperation()` | – |
| `shopping.service.js` | `listShoppingItems()`, `createShoppingItem()`, `updateShoppingItem()`, `deleteShoppingItem()`, `deleteAllForWgOperation()` | – |
| `finances.service.js` | `listExpenses()`, `createExpense()`, `settleExpenses()`, `deleteAllForWgOperation()` | – |
| `calendar.service.js` | `listEvents()`, `createEvent()`, `deleteAllForWgOperation()` | – |
| `messages.service.js` | `listMessages()`, `createMessage()`, `deleteAllForWgOperation()` | – |
| `push.service.js` | `upsertSubscription()` | – |

Aktuell hat kein Modul eine rein interne (nicht exportierte) Hilfsfunktion – gemeinsame, modulübergreifende Logik wie die Mitgliedschaftsprüfung `isWgMember()` liegt bewusst in `lib/membership.js` (Cross-Cutting-Concern, kein Modul-Interna), nicht in einem der Kontext-Services.

Gefundener Verstoß & Behebung

Beim Review wurde eine Regelverletzung gefunden: **`auth.service.js`** griff in `getAccessibleUsers()` direkt per `prisma.membership.findUnique/findMany` auf die `Membership`-Tabelle zu, die zum WG-Modul gehört. Ebenso griffen **`tasks.service.js`** (`createTodo`) und **`wgs.service.js`** (`updateMemberStatus`, `joinViaInvitation`) direkt per `prisma.user.findUnique` auf die `User`-Tabelle zu, die zum Auth-Modul gehört, und **`wgs.service.js`** löschte beim Entfernen des letzten Mitglieds direkt in `prisma.shoppingItem`, `prisma.todo`, `prisma.calendarEvent`, `prisma.financeItem`, `prisma.message` – alles fremde Tabellen.

Behoben durch:
- `wgs.service.js` exportiert jetzt `getMembership()`, `getMembershipsForWg()`, `getMembershipsForUser()`; `auth.service.js` ruft diese statt direktem Prisma-Zugriff auf.
- `auth.service.js` exportiert bereits `getUserById()`; `tasks.service.js` und `wgs.service.js` nutzen diese Funktion statt eigener `prisma.user`-Abfragen.
- `tasks.service.js`, `shopping.service.js`, `calendar.service.js`, `finances.service.js`, `messages.service.js` exportieren je ein `deleteAllForWgOperation(wgId)`, das die (nicht ausgeführte) Prisma-Operation zurückgibt; `wgs.service.js` reiht diese nur noch in seine eigene `$transaction([...])` ein, statt selbst auf die fremden Tabellen zuzugreifen.

# 11 Deployment

| Bestandteil | Läuft als | Hostname / Pfad | Wird ausgeliefert von |
| :--- | :--- | :--- | :--- |
| Frontend (React) | statisches Build (`dist/` → `backend/public/`) | `wehgehts.de` | Express (`express.static`) |
| Backend (Express) | Node.js-App | `wehgehts.de/api` | konsoleH Node.js |
| Datenbank (SQL) | MySQL/MariaDB | `lvrs.your-database.de` (externer DB-Host) | Datenbank-Hoster-Verwaltung |

1. Warum müssen API-Routen vor dem SPA-Fallback stehen?
Damit nicht jede Request abgefangen wird bevor sie überhaupt irgendwo ankommt.

2. Warum darf index.html nicht gecacht werden, Assets aber schon?
Durch hashing ändert sich der Name der Assets bei einer Änderung. Cachet man die index.html datei dann würde diese noch auf alte Assets hinweisen und somit kaputt gehen

3. Was passiert ohne SPA-Fallback?
Getestet: Fallback-Middleware kurz auskommentiert, Server neu gestartet, direkt `http://localhost:3000/login` per curl/Browser aufgerufen. Ergebnis: `404 Cannot GET /login`. Express findet keine passende Route (weder API noch statische Datei `login`) und wirft den Standard-Express-404, statt `index.html` auszuliefern. Die React-Router-Logik läuft aber nur *innerhalb* der bereits geladenen React-App im Browser – ruft man eine Client-Route direkt per URL/Reload auf, bekommt der Browser diese Anfrage nie an React weitergereicht, sondern sieht nur die rohe Server-Antwort. Ohne Fallback wäre jede tief verlinkte Route (Reload auf `/dashboard`, geteilter Link zu `/login`) kaputt – nur der Einstieg über `/` würde funktionieren.

Production Build & relative Pfade

Frontend und Backend werden als ein deploybares Verzeichnis gebaut:

```bash
cd frontend && npm run build   # erzeugt frontend/dist/
cp -r frontend/dist/* backend/public/
```

Das Frontend spricht die API **relativ** an (`/api/...`, nicht `http://localhost:3000/api/...`), da beide vom selben Origin ausgeliefert werden. Im Dev-Betrieb (`npm run dev`, Vite auf Port 5173) übernimmt der Vite-Dev-Proxy in `frontend/vite.config.ts` das Weiterleiten von `/api` an `http://localhost:3000`, damit der gleiche relative Code in Dev und Prod funktioniert:

```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
  },
},
```

Middleware-Reihenfolge (`backend/server.js`)

1. `cors`, `express.json`, `cookieParser`
2. API-Routen (`/api/auth`, `/api/todos`, `/api/wgs`, …), jeweils mit `authenticate`-Middleware wo nötig
3. Fallback für unbekannte `/api/*`-Pfade → JSON `404` (damit die API nie versehentlich `index.html` zurückgibt)
4. `express.static(FRONTEND_DIST, …)` mit langem Cache (`max-age=31536000, immutable`) für gehashte Vite-Assets unter `/assets/`
5. SPA-Fallback (letzte Middleware ohne Pfad, da Express 5 bei `app.get('*', ...)` wegen geänderter `path-to-regexp`-Syntax einen Fehler wirft) → liefert immer `index.html` mit `Cache-Control: no-cache`

Datenbank

Migration von SQLite auf **MySQL/MariaDB** ist erfolgt (`backend/prisma/schema.prisma`, `provider = "mysql"`), DB läuft extern beim Hoster (`lvrs.your-database.de`). Lokal/Dev: `prisma migrate dev`, im Deployment: `prisma migrate deploy` (wendet nur bereits erstellte Migrationen an, erzeugt keine neuen — sicherer für Produktion).

Cookies & CORS im Same-Origin-Setup

Da Frontend und Backend vom selben Origin (`wehgehts.de`) ausgeliefert werden, wäre CORS eigentlich nicht mehr nötig — `cors({ origin: ALLOWED_ORIGINS, credentials: true })` ist trotzdem als Absicherung für den lokalen Dev-Betrieb (Vite auf Port 5173/5174) im Code geblieben. Auth-Cookie (`backend/modules/auth/auth.routes.js`) wird gesetzt mit:

- `httpOnly: true` — nicht per JavaScript auslesbar (XSS-Schutz)
- `secure: process.env.NODE_ENV === 'production'` — nur über HTTPS im Prod-Betrieb
- `sameSite: 'lax'` — CSRF-Schutz, da Same-Origin ohnehin ausreicht
- `app.set('trust proxy', 1)` — nötig hinter dem Hetzner-Reverse-Proxy, damit Express `req.secure`/`req.ip` korrekt erkennt und `secure`-Cookies funktionieren

`backend/.env.example` dokumentiert alle benötigten Variablen (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `RESEND_API_KEY`, VAPID-Keys); `PORT` wird vom Hosting (konsoleH Node.js App) automatisch gesetzt.

Deployment-Status

- ✅ Same-Origin-Architektur (ein Node.js-Prozess liefert API + Build) implementiert und live auf `https://wehgehts.de`
- ✅ SSL-Zertifikat (Let's Encrypt) aktiv, HTTP→HTTPS-Redirect (`301`) verifiziert
- ✅ Backend per SSH auf konsoleH-Node.js-App deployed (`npm install`, `npx prisma generate`, `npx prisma migrate deploy`)
- ✅ Node.js-Konfiguration in konsoleH aktiv: Arbeitsverzeichnis `public_html`, Skriptpfad `server.js`

**Stolperstein bei der Node.js-Aktivierung:** Das Arbeitsverzeichnis-Feld in konsoleH erwartet nicht den absoluten Pfad (`/usr/www/users/<login>`) und nicht den Domainnamen, sondern exakt `public_html` — der von Hetzner vorgegebene Alias für den Domain-Webroot. Mit einem falschen Arbeitsverzeichnis meldete konsoleH beim ersten Klick auf „Aktivieren" einen Fehler, beim zweiten Klick fälschlich „erfolgreich aktiviert", der Status fiel nach jedem Seiten-Reload aber wieder auf „inaktiv" zurück und das komplette Formular (inkl. Umgebungsvariablen) wurde geleert. Per SSH-Test (`node server.js` mit gesetzten Env-Vars) ließ sich vorab ausschließen, dass die App selbst crasht — das grenzte das Problem auf die konsoleH-Konfiguration ein.

Docker Quickstart (One-Command-Start)

Für die Prüfungsleistung zusätzlich zum Hetzner-Deployment: ein vollständig lauffähiger Start mit einem einzigen Befehl, ohne manuelle Zwischenschritte.

```bash
cp .env.example .env
# .env öffnen und die Platzhalter (MYSQL_*, JWT_SECRET, ...) ausfüllen

docker compose up --build
# alternativ: npm run docker:up
```

Das startet zwei Container:

- **`mysql`** — MySQL 8.4 mit persistentem Volume (`mysql-data`), Healthcheck via `mysqladmin ping`.
- **`app`** — Multi-Stage-Build (`Dockerfile`): Stage 1 baut das Frontend (`npm run build`), Stage 2 installiert die Backend-Produktionsabhängigkeiten, generiert den Prisma-Client und kopiert den Frontend-Build nach `backend/public/`. Das Ergebnis ist bewusst identisch zum Same-Origin-Deployment auf Hetzner (ein Node-Prozess liefert API + SPA).

Der Container startet erst, wenn `mysql` laut Healthcheck bereit ist (`depends_on: condition: service_healthy`). `docker/entrypoint.sh` versucht zusätzlich `prisma migrate deploy` mit bis zu 10 Wiederholungen (3s Abstand), da MySQL bei einem frischen Volume TCP-Verbindungen teils schon annimmt, bevor die Datenbank selbst vollständig initialisiert ist. Danach startet `node server.js`.

Die App ist anschließend unter `http://localhost:3000` erreichbar (Port über `APP_PORT` in `.env` änderbar). `DATABASE_URL` wird nicht manuell eingetragen, sondern in `docker-compose.yml` automatisch aus den `MYSQL_*`-Variablen zusammengesetzt — eine Fehlerquelle weniger.

Zum Stoppen: `docker compose down` (bzw. `npm run docker:down`); die Daten im `mysql-data`-Volume bleiben dabei erhalten.

**Hinweis:** Diese Docker-Konfiguration wurde sorgfältig gegen die bereits produktiv laufende Hetzner-Pipeline (`.github/workflows/deploy.yml`) abgeglichen (gleiche Umgebungsvariablen, gleicher Same-Origin-Aufbau, gleiche Prisma-Migrationsschritte), konnte aber auf diesem Entwicklungsrechner mangels lokaler Docker-Installation nicht selbst end-to-end ausgeführt werden.

# 12 - Polish

Aufgabe 1: Sicherheits-Scan & Header-Quick-Wins

Der externe Scan durch den Dozenten stand zum Zeitpunkt dieser Session noch aus. Um trotzdem sofort verwertbare Ergebnisse zu haben, wurde die deployte Konfiguration selbst gegen die gängigen HTTP-Security-Header geprüft (`curl -I` gegen `server.js`, vor und nach dem Fix).

**3 wichtigste Findings (vor dem Fix):**

1. **Keine Security-Header gesetzt.** `server.js` setzte außer `cors()` keinerlei HTTP-Security-Header. Es fehlten insbesondere `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options` und `Strict-Transport-Security` — Standard-Findings, die jeder automatisierte Scanner (Mozilla Observatory, securityheaders.com, OWASP ZAP) sofort als "Missing Header" auflisten würde.
2. **Kein Clickjacking-Schutz.** Ohne `X-Frame-Options`/`frame-ancestors` hätte die App in ein fremdes `<iframe>` eingebettet werden können — relevant, da die App Login-Formulare und sensible WG-Daten (Finanzen, Chat) zeigt.
3. **Kein erzwungenes HTTPS auf Protokoll-Ebene.** Die App läuft zwar produktiv nur über HTTPS (Hetzner-Redirect), der Node-Prozess selbst sendete aber keinen `Strict-Transport-Security`-Header, sodass ein Downgrade-Angriff auf einer Netzwerkebene ohne HSTS theoretisch möglich gewesen wäre.

**Fix:** `helmet` (`npm install helmet` in `backend/`) vor allen Routen registriert (`backend/server.js`), mit einer projektspezifischen CSP (`connect-src 'self' ws: wss:` für den Socket.io-Client, `img-src 'self' data:` für Base64-Icons, `style-src 'unsafe-inline'` für Tailwind-Utility-Klassen zur Laufzeit). Verifiziert per `curl -I http://localhost:3000/`:

```
Content-Security-Policy: default-src 'self'; ...; frame-ancestors 'none'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Cross-Origin-Resource-Policy: same-origin
```

App danach manuell erneut durchgeklickt (Login, Dashboard, Shopping, Chat) — keine Regressionen durch die CSP (keine geblockten Requests in der Browser-Konsole).

*Sobald der Dozenten-Scan vorliegt, werden dessen konkrete Findings hier ergänzt.*

Aufgabe 2: Performance-Messung (Lighthouse)

Lighthouse-Performance-Audit gegen den lokal produktiv gebauten Build (`npm run build` → `backend/public/`) via `npx lighthouse --only-categories=performance --chrome-flags="--headless=new"`.

| | Vorher (`/login`, alter Build) | Nachher (`/welcome`, neuer Build mit Landing Page) |
| :--- | :--- | :--- |
| Performance-Score | 0.80 | 0.79 |
| First Contentful Paint | 3.8 s | 3.8 s |
| Largest Contentful Paint | 3.9 s | 3.9 s |
| Total Blocking Time | 20 ms | 40 ms |
| Cumulative Layout Shift | 0 | 0 |

**Ehrliche Einordnung:** Es gibt in unserem Projekt (noch) kein großes Hero-Image oder sonstiges datenintensives Asset — die Landing Page wurde bewusst rein aus CSS/Tailwind-Gradients, SVG-Icons (Material Symbols als Icon-Font) und einer gestylten Vorschau-Karte aus bestehenden UI-Primitiven gebaut, kein Stockfoto. Der in der Aufgabenstellung vorgesehene Optimierungsschritt (Skalieren, WebP-Konvertierung, Kompression via Squoosh, `loading="lazy"` + explizite `width`/`height`) entfällt damit inhaltlich, da kein Rasterbild eingebunden wurde, das diesen Schritt bräuchte. Der leichte Anstieg der Total Blocking Time (+20 ms) kommt vom zusätzlichen Rendering der neuen Landing-Page-Komponente (Framer-Motion-Animationen), liegt aber weiterhin im unauffälligen Bereich. Die im Baseline-Score bereits mittelmäßigen Werte (FCP/LCP ~3.8s) stammen primär vom lokalen `headless`-Chrome-Overhead, nicht vom eigentlichen Bundle (145 KB gzip JS gesamt).

Aufgabe 3: Landing Page

Neue Route `/welcome` (`frontend/src/features/landing/LandingPage.tsx`) als Startseite für nicht eingeloggte Nutzer, statt direktem Redirect zu `/login`:

- **Above the fold:** Nutzen-Headline ("Eure WG, endlich organisiert – ohne Zettel-Chaos an der Kühlschranktür") statt generischem Marketing-Text, kurzer Subtext, zwei klare CTAs ("Kostenlos starten" → `/register`, "Ich habe schon ein Konto" → `/login`).
- **Features & Nutzen:** Vier Karten (Aufgaben, Einkaufsliste, Finanzen, Chat), die konkret beschreiben was das Feature für den Alltag bringt statt nur den Feature-Namen zu nennen.
- **Reibungsfreier Übergang:** CTA-Buttons sind direkte `react-router`-Links zu `/register`/`/login`, kein Zwischenschritt.

**Routing-Anpassung:** `App.tsx` leitete nicht eingeloggte Nutzer bisher hart auf `/login` um. Jetzt: `/welcome`, `/login`, `/register` sind die drei "öffentlichen" Routen; alles andere leitet nicht authentifizierte Nutzer zu `/welcome` statt `/login`. Der global in `authFetch.ts` verdrahtete 401-Redirect (bei abgelaufenem Token) musste ebenfalls von `/login` auf diese Drei-Routen-Logik angepasst werden, sonst wäre man beim Aufruf von `/welcome` sofort wieder zu `/login` zurückgeworfen worden (per Playwright-Screenshot-Test gefunden und gefixt).

Aufgabe 4: Automatisches Deployment (CI/CD)

GitHub Actions Workflow (`.github/workflows/deploy.yml`) baut bei jedem Push auf `main` das Frontend, kopiert den Build nach `backend/public/` und deployed per `rsync` + SSH auf konsoleH (Zielverzeichnis `~/public_html`, passend zum Arbeitsverzeichnis aus Session 11). Secrets (`HETZNER_SSH_USER`, `HETZNER_SSH_HOST`, `HETZNER_SSH_PASSWORD`) liegen in den GitHub-Repository-Secrets, nicht im Code.

**Verifiziert:** Erster Actions-Run lief grün durch (einzige Meldung: Info-Annotation zu einer veralteten Node-20-Runtime in `actions/checkout@v4`/`setup-node@v4`, kein Fehler). Nach einem manuellen Neustart der Node.js-App in konsoleH (der `touch server.js`-Trigger im Workflow reicht allein nicht, um den laufenden Prozess neu zu laden) wurden die neuen Security-Header und die `/welcome`-Route live auf `https://wehgehts.de` bestätigt:

```
$ curl -sI https://wehgehts.de/
content-security-policy: default-src 'self'; ...
strict-transport-security: max-age=31536000; includeSubDomains
x-frame-options: SAMEORIGIN
```

`https://wehgehts.de/welcome` antwortet mit `200`. Automatisches Deployment inkl. DB-Migrationen (`prisma migrate deploy`) und Prisma-Client-Generierung ist damit produktiv im Einsatz.



**Teils wurde KI verwendet um bei den Antworten für die Dokumentation der Sessions zu helfen**
