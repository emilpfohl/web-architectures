export type LeaderboardResident = {
  id: number;
  name: string;
  isHome?: boolean;
};

export type LeaderboardTodo = {
  assigneeId?: number | null;
  assignee?: string | null;
  completed?: boolean;
};

export type LeaderboardEntry = {
  id: number;
  name: string;
  rankLabel: string;
  taskLabel: string;
  pointsLabel: string;
  score: number;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function buildLeaderboard(
  residents: LeaderboardResident[],
  todos: LeaderboardTodo[]
): LeaderboardEntry[] {
  return residents
    .map((resident) => {
      const residentTodos = todos.filter((todo) => {
        if (todo.assigneeId !== undefined && todo.assigneeId !== null) {
          return todo.assigneeId === resident.id;
        }

        if (typeof todo.assignee === 'string') {
          return normalizeName(todo.assignee) === normalizeName(resident.name);
        }

        return false;
      });

      const completedCount = residentTodos.filter((todo) => todo.completed).length;
      const openCount = residentTodos.length - completedCount;
      const score = completedCount * 120 - openCount * 20 + (resident.isHome ? 15 : 0);

      return {
        id: resident.id,
        name: resident.name,
        rankLabel: String(completedCount + openCount).padStart(2, '0'),
        taskLabel:
          completedCount > 0
            ? `${completedCount} erledigt`
            : openCount > 0
              ? `${openCount} offen`
              : 'Noch keine Aufgaben',
        pointsLabel: `${Math.max(score, 0)} Pkt`,
        score,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.name.localeCompare(right.name, 'de');
    });
}