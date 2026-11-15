export interface Score {
  wins: number;
  losses: number;
  draws: number;
}

const KEY = 'tic-tac-toe.score';
export const emptyScore = (): Score => ({ wins: 0, losses: 0, draws: 0 });

/** Reads the saved score; anything missing or corrupt counts as a fresh start. */
export function loadScore(storage: Pick<Storage, 'getItem'> = localStorage): Score {
  try {
    const parsed = JSON.parse(storage.getItem(KEY) ?? 'null') as Partial<Score> | null;
    const count = (n: unknown) => (Number.isInteger(n) && (n as number) >= 0 ? (n as number) : 0);
    return parsed ? { wins: count(parsed.wins), losses: count(parsed.losses), draws: count(parsed.draws) } : emptyScore();
  } catch {
    return emptyScore();
  }
}

export function saveScore(score: Score, storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(KEY, JSON.stringify(score));
  } catch {
    // Storage can be full or blocked (private mode); the game still works without it.
  }
}
