# 03 - API-Design

## Aufgabe 1: Ressourcen & Hierarchie
**Ressourcen:** `WG`, `User`, `ToDo` (Tasks), `Einkaufsliste` (Stock), `Finanzen`, `Moods`.

**Struktur:** Wir haben uns gegen eine starre URL-Hierarchie (z.B. `/wgs/1/todos`) und für eine **flache Struktur mit Query-Parametern** (z.B. `/api/todos?wgId=1`) entschieden. 
**Grund:** Dies ermöglicht es Nutzern, WG-übergreifend zu agieren (z.B. "Zeige mir alle meine Aufgaben aus allen WGs") und vereinfacht die API-Entwicklung massiv.

---


## Aufgabe 2: CRUD-API Beschreibung & Generierung

### Interpretation für unser Projekt (myWG)
Die wichtigste Ressource für die Interaktion in der WG ist das **ToDo-Element**. In unserem Projekt muss ein ToDo jedoch immer einer `wgId` zugeordnet sein, damit die Daten sauber getrennt bleiben.

### Iteration 1: Der Basis-Entwurf (Erster Prompt)
*Hier haben wir die grundlegenden Endpoints definiert, ohne tiefe Fehlerbehandlung:*

- `GET /api/todos?wgId=X` – Gibt alle ToDos einer WG zurück.
- `GET /api/todos/:id` – Gibt ein spezifisches ToDo zurück.
- `POST /api/todos` – Erstellt ein ToDo (erwartet `title` und `wgId`).
- `PUT /api/todos/:id` – Aktualisiert/Ersetzt ein ToDo.
- `DELETE /api/todos/:id` – Löscht ein ToDo.

### Iteration 2: Präzisierung (Zweiter Prompt)
*Was haben wir im zweiten Schritt präzisiert?*
1. **Fehlerbehandlung**: Wir haben explizit **400 Bad Request** gefordert, falls die `wgId` oder der `title` im Body fehlen.
2. **Status-Codes**: Wir haben festgelegt, dass `DELETE` mit **204 No Content** antworten muss und `POST` mit **201 Created**.
3. **NotFound**: Ein **404 Not Found** wird zurückgegeben, wenn eine ID beim `GET`, `PUT` oder `DELETE` nicht existiert.
4. **Relationales Mapping**: Wir haben ergänzt, dass `assigneeId` (User-Referenz) optional übergeben werden kann, um den Multi-User-Aspekt zu stützen.

### Lösungsvorschlag (Implementierung in Express.js)

```javascript
// In server.js (Ausschnitt)
const data = { todos: [] };

// GET - Alle Todos einer WG
app.get('/api/todos', (req, res) => {
  const { wgId } = req.query;
  if (!wgId) return res.status(400).json({ error: "wgId query parameter required" });
  const filtered = data.todos.filter(t => t.wgId === parseInt(wgId));
  res.json(filtered);
});

// GET - Einzelnes Todo
app.get('/api/todos/:id', (req, res) => {
  const item = data.todos.find(t => t.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: "Todo not found" });
  res.json(item);
});

// POST - Neu anlegen
app.post('/api/todos', (req, res) => {
  const { title, wgId } = req.body;
  if (!title || !wgId) return res.status(400).json({ error: "Title and wgId are required" });
  const newTodo = { id: Date.now(), title, wgId: parseInt(wgId), completed: false };
  data.todos.push(newTodo);
  res.status(201).json(newTodo);
});

// PUT - Ersetzen
app.put('/api/todos/:id', (req, res) => {
  const index = data.todos.findIndex(t => t.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).send("Not found");
  data.todos[index] = { ...data.todos[index], ...req.body, id: parseInt(req.params.id) };
  res.json(data.todos[index]);
});

// DELETE - Löschen
app.delete('/api/todos/:id', (req, res) => {
  const initialLength = data.todos.length;
  data.todos = data.todos.filter(t => t.id !== parseInt(req.params.id));
  if (data.todos.length === initialLength) return res.status(404).send("Not found");
  res.status(204).send();
});
```

---

## Aufgabe 3: Test-Dokumentation (Hoppscotch)

Hier sind die dokumentierten Fehlerfälle aus unserer API-Validierung (Iteration 2):

### Fehlermeldung 1: 400 Bad Request (Pflichtparameter fehlt)
**Szenario:** Abruf von ToDos ohne Angabe einer `wgId`.  
**Request:** `GET http://localhost:3000/api/todos`

```json
{
  "error": "wgId parameter is required"
}
```

### Fehlermeldung 2: 404 Not Found (Ressource existiert nicht)
**Szenario:** Abruf eines ToDos mit einer ID, die nicht existiert.  
**Request:** `GET http://localhost:3000/api/todos/999`

```text
Not found
```

### Fehlermeldung 3: 400 Bad Request (Pflichtfeld im Body fehlt)
**Szenario:** Erstellen eines ToDos ohne das Feld `title`.  
**Request:** `POST http://localhost:3000/api/todos`  
**Body:** `{"wgId": 1}`

```json
{
  "error": "title parameter is required"
}
```

---

# 04 - Datenhaltung & Persistenz

## Datenmodell (Prisma / SQLite)

Wir verwenden Prisma als ORM mit einer SQLite-Datenbank. Das Modell ist relational aufgebaut und unterstützt WG-Strukturen mit mehreren Mitgliedern.

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

# 05 - Authentifizierung

## Test-Zugangsdaten (Development)

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





# 09 - Testing

## Test-Pyramide

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

## Modul-Schnittstellen (Backend)

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

### Gefundener Verstoß & Behebung

Beim Review wurde eine Regelverletzung gefunden: **`auth.service.js`** griff in `getAccessibleUsers()` direkt per `prisma.membership.findUnique/findMany` auf die `Membership`-Tabelle zu, die zum WG-Modul gehört. Ebenso griffen **`tasks.service.js`** (`createTodo`) und **`wgs.service.js`** (`updateMemberStatus`, `joinViaInvitation`) direkt per `prisma.user.findUnique` auf die `User`-Tabelle zu, die zum Auth-Modul gehört, und **`wgs.service.js`** löschte beim Entfernen des letzten Mitglieds direkt in `prisma.shoppingItem`, `prisma.todo`, `prisma.calendarEvent`, `prisma.financeItem`, `prisma.message` – alles fremde Tabellen.

Behoben durch:
- `wgs.service.js` exportiert jetzt `getMembership()`, `getMembershipsForWg()`, `getMembershipsForUser()`; `auth.service.js` ruft diese statt direktem Prisma-Zugriff auf.
- `auth.service.js` exportiert bereits `getUserById()`; `tasks.service.js` und `wgs.service.js` nutzen diese Funktion statt eigener `prisma.user`-Abfragen.
- `tasks.service.js`, `shopping.service.js`, `calendar.service.js`, `finances.service.js`, `messages.service.js` exportieren je ein `deleteAllForWgOperation(wgId)`, das die (nicht ausgeführte) Prisma-Operation zurückgibt; `wgs.service.js` reiht diese nur noch in seine eigene `$transaction([...])` ein, statt selbst auf die fremden Tabellen zuzugreifen.
