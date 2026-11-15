import { freeCells, LINES, nextPlayer, opponent, outcome, play, type Board, type Player } from './game.ts';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Random = () => number;

/** Squares tried first when moves are equally good: centre, corners, then edges. */
const PREFERENCE = [4, 0, 2, 6, 8, 1, 3, 5, 7];

/**
 * Picks the computer's move for whoever is to play.
 * - easy:   any free square
 * - medium: wins if it can, blocks an immediate loss, otherwise plays randomly
 * - hard:   perfect play (minimax); it never loses
 */
export function chooseMove(board: Board, difficulty: Difficulty, random: Random = Math.random): number {
  const free = freeCells(board);
  if (free.length === 0 || outcome(board).kind !== 'playing') throw new Error('No move to make');
  const pick = (options: number[]) => options[Math.floor(random() * options.length)]!;

  if (difficulty === 'easy') return pick(free);

  const me = nextPlayer(board);
  if (difficulty === 'medium') {
    return completingMove(board, me) ?? completingMove(board, opponent(me)) ?? pick(free);
  }

  // Hard: choose randomly among the perfect moves, so games vary but are never worse.
  return pick(perfectMoves(board));
}

/** Every move with the best possible minimax score, in preference order (centre, corners, edges). */
export function perfectMoves(board: Board): number[] {
  const scored = freeCells(board).map((index) => ({ index, score: -negamax(play(board, index), 1) }));
  const best = Math.max(...scored.map((m) => m.score));
  const bestMoves = scored.filter((m) => m.score === best).map((m) => m.index);
  return PREFERENCE.filter((i) => bestMoves.includes(i));
}

/** A free square that would complete a line of three for `player`, if any. */
function completingMove(board: Board, player: Player): number | null {
  for (const line of LINES) {
    const marks = line.map((i) => board[i]);
    if (marks.filter((m) => m === player).length === 2 && marks.includes(null)) {
      return line[marks.indexOf(null)]!;
    }
  }
  return null;
}

/**
 * Score of `board` for the player to move: +10 for a win, -10 for a loss, 0 for a draw,
 * adjusted by depth so a quicker win (or a slower loss) is preferred.
 */
function negamax(board: Board, depth: number): number {
  const key = board.map((c) => c ?? '-').join('');
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const result = outcome(board);
  let best: number;
  if (result.kind === 'win') best = -(10 - depth); // the previous player just won
  else if (result.kind === 'draw') best = 0;
  else {
    best = -Infinity;
    for (const index of freeCells(board)) best = Math.max(best, -negamax(play(board, index), depth + 1));
  }
  cache.set(key, best);
  return best;
}

/** Positions repeat across games, and depth is implied by the board, so results can be reused. */
const cache = new Map<string, number>();
