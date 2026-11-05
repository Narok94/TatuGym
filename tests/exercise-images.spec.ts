import { test, expect } from '@playwright/test';
import { createInitialData } from '../src/data';

for (const width of [390, 1440]) {
  for (const workout of createInitialData().workouts) {
    test(`ABC images ${workout.id} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const data = createInitialData(); data.welcomed = true;
      await page.addInitScript(data => {
        localStorage.setItem('meu-treino:v1:henrique-local', JSON.stringify(data));
        sessionStorage.setItem('tatugym:dev:teacher-session:v1', JSON.stringify({ role: 'ALUNO', userId: data.user.id, login: 'henrique' }));
      }, data);
      await page.goto('/');
      await page.clock.install();
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      await page.getByRole('button', { name: 'Treinos', exact: true }).click();
      await page.getByRole('button', { name: `Abrir ${workout.name}`, exact: true }).click();
      const cards = page.locator('.exercise-card img');
      await expect(cards).toHaveCount(workout.exercises.length);
      await expect.poll(() => cards.evaluateAll(images => images.every(image => {
        const img = image as HTMLImageElement;
        return img.naturalWidth > 0 && img.src.endsWith('_inicial.png');
      }))).toBe(true);
      const initialSources = await cards.evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
      await page.getByRole('button', { name: `Executar ${workout.exercises[0].name}`, exact: true }).click();
      for (const [index, exercise] of workout.exercises.entries()) {
        const image = page.locator('.execution-image img');
        await expect(page.getByRole('heading', { name: exercise.name, exact: true })).toBeVisible();
        await expect(image).toHaveAttribute('src', /_inicial\.png$/);
        expect(await image.evaluate((img: HTMLImageElement) => img.src)).toBe(initialSources[index]);
        await page.clock.runFor(1999);
        await expect(image).toHaveAttribute('src', /_inicial\.png$/);
        await page.clock.runFor(1);
        await expect(image).toHaveAttribute('src', /_final\.png$/);
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth > 0)).toBe(true);
        await page.clock.runFor(2000);
        await expect(image).toHaveAttribute('src', /_inicial\.png$/);
        const toggle = page.getByRole('button', { name: `Alternar posição do exercício ${exercise.name}`, exact: true });
        await toggle.click();
        await expect(image).toHaveAttribute('src', /_final\.png$/);
        await toggle.press('Enter');
        await expect(image).toHaveAttribute('src', /_inicial\.png$/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (index < workout.exercises.length - 1) await page.getByRole('button', { name: 'Próximo exercício', exact: true }).click();
      }
    });
  }
}
