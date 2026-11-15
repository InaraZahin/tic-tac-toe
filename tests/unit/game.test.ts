import { describe, expect, it } from 'vitest';
import { emptyBoard, freeCells, nextPlayer, outcome, play, winner, type Board } from '../../src/game.ts';

/** Builds a board from a 9-character picture, e.g. 'XO-' + '-X-' + '--O'. */
const board = (picture: string): Board => [...picture].map((c) => (c === '-' ? null : (c as 'X' | 'O')));
const moves = (...indexes: number[]): Board => indexes.reduce(play, emptyBoard());

describe('rules', () => {
  it('starts empty with X to move', () => {
    expect(freeCells(emptyBoard())).toHaveLength(9);
    expect(outcome(emptyBoard())).toEqual({ kind: 'playing', next: 'X' });
  });

  it('alternates turns, X first', () => {
    expect(nextPlayer(moves(4))).toBe('O');
    expect(nextPlayer(moves(4, 0))).toBe('X');
    expect(moves(4, 0)).toEqual(board('O---X----'));
  });

  it.each([
    ['top row', 'XXX' + 'OO-' + '---', [0, 1, 2]],
    ['middle column', 'OX-' + 'OX-' + '-X-', [1, 4, 7]],
    ['diagonal', 'X-O' + '-XO' + '--X', [0, 4, 8]],
    ['anti-diagonal', 'XXO' + '-O-' + 'OX-', [2, 4, 6]],
  ])('detects a win on the %s', (_name, picture, line) => {
    expect(winner(board(picture))?.line).toEqual(line);
  });

  it('detects a draw only when the board is full with no line', () => {
    expect(outcome(board('XOX' + 'XOO' + 'OXX'))).toEqual({ kind: 'draw' });
    expect(outcome(board('XOX' + 'XOO' + 'OX-')).kind).toBe('playing');
  });

  it('a win on the last square is a win, not a draw', () => {
    expect(outcome(board('XOX' + 'OXO' + 'OXX'))).toMatchObject({ kind: 'win', win: { player: 'X' } });
  });

  it('never changes the board it was given', () => {
    const before = moves(4);
    play(before, 0);
    expect(before).toEqual(board('----X----'));
  });

  it.each([
    ['a taken square', () => play(moves(4), 4), 'Square 4 is taken'],
    ['a square off the board', () => play(emptyBoard(), 9), 'No square 9'],
    ['a move after the game ended', () => play(board('XXX' + 'OO-' + '---'), 8), 'The game is over'],
  ])('rejects %s', (_name, move, message) => {
    expect(move).toThrow(message);
  });
});
