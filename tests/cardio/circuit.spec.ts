import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createInitialData } from '../../src/data';

async function openCardio(page: Page, login = 'henrique') {
  let data = createInitialData();
  data.welcomed = true;
  let revision = 0;
  await page.route('**/api/forja?*', route => {
    const action = new URL(route.request().url()).searchParams.get('action');
    if (action === 'session') return route.fulfill({ json: { session: { role: 'ALUNO', userId: login, login, name: login } } });
    if (action === 'student') {
      if (route.request().method() === 'POST') {
        data = route.request().postDataJSON().data;
        return route.fulfill({ json: { revision: ++revision } });
      }
      return route.fulfill({ json: { data, checkins: {}, revision } });
    }
    return route.abort();
  });
  await page.goto('/#cardio');
}

test('timer follows all rounds, rests and rope choice automatically', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-19T15:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-19T15:00:01Z'));
  await openCardio(page);
  const timer = page.getByRole('region', { name: 'Timer do circuito' });
  const clock = timer.getByRole('timer');
  await expect(clock).toHaveText('00:40');
  await timer.getByLabel('Tempo de corda').selectOption('20');
  await expect(timer).toContainText('Total: 11:30');
  await timer.getByRole('button', { name: 'Iniciar circuito' }).click();
  for (let round = 1; round <= 3; round++) {
    await expect(timer).toContainText(`Volta ${round} de 3`);
    for (const [index, seconds] of [40, 20, 40, 20, 30, 20, 20, ...(round < 3 ? [60] : [])].entries()) {
      await expect(clock).toHaveText(seconds === 60 ? '01:00' : `00:${seconds.toString().padStart(2, '0')}`);
      if (index === 7) await expect(timer.getByRole('heading')).toHaveText('Descanso entre voltas');
      else if (index % 2 === 1) await expect(timer.getByRole('heading')).toHaveText('Descanso entre exercícios');
      await page.clock.fastForward(seconds * 1000);
    }
  }
  await expect(timer).toContainText('CIRCUITO CONCLUÍDO');
  await expect(clock).toHaveText('00:00');
  await expect(timer.getByRole('button', { name: 'Pausar' })).toHaveCount(0);
  await timer.getByRole('button', { name: 'Reiniciar', exact: true }).click();
  await expect(clock).toHaveText('00:40');
});

test('images, pause, navigation, reload and resume work on mobile', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-19T15:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-19T15:00:01Z'));
  await openCardio(page);
  const timer = page.getByRole('region', { name: 'Timer do circuito' });
  const clock = timer.getByRole('timer');
  for (const img of await page.locator('.cardio-page img').all()) {
    await img.scrollIntoViewIfNeeded();
    await expect.poll(() => img.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await timer.getByRole('button', { name: 'Iniciar circuito' }).click();
  await page.clock.fastForward(10000);
  await timer.getByRole('button', { name: 'Pausar', exact: true }).click();
  await expect(clock).toHaveText('00:30');
  await page.clock.fastForward(60000);
  await expect(clock).toHaveText('00:30');
  await page.reload();
  await expect(clock).toHaveText('00:30');
  await timer.getByRole('button', { name: 'Retomar' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Dieta', exact: true }).click();
  await page.clock.fastForward(30000);
  await page.getByRole('navigation').getByRole('button', { name: 'Cardio', exact: true }).click();
  await expect(timer.getByRole('heading')).toHaveText('Descanso entre exercícios');
  await expect(clock).toHaveText('00:20');
  await page.reload();
  await expect(timer.getByRole('heading')).toHaveText('Descanso entre exercícios');
  await timer.getByRole('button', { name: 'Reiniciar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reiniciar circuito', exact: true }).click();
  await expect(clock).toHaveText('00:40');
  await page.screenshot({ path: `test-results/cardio-${test.info().project.name}.png`, fullPage: true });
});

test('cardio is limited to the Henrique login', async ({ page }) => {
  await openCardio(page, 'outro-aluno');
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByRole('navigation').getByRole('button', { name: 'Cardio', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Timer do circuito' })).toHaveCount(0);
});
