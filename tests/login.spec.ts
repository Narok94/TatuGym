import { test, expect, type Page } from '@playwright/test';
import { createInitialData } from '../src/data';

const key = 'meu-treino:v1:henrique-local';
async function login(page: Page, user: string, password: string) {
  await page.getByLabel('Usuário ou e-mail', { exact: true }).fill(user);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
async function teacherLogout(page: Page) {
  const menu = page.getByRole('button', { name: 'Abrir menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/#login$/);
}

test('FORJA approved login keeps assets proportional and form accessible on mobile and desktop', async ({ page }) => {
  await page.goto('/#login');
  await expect(page.getByRole('heading', { name: 'Acesse sua conta', exact: true })).toBeVisible();
  await expect(page.locator('form')).toHaveCount(1);
  for (const [width, height] of [[320, 568], [390, 844], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.locator('.forja-login-logo').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const dimensions = await page.locator('.forja-login-logo').evaluate((img: HTMLImageElement) => {
      const box = img.getBoundingClientRect(); return Math.abs(box.width / box.height - img.naturalWidth / img.naturalHeight);
    });
    expect(dimensions).toBeLessThan(.01);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeInViewport();
    if (width !== 320) await page.screenshot({ path: `test-results/login-forja-${width}-${test.info().project.name}.png`, fullPage: true });
  }
  await page.getByLabel('Senha', { exact: true }).fill(process.env.FORJA_SEED_TEACHER_PASSWORD!);
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('link', { name: 'Esqueceu sua senha?', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('indisponível');
});

test('development accounts preserve student progress, persist session, logout and guard both roles', async ({ page }) => {
  const data = createInitialData(); data.welcomed = true; data.theme = 'dark';
  const workout = structuredClone(data.workouts[0]);
  const set = { exerciseId: workout.exercises[0].id, setIndex: 0, load: 42, reps: 11, completedAt: '2026-11-01T12:00:00Z' };
  data.activeSession = { id: 'in-progress', workout, startedAt: '2026-11-01T11:00:00Z', currentExercise: 0, sets: [set], rest: { remaining: 0, endsAt: null } };
  data.history = [{ ...structuredClone(data.activeSession), id: 'previous', finishedAt: '2026-11-01T13:00:00Z' }];
  await page.addInitScript(({ key, data }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(data));
    if (!localStorage.getItem(`${key}:weekly-checkins`)) localStorage.setItem(`${key}:weekly-checkins`, '{"2026-11-02":true}');
  }, { key, data });
  const unchanged = async () => {
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(data);
    expect(await page.evaluate(key => localStorage.getItem(`${key}:weekly-checkins`), key)).toBe('{"2026-11-02":true}');
  };
  await page.goto('/#workout/a'); await expect(page).toHaveURL(/#login$/); await unchanged();
  await login(page, 'henrique', process.env.FORJA_SEED_TEACHER_PASSWORD!); await expect(page.getByRole('alert')).toContainText('inválidos');
  await login(page, 'henrique', process.env.FORJA_SEED_STUDENT_PASSWORD!); await expect(page).toHaveURL(/#home$/);
  await expect(page.getByRole('button', { name: 'Continuar treino', exact: true })).toBeVisible(); await unchanged();
  await page.goto('/#professor/alunos'); await expect(page).toHaveURL(/#home$/);
  await expect(page.locator('.teacher-shell')).toHaveCount(0); await unchanged();
  await page.reload(); await expect(page.getByRole('button', { name: 'Sair da conta', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Perfil', exact: true }).click();
  await page.locator('#main-content').getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/#login$/); await unchanged();
  await page.goBack(); await expect(page).toHaveURL(/#login$/);
  await expect(page.locator('.app-shell')).toHaveCount(0);
  await page.goto('/#session'); await expect(page).toHaveURL(/#login$/);
  await login(page, 'henrique', process.env.FORJA_SEED_STUDENT_PASSWORD!); await expect(page).toHaveURL(/#home$/); await unchanged();
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await login(page, 'professor', process.env.FORJA_SEED_TEACHER_PASSWORD!); await expect(page).toHaveURL(/#professor\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Olá, Professor TatuGym.' })).toBeVisible();
  await page.goto('/#home'); await expect(page).toHaveURL(/#professor\/dashboard$/);
  await expect(page.locator('.dashboard-home')).toHaveCount(0); await unchanged();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Olá, Professor TatuGym.' })).toBeVisible();
  await page.getByRole('button', { name: 'Carregar demonstração', exact: true }).click();
  const teacherKey = 'tatugym:dev:teacher-workspace:v1';
  const teacherData = await page.evaluate(key => localStorage.getItem(key), teacherKey);
  await page.locator('.teacher-user').click();
  await page.locator('#teacher-content').getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page).toHaveURL(/#login$/);
  await page.goBack(); await expect(page).toHaveURL(/#login$/);
  await expect(page.locator('.teacher-shell')).toHaveCount(0);
  await page.goto('/#professor/alunos'); await expect(page).toHaveURL(/#login$/);
  await login(page, 'professor', process.env.FORJA_SEED_TEACHER_PASSWORD!); await expect(page.getByRole('heading', { name: 'Olá, Professor TatuGym.' })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), teacherKey)).toBe(teacherData);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.teacher-sidebar-bottom').getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
  await teacherLogout(page);
  await page.goBack(); await expect(page).toHaveURL(/#login$/);
  await page.goto('/#professor/dashboard'); await expect(page).toHaveURL(/#login$/);
  await login(page, 'professor2', process.env.FORJA_SEED_TEACHER_PASSWORD!); await expect(page.getByRole('heading', { name: 'Olá, Professor 2.' })).toBeVisible();
  await teacherLogout(page); await unchanged();
  await page.reload(); await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible();
});
