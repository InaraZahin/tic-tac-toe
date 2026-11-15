import { expect, type Locator, type Page } from '@playwright/test';

export const SQUARES = ['top left', 'top centre', 'top right', 'middle left', 'centre', 'middle right',
  'bottom left', 'bottom centre', 'bottom right'] as const;
export type Square = (typeof SQUARES)[number];

/** Page object: everything is found by role and accessible name, as a screen reader would. */
export class Game {
  readonly page: Page;
  readonly board: Locator;
  readonly status: Locator;

  constructor(page: Page) {
    this.page = page;
    this.board = page.getByRole('grid', { name: 'Board' });
    this.status = page.getByRole('status');
  }

  async open() {
    await this.page.goto('/');
    await expect(this.board.getByRole('gridcell')).toHaveCount(9);
  }

  square(name: Square): Locator {
    return this.board.getByRole('gridcell', { name: new RegExp(`^${name},`) });
  }

  async choose(group: 'Opponent' | 'Difficulty' | 'You play', option: string) {
    await this.page.getByRole('group', { name: group }).getByLabel(option).check();
  }

  async play(...squares: Square[]) {
    for (const name of squares) await this.square(name).click();
  }

  score(who: string): Locator {
    return this.page.locator('#scoreboard dt', { hasText: new RegExp(`^${who}$`) }).locator('+ dd');
  }

  async marks(): Promise<string[]> {
    return this.board.getByRole('gridcell').allTextContents();
  }
}
