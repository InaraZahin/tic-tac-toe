import { expect, test } from '@playwright/test';
import { Game, SQUARES } from './game.ts';

test('the whole game can be played with the keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard navigation is a desktop concern');
  const game = new Game(page);
  await game.open();
  await game.choose('Opponent', 'A friend');

  await page.getByRole('button', { name: 'New game' }).focus();
  await page.keyboard.press('Shift+Tab'); // the board is a single tab stop
  await expect(game.square('centre')).toBeFocused();

  await page.keyboard.press('Enter'); // X in the centre
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowLeft');
  await expect(game.square('top left')).toBeFocused();
  await page.keyboard.press('Space'); // O top left

  await expect(game.square('centre')).toHaveAccessibleName('centre, X');
  await expect(game.square('top left')).toHaveAccessibleName('top left, O');
  await expect(game.status).toHaveText("X's turn.");

  await page.keyboard.press('ArrowLeft'); // already at the edge: focus stays
  await expect(game.square('top left')).toBeFocused();
});

test('every square describes its position and contents', async ({ page }) => {
  const game = new Game(page);
  await game.open();
  for (const name of SQUARES) {
    await expect(game.square(name)).toHaveAccessibleName(`${name}, empty`);
  }
});

test('the score survives a reload and can be reset', async ({ page }) => {
  const game = new Game(page);
  await game.open();
  await game.choose('Opponent', 'A friend');
  await game.play('top left', 'centre', 'top centre', 'bottom right', 'top right');
  await expect(game.score('X')).toHaveText('1');

  await page.reload();
  await game.choose('Opponent', 'A friend');
  await expect(game.score('X')).toHaveText('1');

  await page.getByRole('button', { name: 'Reset score' }).click();
  await expect(game.score('X')).toHaveText('0');
  await page.reload();
  await expect(game.score('You')).toHaveText('0');
});

test('the layout fits a phone screen without sideways scrolling', async ({ page }) => {
  const game = new Game(page);
  await game.open();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(game.square('bottom right')).toBeInViewport();
});
