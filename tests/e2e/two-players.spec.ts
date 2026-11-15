import { expect, test } from '@playwright/test';
import { Game } from './game.ts';

test.beforeEach(async ({ page }) => {
  const game = new Game(page);
  await game.open();
  await game.choose('Opponent', 'A friend');
});

test('players alternate and a completed row wins', async ({ page }) => {
  const game = new Game(page);
  await expect(game.status).toHaveText("X's turn.");

  await game.play('top left', 'centre', 'top centre', 'bottom right');
  await expect(game.status).toHaveText("X's turn.");
  await game.play('top right');

  await expect(game.status).toHaveText('X wins!');
  for (const name of ['top left', 'top centre', 'top right'] as const) {
    await expect(game.square(name)).toHaveAccessibleName(`${name}, X, winning line`);
  }
  await expect(game.score('X')).toHaveText('1');
});

test('a full board with no line is a draw', async ({ page }) => {
  const game = new Game(page);
  // X O X / X O O / O X X
  await game.play('top left', 'top centre', 'top right', 'centre', 'middle left', 'middle right',
    'bottom centre', 'bottom left', 'bottom right');

  await expect(game.status).toHaveText("It's a draw.");
  await expect(game.score('Draws')).toHaveText('1');
});

test('taken squares and finished games ignore clicks', async ({ page }) => {
  const game = new Game(page);
  await game.play('centre');

  // Assistive technology is told the square is unavailable, and a forced click changes nothing.
  await expect(game.square('centre')).toBeDisabled();
  await game.square('centre').click({ force: true });
  await expect(game.square('centre')).toHaveAccessibleName('centre, X');
  await expect(game.status).toHaveText("O's turn.");

  await game.play('top left', 'top right', 'middle left', 'bottom left'); // X wins on the anti-diagonal
  await expect(game.status).toHaveText('X wins!');
  await expect(game.square('bottom right')).toBeDisabled();
  await game.square('bottom right').click({ force: true });
  await expect(game.square('bottom right')).toHaveAccessibleName('bottom right, empty');
});
