import { describe, expect, it } from 'vitest';
import { buildLeaderboard } from './leaderboard';

describe('buildLeaderboard', () => {
  it('uses assigneeId when available and scores completed tasks higher', () => {
    const result = buildLeaderboard(
      [
        { id: 1, name: 'Anna', isHome: true },
        { id: 2, name: 'Ben', isHome: false },
      ],
      [
        { assigneeId: 1, completed: true },
        { assigneeId: 1, completed: false },
        { assigneeId: 2, completed: false },
      ]
    );

    expect(result[0]).toMatchObject({
      id: 1,
      name: 'Anna',
      rankLabel: '02',
      taskLabel: '1 erledigt',
      pointsLabel: '1 Pkt',
      score: 1,
    });
    expect(result[1]).toMatchObject({
      id: 2,
      name: 'Ben',
      rankLabel: '01',
      taskLabel: '1 offen',
      pointsLabel: '0 Pkt',
      score: 0,
    });
  });

  it('falls back to assignee name matching and sorts alphabetically on ties', () => {
    const result = buildLeaderboard(
      [
        { id: 2, name: 'Ben' },
        { id: 1, name: 'Anna' },
      ],
      [
        { assignee: 'ben', completed: true },
        { assignee: 'Anna', completed: true },
      ]
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 1, name: 'Anna', score: 1 });
    expect(result[1]).toMatchObject({ id: 2, name: 'Ben', score: 1 });
  });

  it('returns a neutral entry when a resident has no tasks', () => {
    const result = buildLeaderboard([{ id: 3, name: 'Clara', isHome: false }], []);

    expect(result[0]).toMatchObject({
      id: 3,
      name: 'Clara',
      rankLabel: '00',
      taskLabel: 'Noch keine Aufgaben',
      pointsLabel: '0 Pkt',
      score: 0,
    });
  });
});