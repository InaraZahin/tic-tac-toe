/** Pure game rules: no DOM, no randomness, no state outside the arguments. */

export type Player = 'X' | 'O';
export type Cell = Player | null;
/** Nine cells, row by row: indexes 0-2 are the top row, 3-5 the middle, 6-8 the bottom. */
export type Board = readonly Cell[];

export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

export const emptyBoard = (): Board => Array<Cell>(9).fill(null);

export const opponent = (player: Player): Player => (player === 'X' ? 'O' : 'X');

/** X always moves first, so the side to move follows from how many marks are on the board. */
export function nextPlayer(board: Board): Player {
  const marks = board.filter((cell) => cell !== null).length;
  return marks % 2 === 0 ? 'X' : 'O';
}

export function freeCells(board: Board): number[] {
  return board.flatMap((cell, index) => (cell === null ? [index] : []));
}

export interface Win {
  player: Player;
  line: readonly [number, number, number];
}

export function winner(board: Board): Win | null {
  for (const line of LINES) {
    const [a, b, c] = line;
    const mark = board[a];
    if (mark && mark === board[b] && mark === board[c]) return { player: mark, line };
  }
  return null;
}

export type Outcome = { kind: 'playing'; next: Player } | { kind: 'win'; win: Win } | { kind: 'draw' };

export function outcome(board: Board): Outcome {
  const win = winner(board);
  if (win) return { kind: 'win', win };
  if (freeCells(board).length === 0) return { kind: 'draw' };
  return { kind: 'playing', next: nextPlayer(board) };
}

/** Returns a new board with the move applied; throws on an illegal move. */
export function play(board: Board, index: number): Board {
  if (!Number.isInteger(index) || index < 0 || index > 8) throw new RangeError(`No square ${index}`);
  if (outcome(board).kind !== 'playing') throw new Error('The game is over');
  if (board[index] !== null) throw new Error(`Square ${index} is taken`);
  const next = [...board];
  next[index] = nextPlayer(board);
  return next;
}
