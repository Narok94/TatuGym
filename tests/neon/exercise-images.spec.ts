import { test, expect } from '@playwright/test';
import { createInitialData } from '../../src/data';

for (const width of [320, 390, 1440]) {
  test(`exercise images load consistently in the list and execution at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const data = createInitialData();
    data.welcomed = true;
    const session = { role: 'ALUNO', userId: 'image-preview', login: 'image-preview', name: 'Aluno' };
    let revision = 0;
    await page.route('**/api/forja?*', route => {
      const action = new URL(route.request().url()).searchParams.get('action');
      if (action === 'session') return route.fulfill({ json: { session } });
      if (action === 'student' && route.request().method() === 'GET') {
        return route.fulfill({ json: { data, checkins: {}, revision } });
      }
      if (action === 'student' && route.request().method() === 'POST') {
        return route.fulfill({ json: { revision: ++revision } });
      }
      return route.abort();
    });
    const loaded = new Set<string>();
    for (const workout of data.workouts) {
      await page.goto(`/#workout/${workout.id}`);
      const images = page.locator('.exercise-card img');
      await expect(images).toHaveCount(workout.exercises.length);
      await expect.poll(() => images.evaluateAll(items =>
        items.every(item => (item as HTMLImageElement).naturalWidth > 0))).toBe(true);
      const sources = await images.evaluateAll(items => items.map(item => (item as HTMLImageElement).src));
      sources.forEach(source => loaded.add(source));
      await page.getByRole('button', { name: `Executar ${workout.exercises[0].name}`, exact: true }).click();
      if (workout !== data.workouts[0]) {
        await page.getByRole('button', { name: `Descartar sessão e iniciar ${workout.name}`, exact: true }).click();
      }
      for (const [index, exercise] of workout.exercises.entries()) {
        await expect(page.getByRole('heading', { name: exercise.name, exact: true })).toBeVisible();
        const image = page.locator('.execution-image img');
        await expect.poll(() => image.evaluate((item: HTMLImageElement) => item.src)).toBe(sources[index]);
        await expect.poll(() => image.evaluate((item: HTMLImageElement) => {
          const box = item.getBoundingClientRect();
          const frame = item.closest('.exercise-visual')!.getBoundingClientRect();
          return item.naturalWidth > 0 && box.width > 0 && box.height > 0
            && getComputedStyle(item).objectFit === 'contain'
            && box.left >= frame.left - 1 && box.right <= frame.right + 1
            && box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1
            && Math.abs(box.width / box.height - item.naturalWidth / item.naturalHeight) < 0.02;
        })).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (index + 1 < workout.exercises.length) {
          await page.getByRole('button', { name: 'Próximo exercício', exact: true }).click();
        }
      }
    }
    expect(loaded.size).toBe(20);
  });
}
