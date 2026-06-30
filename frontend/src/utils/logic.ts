export type PasswordValidationResult = {
  isValid: boolean;
  value: string;
  error: string | null;
};

export function validatePasswordInput(password: unknown, minLength = 8): PasswordValidationResult {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      value: '',
      error: 'Passwort muss ein String sein',
    };
  }

  const value = password.trim();

  if (!value) {
    return {
      isValid: false,
      value,
      error: 'Passwort ist erforderlich',
    };
  }

  if (value.length < minLength) {
    return {
      isValid: false,
      value,
      error: `Passwort muss mindestens ${minLength} Zeichen lang sein`,
    };
  }

  return {
    isValid: true,
    value,
    error: null,
  };
}

export type ShoppingItemInputResult = {
  isValid: boolean;
  name: string;
  category: string;
  error: string | null;
};

export function prepareShoppingItemInput(name: unknown, category: unknown): ShoppingItemInputResult {
  if (typeof name !== 'string') {
    return {
      isValid: false,
      name: '',
      category: typeof category === 'string' && category.trim() ? category.trim() : 'Lebensmittel',
      error: 'Name muss ein String sein',
    };
  }

  const normalizedName = name.trim();

  if (!normalizedName) {
    return {
      isValid: false,
      name: '',
      category: typeof category === 'string' && category.trim() ? category.trim() : 'Lebensmittel',
      error: 'Name ist erforderlich',
    };
  }

  return {
    isValid: true,
    name: normalizedName,
    category: typeof category === 'string' && category.trim() ? category.trim() : 'Lebensmittel',
    error: null,
  };
}

export type FinanceSummary = {
  total: number;
  averagePerPerson: number;
  balances: Record<string, number>;
  members: string[];
};

function emptyFinanceSummary(): FinanceSummary {
  return {
    total: 0,
    averagePerPerson: 0,
    balances: {},
    members: [],
  };
}

export function calculateFinanceSummary(expenses: unknown): FinanceSummary {
  if (!Array.isArray(expenses)) {
    return emptyFinanceSummary();
  }

  const validExpenses = expenses.filter((expense): expense is { amount: number; paidBy: string } => {
    if (!expense || typeof expense !== 'object') return false;

    const maybeExpense = expense as { amount?: unknown; paidBy?: unknown };
    return typeof maybeExpense.amount === 'number' && Number.isFinite(maybeExpense.amount) && typeof maybeExpense.paidBy === 'string' && maybeExpense.paidBy.trim().length > 0;
  });

  if (validExpenses.length === 0) {
    return emptyFinanceSummary();
  }

  const balances = validExpenses.reduce<Record<string, number>>((acc, expense) => {
    const payer = expense.paidBy.trim();
    acc[payer] = (acc[payer] || 0) + expense.amount;
    return acc;
  }, {});

  const members = Object.keys(balances);
  const total = validExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averagePerPerson = members.length > 0 ? total / members.length : 0;

  const normalizedBalances = members.reduce<Record<string, number>>((acc, member) => {
    acc[member] = balances[member] - averagePerPerson;
    return acc;
  }, {});

  return {
    total,
    averagePerPerson,
    balances: normalizedBalances,
    members,
  };
}

export function getAccountInitials(name: unknown): string {
  if (typeof name !== 'string') return '?';

  const value = name.trim();
  if (!value) return '?';

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
}

export type TodoDisplayState = {
  id: number;
  title: string;
  assignee: string;
  isCompleted: boolean;
  urgencyLabel: string;
  points: number;
};

export function buildTodoDisplayState(todo: unknown): TodoDisplayState {
  if (!todo || typeof todo !== 'object') {
    return {
      id: 0,
      title: '',
      assignee: 'Keiner',
      isCompleted: false,
      urgencyLabel: 'Ungültig',
      points: 0,
    };
  }

  const maybeTodo = todo as {
    id?: unknown;
    title?: unknown;
    assignee?: unknown;
    completed?: unknown;
  };

  const id = typeof maybeTodo.id === 'number' && Number.isFinite(maybeTodo.id) ? maybeTodo.id : 0;
  const title = typeof maybeTodo.title === 'string' ? maybeTodo.title.trim() : '';
  const assignee = typeof maybeTodo.assignee === 'string' && maybeTodo.assignee.trim() ? maybeTodo.assignee.trim() : 'Keiner';
  const isCompleted = maybeTodo.completed === true;

  return {
    id,
    title,
    assignee,
    isCompleted,
    urgencyLabel: id > 0 && id % 2 === 0 ? 'Dringend' : 'Normal',
    points: id > 0 ? id * 150 + 400 : 0,
  };
}

export function formatMessageTimestamp(timestamp: unknown, fallback = 'Unbekannt'): string {
  if (typeof timestamp !== 'string' || !timestamp.trim()) {
    return fallback;
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}