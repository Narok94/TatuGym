import { expect, test } from '@playwright/test';
import catalog from '../../shared/exercise-catalog.json' with { type: 'json' };

test('teacher chooses an illustrated library exercise and the student receives the same image', async ({ page, context, browser }, info) => {
  const teacherPassword = process.env.FORJA_SEED_TEACHER_PASSWORD!;
  const studentPassword = process.env.FORJA_SEED_STUDENT_PASSWORD!;
  await page.goto('/#login');
  await page.getByLabel('Usuário ou e-mail', { exact: true }).fill('professor');
  await page.getByLabel('Senha', { exact: true }).fill(teacherPassword);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/#professor\/dashboard$/);
  const own = await (await context.request.get('/api/forja?action=teacher')).json();
  const builtins = own.library.filter((item: { id: string }) => item.id.startsWith('forja:'));
  expect(builtins).toHaveLength(100);
  const menu = page.getByRole('button', { name: 'Abrir menu', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('link', { name: 'Biblioteca de exercícios', exact: true }).click();
  const filter = page.getByRole('combobox', { name: 'Filtrar grupo muscular', exact: true });
  for (const group of new Set(catalog.map(item => item.muscleGroup))) {
    await filter.selectOption(group);
    await expect(page.locator('.teacher-library-item')).toHaveCount(10);
  }
  await page.screenshot({ path: info.outputPath('biblioteca-mobile.png'), fullPage: true });
  await filter.selectOption('Costas');
  await page.getByRole('searchbox', { name: 'Buscar exercícios', exact: true }).fill('puxada frontal');
  await expect(page.locator('.teacher-library-item')).toHaveCount(1);
  const libraryImage = page.locator('.teacher-library-item img');
  await expect.poll(() => libraryImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(libraryImage).toHaveAttribute('src', '/exercises/puxada-frontal.webp');
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('link', { name: 'Treinos', exact: true }).click();
  await page.getByRole('button', { name: 'Criar treino', exact: true }).click();
  const title = `Plano com imagem ${info.project.name}`;
  await page.getByLabel('Nome do treino', { exact: true }).fill(title);
  await page.getByRole('combobox', { name: 'Aluno responsável', exact: true }).selectOption(own.students[0].id);
  await page.getByRole('combobox', { name: 'Situação do treino', exact: true }).selectOption('ATIVO');
  await page.getByRole('combobox', { name: 'Filtrar grupo, exercício 1', exact: true }).selectOption('Costas');
  await page.getByRole('searchbox', { name: 'Buscar na biblioteca, exercício 1', exact: true }).fill('puxada frontal');
  await page.getByRole('combobox', { name: 'Biblioteca para exercício 1', exact: true }).selectOption('forja:puxada-frontal');
  await expect(page.getByLabel('Nome exercício 1', { exact: true })).toHaveValue('Puxada frontal');
  await expect(page.locator('.teacher-selected-exercise img')).toHaveAttribute('src', '/exercises/puxada-frontal.webp');
  await page.getByRole('button', { name: 'Adicionar exercício', exact: true }).click();
  await page.getByRole('combobox', { name: 'Biblioteca para exercício 2', exact: true }).selectOption('forja:prancha');
  await expect(page.getByLabel('Segundos exercício 2', { exact: true })).toHaveValue('30');
  await page.screenshot({ path: info.outputPath('selecionar-exercicio.png') });
  await page.getByRole('button', { name: 'Salvar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const plan = (await (await context.request.get('/api/forja?action=teacher')).json()).plans.find((item: { name: string }) => item.name === title);
  expect(plan.exercises[0].imageUrl).toBe('/exercises/puxada-frontal.webp');
  const cleanup = await browser.newContext();
  await cleanup.request.post('http://127.0.0.1:5180/api/forja?action=login', { data: { login: 'professor', password: teacherPassword } });
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await expect(page).toHaveURL(/#login$/);
  await page.getByLabel('Usuário ou e-mail', { exact: true }).fill('henrique');
  await page.getByLabel('Senha', { exact: true }).fill(studentPassword);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/#home$/);
  const baseline = await (await context.request.get('/api/forja?action=student')).json();
  try {
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('button', { name: 'Treinos', exact: true }).click();
    await page.getByRole('button', { name: `Abrir ${title}`, exact: true }).click();
    await expect(page.locator('.exercise-card img').first()).toHaveAttribute('src', '/exercises/puxada-frontal.webp');
    await expect(page.locator('.exercise-card').last()).toContainText('30 segundos');
    await page.getByRole('button', { name: 'Executar Puxada frontal', exact: true }).click();
    const conflict = page.getByRole('button', { name: `Descartar sessão e iniciar ${title}`, exact: true });
    if (baseline.data.activeSession) await conflict.click();
    await expect(page.locator('.execution-image img')).toHaveAttribute('src', '/exercises/puxada-frontal.webp');
    await expect.poll(() => page.locator('.execution-image img').evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    await expect.poll(async () => (await (await context.request.get('/api/forja?action=student')).json()).data.activeSession?.workout.exercises[0].imageUrl).toBe('/exercises/puxada-frontal.webp');
    await page.reload();
    await expect(page.locator('.execution-image img')).toHaveAttribute('src', '/exercises/puxada-frontal.webp');
    await page.getByRole('button', { name: 'Próximo exercício', exact: true }).click();
    await expect(page.locator('.execution-image img')).toHaveAttribute('src', '/exercises/prancha.webp');
    await expect(page.getByLabel('Segundos da série atual', { exact: true })).toHaveValue('30');
    await page.screenshot({ path: info.outputPath('aluno-prancha.png') });
  } finally {
    // Let the student's debounced save finish before restoring the isolated fixture.
    await expect.poll(() => page.evaluate(() => localStorage.getItem('forja:pending:henrique'))).toBeNull();
    await page.close();
    const current = await (await context.request.get('/api/forja?action=student')).json();
    const restored = await context.request.post('/api/forja?action=student', { data: { ...baseline, revision: current.revision } });
    expect(restored.ok()).toBe(true);
    const removed = await cleanup.request.post('http://127.0.0.1:5180/api/forja?action=teacher', { data: { action: 'deletePlan', id: plan.id } });
    expect(removed.ok()).toBe(true);
    await cleanup.close();
  }
});
