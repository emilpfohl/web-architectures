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


3. Die API testen – ohne Frontend

Fehlermeldung 1:

{
  "error": "wgId parameter is required"
}

Fehlermeldung 2

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot GET /api/todos/999</pre>
</body>
</html>

Fehlermeldung 3:

