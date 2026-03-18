const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// In-Memory Data Store Simulation
const data = {
  shopping: [
    { id: 1, name: 'Milch', checked: false },
    { id: 2, name: 'Toilettenpapier', checked: true }
  ],
  todos: [
    { id: 1, title: 'Küche putzen', assignee: 'Max', completed: false },
    { id: 2, title: 'Müll runterbringen', assignee: 'Anna', completed: true }
  ],
  calendar: [
    { id: 1, date: '2026-03-20', title: 'WG Party' }
  ],
  finances: [
    { id: 1, amount: 25.50, description: 'Einkauf', paidBy: 'Max' }
  ]
};

// Shopping Routes
app.get('/api/shopping', (req, res) => res.json(data.shopping));
app.post('/api/shopping', (req, res) => {
  const newItem = { id: Date.now(), ...req.body, checked: false };
  data.shopping.push(newItem);
  res.status(201).json(newItem);
});
app.put('/api/shopping/:id', (req, res) => {
  const item = data.shopping.find(i => i.id === parseInt(req.params.id));
  if (item) {
    if (req.body.checked !== undefined) item.checked = req.body.checked;
    res.json(item);
  } else {
    res.status(404).send('Not found');
  }
});
app.delete('/api/shopping/:id', (req, res) => {
  data.shopping = data.shopping.filter(i => i.id !== parseInt(req.params.id));
  res.status(204).send();
});

// Todo Routes
app.get('/api/todos', (req, res) => res.json(data.todos));
app.post('/api/todos', (req, res) => {
  const newTodo = { id: Date.now(), ...req.body, completed: false };
  data.todos.push(newTodo);
  res.status(201).json(newTodo);
});
app.put('/api/todos/:id', (req, res) => {
  const item = data.todos.find(i => i.id === parseInt(req.params.id));
  if (item) {
    if (req.body.completed !== undefined) item.completed = req.body.completed;
    res.json(item);
  } else {
    res.status(404).send('Not found');
  }
});

// Calendar Routes
app.get('/api/calendar', (req, res) => res.json(data.calendar));
app.post('/api/calendar', (req, res) => {
  const newEvent = { id: Date.now(), ...req.body };
  data.calendar.push(newEvent);
  res.status(201).json(newEvent);
});

// Finance Routes
app.get('/api/finances', (req, res) => res.json(data.finances));
app.post('/api/finances', (req, res) => {
  const newExpense = { id: Date.now(), ...req.body };
  data.finances.push(newExpense);
  res.status(201).json(newExpense);
});

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
});
