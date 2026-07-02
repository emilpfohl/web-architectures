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