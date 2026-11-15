import { describe, expect, it } from 'vitest';
import { chooseMove, perfectMoves } from '../../src/ai.ts';
import { emptyBoard, freeCells, nextPlayer, outcome, play, type Board, type Player } from '../../src/game.ts';

const board = (picture: string): Board => [...picture].map((c) => (c === '-' ? null : (c as 'X' | 'O')));

/** A seeded pseudo-random generator, so "random" tests are reproducible. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe('hard computer', () => {
  /**
   * Exhaustive proof: explores EVERY game in which the computer plays any of its perfect moves and
   * the opponent plays ANY legal move. If the opponent could ever win, this finds it.
   */
  function explore(position: Board, computer: Player, stats: { games: number; losses: number }) {
    const result = outcome(position);
    if (result.kind !== 'playing') {
      stats.games += 1;
      if (result.kind === 'win' && result.win.player !== computer) stats.losses += 1;
      return;
    }
    const options = nextPlayer(position) === computer ? perfectMoves(position) : freeCells(position);
    for (const move of options) explore(play(position, move), computer, stats);
  }

  it.each<Player>(['X', 'O'])('never loses as %s, against every possible opponent', (computer) => {
    const stats = { games: 0, losses: 0 };
    explore(emptyBoard(), computer, stats);

    expect(stats.losses).toBe(0);
    expect(stats.games).toBeGreaterThan(100); // sanity check: the search really ran
  });

  it('takes a win when one is available', () => {
    // O to move. O completes the right column at 8; that beats blocking X's threat at 6.
    expect(perfectMoves(board('XXO' + 'X-O' + '---'))).toEqual([8]);
  });

  it('blocks the opponent', () => {
    // O to move, X threatens the top row
    expect(perfectMoves(board('XX-' + '-O-' + '---'))).toEqual([2]);
  });

  it('answers a corner opening with the centre', () => {
    expect(perfectMoves(board('X--' + '---' + '---'))).toEqual([4]);
  });
});

describe('medium computer', () => {
  it('wins when it can', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(chooseMove(board('XXO' + 'X-O' + '---'), 'medium', seeded(seed))).toBe(8);
    }
  });

  it('blocks an immediate threat', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(chooseMove(board('XX-' + '-O-' + '---'), 'medium', seeded(seed))).toBe(2);
    }
  });

  it('is beatable: a fork wins against it', () => {
    // X takes two corners; medium O (random when not forced) can be forked.
    let xWins = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const random = seeded(seed);
      let position = play(emptyBoard(), 0);
      while (outcome(position).kind === 'playing') {
        const move = nextPlayer(position) === 'X' ? perfectMoves(position)[0]! : chooseMove(position, 'medium', random);
        position = play(position, move);
      }
      const end = outcome(position);
      if (end.kind === 'win' && end.win.player === 'X') xWins += 1;
    }
    expect(xWins).toBeGreaterThan(0);
  });
});

describe('easy computer', () => {
  it('always plays a legal move', () => {
    const random = seeded(42);
    for (let game = 0; game < 200; game++) {
      let position = emptyBoard();
      while (outcome(position).kind === 'playing') {
        const move = chooseMove(position, 'easy', random);
        expect(position[move]).toBeNull();
        position = play(position, move);
      }
    }
  });

  it('refuses to move when the game is over', () => {
    expect(() => chooseMove(board('XXX' + 'OO-' + '---'), 'easy')).toThrow('No move to make');
  });
});
