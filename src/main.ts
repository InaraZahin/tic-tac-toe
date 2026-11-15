import { chooseMove, type Difficulty } from './ai.ts';
import { emptyBoard, nextPlayer, outcome, play, type Board, type Player } from './game.ts';
import { emptyScore, loadScore, saveScore, type Score } from './score.ts';
import './styles.css';

type Mode = 'computer' | 'friend';

const COMPUTER_DELAY_MS = 350;
const POSITION = ['top left', 'top centre', 'top right', 'middle left', 'centre', 'middle right',
  'bottom left', 'bottom centre', 'bottom right'];

const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const boardEl = $<HTMLDivElement>('#board');
const statusEl = $<HTMLParagraphElement>('#status');
const scoreEl = $<HTMLDListElement>('#scoreboard');
const settings = $<HTMLFormElement>('.settings');

let board: Board = emptyBoard();
let score: Score = loadScore();
let focused = 4;
let computerTimer: ReturnType<typeof setTimeout> | undefined;
let gameId = 0;

const setting = (name: string) => (settings.elements.namedItem(name) as RadioNodeList).value;
const mode = () => setting('mode') as Mode;
const difficulty = () => setting('difficulty') as Difficulty;
const humanSide = () => setting('side') as Player;
const computerSide = (): Player | null => (mode() === 'computer' ? (humanSide() === 'X' ? 'O' : 'X') : null);
const isComputerTurn = () => outcome(board).kind === 'playing' && nextPlayer(board) === computerSide();

// ---------------------------------------------------------------- rendering

const cells: HTMLButtonElement[] = [];
for (let row = 0; row < 3; row++) {
  const rowEl = document.createElement('div');
  rowEl.setAttribute('role', 'row');
  for (let col = 0; col < 3; col++) {
    const index = row * 3 + col;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.setAttribute('role', 'gridcell');
    cell.addEventListener('click', () => humanMove(index));
    cell.addEventListener('focus', () => (focused = index));
    rowEl.append(cell);
    cells.push(cell);
  }
  boardEl.append(rowEl);
}

function render() {
  const result = outcome(board);
  const winningLine: readonly number[] = result.kind === 'win' ? result.win.line : [];
  const locked = result.kind !== 'playing' || isComputerTurn();

  cells.forEach((cell, index) => {
    const mark = board[index];
    cell.textContent = mark ?? '';
    cell.dataset.mark = mark ?? '';
    cell.classList.toggle('winning', winningLine.includes(index));
    cell.setAttribute('aria-label', `${POSITION[index]}, ${mark ?? 'empty'}${winningLine.includes(index) ? ', winning line' : ''}`);
    cell.setAttribute('aria-disabled', String(locked || mark !== null));
    cell.tabIndex = index === focused ? 0 : -1; // roving tabindex: the board is one tab stop
  });

  statusEl.textContent = statusText();
  scoreEl.innerHTML = '';
  const labels: [keyof Score, string][] = mode() === 'computer'
    ? [['wins', 'You'], ['losses', 'Computer'], ['draws', 'Draws']]
    : [['wins', 'X'], ['losses', 'O'], ['draws', 'Draws']];
  for (const [key, label] of labels) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = String(score[key]);
    dd.dataset.score = key;
    scoreEl.append(dt, dd);
  }
  for (const el of settings.querySelectorAll<HTMLFieldSetElement>('[data-computer-only]')) {
    el.hidden = mode() !== 'computer';
  }
}

function statusText(): string {
  const result = outcome(board);
  const computer = computerSide();
  if (result.kind === 'draw') return "It's a draw.";
  if (result.kind === 'win') {
    if (!computer) return `${result.win.player} wins!`;
    return result.win.player === computer ? 'The computer wins.' : 'You win! 🎉';
  }
  if (computer) return result.next === computer ? 'Computer is thinking…' : `Your turn (${result.next}).`;
  return `${result.next}'s turn.`;
}

// ---------------------------------------------------------------- game flow

function humanMove(index: number) {
  if (outcome(board).kind !== 'playing' || isComputerTurn() || board[index] !== null) return;
  move(index);
}

function move(index: number) {
  board = play(board, index);
  const result = outcome(board);
  if (result.kind !== 'playing') recordResult();
  render();
  scheduleComputer();
}

function recordResult() {
  const result = outcome(board);
  if (result.kind === 'draw') score = { ...score, draws: score.draws + 1 };
  else if (result.kind === 'win') {
    // In two-player mode, "wins" counts X and "losses" counts O.
    const firstSideWon = mode() === 'computer' ? result.win.player === humanSide() : result.win.player === 'X';
    score = firstSideWon ? { ...score, wins: score.wins + 1 } : { ...score, losses: score.losses + 1 };
  }
  saveScore(score);
}

function scheduleComputer() {
  clearTimeout(computerTimer);
  if (!isComputerTurn()) return;
  const thisGame = gameId;
  computerTimer = setTimeout(() => {
    if (thisGame !== gameId || !isComputerTurn()) return; // a new game started meanwhile
    move(chooseMove(board, difficulty()));
  }, COMPUTER_DELAY_MS);
}

function newGame() {
  gameId += 1;
  clearTimeout(computerTimer);
  board = emptyBoard();
  render();
  scheduleComputer();
  cells[focused]?.focus();
}

// ---------------------------------------------------------------- input

boardEl.addEventListener('keydown', (event) => {
  const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 };
  const delta = moves[event.key];
  if (delta === undefined) return;
  event.preventDefault();
  const row = Math.floor(focused / 3);
  const next = focused + delta;
  const sameRow = Math.abs(delta) === 1 ? Math.floor(next / 3) === row : true;
  if (next >= 0 && next < 9 && sameRow) {
    focused = next;
    render();
    cells[focused]?.focus();
  }
});

$('#new-game').addEventListener('click', newGame);
$('#reset-score').addEventListener('click', () => {
  score = emptyScore();
  saveScore(score);
  render();
});
// Changing the opponent or sides makes the current game meaningless, so start over.
settings.addEventListener('change', newGame);

render();
