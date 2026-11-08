import { expect, test } from '@playwright/test';
import { createInitialData } from '../../src/data';

test('home workout progress follows saved sets and continues the same session', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-07T15:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-07T15:00:01Z'));
  let data = createInitialData();
  data.welcomed = true;
  data.theme = 'dark';
  const workout = data.workouts[1];
  const startedAt = '2026-11-07T14:35:00Z';
  data.activeSession = {
    id: 'home-progress', workout, startedAt, currentExercise: 0,
    sets: [0, 1, 2].map(setIndex => ({
      exerciseId: workout.exercises[0].id, setIndex, reps: 10, load: 40, completedAt: startedAt,
    })), rest: { remaining: 0, endsAt: null },
  };
  let revision = 0;
  const session = { role: 'ALUNO', userId: 'home-progress', login: 'home-progress', name: 'Aluno' };
  await page.route('**/api/forja?*', route => {
    const action = new URL(route.request().url()).searchParams.get('action');
    if (action === 'session') return route.fulfill({ json: { session } });
    if (action === 'student') {
      if (route.request().method() === 'POST') {
        data = route.request().postDataJSON().data;
        return route.fulfill({ json: { revision: ++revision } });
      }
      return route.fulfill({ json: { data, checkins: {}, revision } });
    }
    return route.abort();
  });
  await page.goto('/#home');
  const card = page.getByRole('region', { name: 'Destaque Treino B', exact: true });
  await expect(card.getByLabel('Tempo de treino decorrido', { exact: true })).toHaveText('00:25:01');
  await expect(card.getByRole('progressbar', { name: 'Séries concluídas' })).toHaveAttribute('value', '3');
  await expect(card.getByRole('progressbar', { name: 'Séries concluídas' })).toHaveAttribute('max', '19');
  await card.getByRole('button', { name: 'Continuar treino', exact: true }).click();
  await expect(page.getByRole('heading', { name: workout.exercises[0].name, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Concluir série atual', exact: true }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Início', exact: true }).click();
  await expect(card.getByRole('progressbar', { name: 'Séries concluídas' })).toHaveAttribute('value', '4');
  await expect.poll(() => data.activeSession?.sets.length).toBe(4);
  await page.reload();
  await expect(card.getByRole('progressbar', { name: 'Séries concluídas' })).toHaveAttribute('value', '4');
  expect(data.activeSession?.startedAt).toBe(startedAt);
  expect(data.workouts[1].exercises).toHaveLength(6);
});
