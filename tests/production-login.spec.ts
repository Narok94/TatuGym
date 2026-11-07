import { test, expect } from '@playwright/test';
import { createInitialData } from '../src/data';

test.skip(process.env.TATUGYM_TEST_PRODUCTION !== '1', 'Requires the production build and preview server.');
test('production starts at FORJA login, rejects local demo sessions and preserves stored records', async ({ page }) => {
  const studentKey = 'meu-treino:v1:henrique-local';
  const teacherKey = 'tatugym:dev:teacher-workspace:v1';
  const data = createInitialData(); data.welcomed = true;
  const teachers = { version: 1, profiles: {}, students: [], plans: [], assessments: [], library: [], activities: [] };
  await page.addInitScript(({ studentKey, teacherKey, data, teachers }) => {
    if (!localStorage.getItem(studentKey)) localStorage.setItem(studentKey, JSON.stringify(data));
    if (!localStorage.getItem(teacherKey)) localStorage.setItem(teacherKey, JSON.stringify(teachers));
    sessionStorage.setItem('tatugym:dev:teacher-session:v1', JSON.stringify({ role: 'PROFESSOR', teacherId: 'teacher-demo-1' }));
  }, { studentKey, teacherKey, data, teachers });
  for (const path of ['/', '/#home', '/#profile', '/#professor/dashboard']) {
    await page.goto(path); await expect(page).toHaveURL(/#login$/);
    await expect(page.getByRole('heading', { name: 'Acesse sua conta', exact: true })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('autenticação real');
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeDisabled();
    await expect(page.getByLabel('Usuário ou e-mail', { exact: true })).toBeDisabled();
    await expect(page.locator('.app-shell')).toHaveCount(0);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), studentKey)).toEqual(data);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), teacherKey)).toEqual(teachers);
  }
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.locator('.forja-login-logo').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/production-login-${width}-${test.info().project.name}.png`, fullPage: true });
  }
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), studentKey)).toEqual(data);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), teacherKey)).toEqual(teachers);
});
