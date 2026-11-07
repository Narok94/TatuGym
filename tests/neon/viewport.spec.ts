import { test, expect } from '@playwright/test';
import { createInitialData } from '../../src/data';

test('mobile viewport settles on launch and return without changing tabs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const original = Object.getOwnPropertyDescriptor(window, 'innerHeight')!;
    window.addEventListener('test:restore-viewport', () => Object.defineProperty(window, 'innerHeight', original));
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => 780 });
  });
  const data = createInitialData();
  data.welcomed = true;
  data.theme = 'dark';
  const session = { role: 'ALUNO', userId: 'viewport-preview', login: 'viewport-preview', name: 'Aluno' };
  await page.route('**/api/forja?*', route => {
    const action = new URL(route.request().url()).searchParams.get('action');
    if (action === 'session') return route.fulfill({ json: { session } });
    if (action === 'student') return route.fulfill({ json: { data, checkins: {}, revision: 0 } });
    return route.abort();
  });
  await page.goto('/#home');
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  const expectBottom = async (height: number) => {
    await expect.poll(() => nav.evaluate(element => Math.round(element.getBoundingClientRect().bottom))).toBe(height);
    await expect(nav.getByRole('button', { name: 'Início', exact: true })).toHaveClass('active');
  };
  await expectBottom(780);
  await page.addStyleTag({ content: ':root { --safe-top: 47px; --safe-bottom: 34px; }' });
  expect(await page.locator('.topbar').evaluate(element => element.getBoundingClientRect().top)).toBe(55);
  expect(await page.locator('.topbar .brand').evaluate(element => getComputedStyle(element).filter)).toBe('none');

  await page.evaluate(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => 844 });
    window.visualViewport!.dispatchEvent(new Event('resize'));
  });
  await expectBottom(844);
  await page.evaluate(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => 800 });
    window.dispatchEvent(new Event('pageshow'));
  });
  await expectBottom(800);
  await page.evaluate(() => {
    window.dispatchEvent(new Event('test:restore-viewport'));
    window.dispatchEvent(new Event('resize'));
  });
  await expectBottom(844);
  await page.setViewportSize({ width: 390, height: 760 });
  await expectBottom(760);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectBottom(844);
  await nav.getByRole('button', { name: 'Treinos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Meus treinos', exact: true })).toBeVisible();
  await expect.poll(() => nav.evaluate(element => Math.round(element.getBoundingClientRect().bottom))).toBe(844);
});
