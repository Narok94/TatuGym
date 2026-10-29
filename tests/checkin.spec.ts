import { test, expect } from '@playwright/test';
import { createInitialData } from '../src/data';

const key = 'meu-treino:v1:henrique-local';
const checkinsKey = `${key}:weekly-checkins`;
test.use({ timezoneId: 'America/Sao_Paulo' });

test.beforeEach(async ({ page }) => {
  const data = createInitialData(); data.welcomed = true; data.theme = 'dark';
  await page.clock.install({ time: new Date('2026-10-29T12:00:00-03:00') });
  await page.addInitScript(({ key, checkinsKey, data }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(data));
    if (!localStorage.getItem(checkinsKey)) localStorage.setItem(checkinsKey, JSON.stringify({'2026-10-18':true}));
  }, { key, checkinsKey, data });
  await page.goto('/');
});

test('weekly check-ins toggle, persist, block future dates and preserve app data', async ({ page }) => {
  const card = page.getByRole('region', { name: 'SEU CHECK-IN SEMANAL' });
  const before = await page.evaluate(key => localStorage.getItem(key), key);
  await expect(card).toContainText('0/7 dias');
  await expect(card.getByRole('button')).toHaveCount(7);
  await expect(card.getByRole('button', { name: 'Check-in SEX, 30/10/2026' })).toBeDisabled();
  const today = card.getByRole('button', { name: 'Check-in QUI, 29/10/2026' });
  await expect(today).toHaveAttribute('aria-current', 'date');
  await today.click(); await expect(card).toContainText('1/7 dias');
  await today.click(); await expect(card).toContainText('0/7 dias');
  await today.click();
  await card.getByRole('button', { name: 'Check-in SEG, 26/10/2026' }).click();
  await page.reload(); await expect(card).toContainText('2/7 dias');
  await expect(today).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(before);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), checkinsKey)).toEqual({
    '2026-10-18':true, '2026-10-26':true, '2026-10-29':true,
  });
  await page.clock.setSystemTime(new Date('2026-11-02T12:00:00-03:00'));
  await page.clock.runFor(30000);
  await expect(card).toContainText('0/7 dias');
  await card.getByRole('button', { name: 'Check-in SEG, 02/11/2026' }).click();
  const records = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), checkinsKey);
  expect(Object.keys(records)).toHaveLength(4);
  expect(records['2026-10-29']).toBe(true);
});

test('uses local dates, stays above workout and fits mobile safe areas', async ({ page }) => {
  await page.clock.setSystemTime(new Date('2026-10-30T01:30:00Z'));
  await page.reload();
  const card = page.locator('.weekly-checkin');
  await expect(card.locator('[aria-current="date"]')).toHaveAccessibleName('Check-in QUI, 29/10/2026');
  await page.addStyleTag({ content: ':root { --safe-top: 59px; }' });
  for (const width of [320, 390, 1024]) {
    await page.setViewportSize({ width, height: 844 });
    const header = (await page.locator('.page-header').boundingBox())!;
    const checkin = (await card.boundingBox())!;
    const workout = (await page.locator('.hero-workout').boundingBox())!;
    expect(checkin.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(workout.y).toBeGreaterThanOrEqual(checkin.y + checkin.height);
    expect(checkin.y).toBeGreaterThan(59);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 4; i++) await card.getByRole('button').nth(i).click();
  await expect(card).toContainText('4/7 dias');
  await page.screenshot({ path: `test-results/checkin-${test.info().project.name}.png` });
});
