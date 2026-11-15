import { describe, expect, it } from 'vitest';
import { emptyScore, loadScore, saveScore } from '../../src/score.ts';

const memory = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => void (data[key] = value),
  };
};

describe('saved score', () => {
  it('round-trips through storage', () => {
    const storage = memory();
    saveScore({ wins: 3, losses: 1, draws: 2 }, storage);
    expect(loadScore(storage)).toEqual({ wins: 3, losses: 1, draws: 2 });
  });

  it.each([
    ['nothing saved', {}],
    ['corrupt JSON', { 'tic-tac-toe.score': '{oops' }],
    ['wrong types', { 'tic-tac-toe.score': '{"wins":"lots","losses":-4,"draws":1.5}' }],
  ])('starts from zero when there is %s', (_case, data) => {
    expect(loadScore(memory(data as Record<string, string>))).toEqual(emptyScore());
  });

  it('keeps valid counts and repairs invalid ones', () => {
    expect(loadScore(memory({ 'tic-tac-toe.score': '{"wins":4,"losses":"x"}' }))).toEqual({ wins: 4, losses: 0, draws: 0 });
  });

  it('does not crash when storage is unavailable', () => {
    const broken = { setItem: () => { throw new Error('QuotaExceededError'); } };
    expect(() => saveScore({ wins: 1, losses: 0, draws: 0 }, broken)).not.toThrow();
  });
});
