import { describe, expect, it } from 'vitest';
import {
  calculateFinanceSummary,
  calculateNetDebts,
  buildTodoDisplayState,
  formatMessageTimestamp,
  getAccountInitials,
  prepareShoppingItemInput,
  validatePasswordInput,
} from './logic';

describe('validatePasswordInput', () => {
  it('accepts a valid password', () => {
    expect(validatePasswordInput('Geheim123')).toEqual({
      isValid: true,
      value: 'Geheim123',
      error: null,
    });
  });

  it('rejects an empty password', () => {
    expect(validatePasswordInput('   ')).toEqual({
      isValid: false,
      value: '',
      error: 'Passwort ist erforderlich',
    });
  });

  it('rejects invalid types', () => {
    expect(validatePasswordInput(12345)).toEqual({
      isValid: false,
      value: '',
      error: 'Passwort muss ein String sein',
    });
  });
});

describe('calculateFinanceSummary', () => {
  it('calculates totals and balances for valid expenses', () => {
    expect(
      calculateFinanceSummary([
        { amount: 12.5, paidBy: 'Anna' },
        { amount: 7.5, paidBy: 'Ben' },
        { amount: 5, paidBy: 'Anna' },
      ])
    ).toEqual({
      total: 25,
      averagePerPerson: 12.5,
      balances: {
        Anna: 5,
        Ben: -5,
      },
      members: ['Anna', 'Ben'],
    });
  });

  it('returns a neutral summary for empty input', () => {
    expect(calculateFinanceSummary([])).toEqual({
      total: 0,
      averagePerPerson: 0,
      balances: {},
      members: [],
    });
  });

  it('returns a neutral summary for invalid types', () => {
    expect(calculateFinanceSummary({})).toEqual({
      total: 0,
      averagePerPerson: 0,
      balances: {},
      members: [],
    });
  });
});

describe('calculateNetDebts', () => {
  it('returns a single net entry when debts go one direction only', () => {
    expect(calculateNetDebts([
      { fromUserName: 'Bob', toUserName: 'Anna', amount: 20 }
    ])).toEqual([{ fromUserName: 'Bob', toUserName: 'Anna', amount: 20 }]);
  });

  it('nets opposing debts between the same pair', () => {
    expect(calculateNetDebts([
      { fromUserName: 'Bob', toUserName: 'Anna', amount: 20 },
      { fromUserName: 'Anna', toUserName: 'Bob', amount: 5 }
    ])).toEqual([{ fromUserName: 'Bob', toUserName: 'Anna', amount: 15 }]);
  });

  it('omits pairs whose balance is exactly zero', () => {
    expect(calculateNetDebts([
      { fromUserName: 'Bob', toUserName: 'Anna', amount: 10 },
      { fromUserName: 'Anna', toUserName: 'Bob', amount: 10 }
    ])).toEqual([]);
  });

  it('ignores settled debts', () => {
    expect(calculateNetDebts([
      { fromUserName: 'Bob', toUserName: 'Anna', amount: 20, settledAt: '2026-01-01T00:00:00.000Z' }
    ])).toEqual([]);
  });

  it('keeps multiple independent pairs separate', () => {
    expect(calculateNetDebts([
      { fromUserName: 'Bob', toUserName: 'Anna', amount: 20 },
      { fromUserName: 'Cara', toUserName: 'Anna', amount: 8 }
    ])).toEqual([
      { fromUserName: 'Bob', toUserName: 'Anna', amount: 20 },
      { fromUserName: 'Cara', toUserName: 'Anna', amount: 8 }
    ]);
  });

  it('returns an empty array for invalid input', () => {
    expect(calculateNetDebts(null)).toEqual([]);
    expect(calculateNetDebts('not an array')).toEqual([]);
  });
});

describe('prepareShoppingItemInput', () => {
  it('normalizes a valid shopping item', () => {
    expect(prepareShoppingItemInput('  Milch  ', 'Haushalt')).toEqual({
      isValid: true,
      name: 'Milch',
      category: 'Haushalt',
      error: null,
    });
  });

  it('rejects an empty item name', () => {
    expect(prepareShoppingItemInput('   ', 'Lebensmittel')).toEqual({
      isValid: false,
      name: '',
      category: 'Lebensmittel',
      error: 'Name ist erforderlich',
    });
  });

  it('rejects invalid types', () => {
    expect(prepareShoppingItemInput(42, 'Haushalt')).toEqual({
      isValid: false,
      name: '',
      category: 'Haushalt',
      error: 'Name muss ein String sein',
    });
  });
});

describe('getAccountInitials', () => {
  it('creates initials from a full name', () => {
    expect(getAccountInitials('Anna Müller')).toBe('AM');
  });

  it('returns a fallback for empty input', () => {
    expect(getAccountInitials('   ')).toBe('?');
  });

  it('returns a fallback for invalid types', () => {
    expect(getAccountInitials(null)).toBe('?');
  });
});

describe('buildTodoDisplayState', () => {
  it('builds display data for a valid todo', () => {
    expect(buildTodoDisplayState({ id: 4, title: 'Küche putzen', assignee: 'Anna', completed: true })).toEqual({
      id: 4,
      title: 'Küche putzen',
      assignee: 'Anna',
      isCompleted: true,
      urgencyLabel: 'Dringend',
    });
  });

  it('returns neutral values for empty input', () => {
    expect(buildTodoDisplayState({})).toEqual({
      id: 0,
      title: '',
      assignee: 'Keiner',
      isCompleted: false,
      urgencyLabel: 'Normal',
    });
  });

  it('returns neutral values for invalid types', () => {
    expect(buildTodoDisplayState('invalid')).toEqual({
      id: 0,
      title: '',
      assignee: 'Keiner',
      isCompleted: false,
      urgencyLabel: 'Ungültig',
    });
  });
});

describe('formatMessageTimestamp', () => {
  it('formats a valid timestamp', () => {
    expect(formatMessageTimestamp('2026-06-03T10:15:00.000Z')).toMatch(/\d{2}:\d{2}/);
  });

  it('returns fallback for empty input', () => {
    expect(formatMessageTimestamp('')).toBe('Unbekannt');
  });

  it('returns fallback for invalid types', () => {
    expect(formatMessageTimestamp(12345)).toBe('Unbekannt');
  });
});