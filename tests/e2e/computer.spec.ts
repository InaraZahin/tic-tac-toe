import { expect, test } from '@playwright/test';
import { Game } from './game.ts';

test('hard computer answers a corner with the centre, then blocks', async ({ page }) => {
  const game = new Game(page);
  await game.open();
  await game.choose('Difficulty', 'Hard');

  await game.play('top left');
  await expect(game.status).toHaveText('Your turn (X).'); // the computer has already replied
  await expect(game.square('centre')).toHaveAccessibleName('centre, O');

  await game.play('top centre'); // threaten the top row
  await expect(game.square('top right')).toHaveAccessibleName('top right, O');
});

test('the computer moves first when you play O, and the board waits for it', async ({ page }) => {
  const game = new Game(page);
  await game.open();
  await game.choose('You play', 'O (second)');

  await expect(game.status).toHaveText('Computer is thinking…');
  await game.board.getByRole('gridcell').first().click({ force: true }); // clicking now must do nothing
  await expect(game.status).toHaveText('Your turn (O).');
  expect((await game.marks()).filter(Boolean)).toEqual(['X']);
});

test('the computer punishes a mistake, and the loss is counted', async ({ page }) => {
  // The hard computer picks randomly among equally good moves. Fixing Math.random in the page
  // makes the game deterministic, without any test-only code in the app.
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  const game = new Game(page);
  await game.open();
  await game.choose('Difficulty', 'Hard');

  await game.play('top centre');
  await expect(game.square('centre')).toHaveAccessibleName('centre, O');
  await game.play('middle left');
  await expect(game.square('top left')).toHaveAccessibleName('top left, O');
  await game.play('middle right'); // the mistake: the diagonal is left open

  await expect(game.status).toHaveText('The computer wins.');
  for (const name of ['top left', 'centre', 'bottom right'] as const) {
    await expect(game.square(name)).toHaveAccessibleName(`${name}, O, winning line`);
  }
  await expect(game.score('Computer')).toHaveText('1');
  await expect(game.score('You')).toHaveText('0');
});

test('changing a setting mid-game starts a fresh game', async ({ page }) => {
  const game = new Game(page);
  await game.open();
  await game.play('centre');
  await expect(game.status).toHaveText('Your turn (X).');

  await game.choose('Difficulty', 'Easy');

  expect((await game.marks()).filter(Boolean)).toEqual([]);
  await expect(game.status).toHaveText('Your turn (X).');
});

test('difficulty and side settings only show for the computer opponent', async ({ page }) => {
  const game = new Game(page);
  await game.open();
  await expect(page.getByRole('group', { name: 'Difficulty' })).toBeVisible();

  await game.choose('Opponent', 'A friend');

  await expect(page.getByRole('group', { name: 'Difficulty' })).toBeHidden();
  await expect(page.getByRole('group', { name: 'You play' })).toBeHidden();
});
