import { test, expect } from '@playwright/test';
import { createInitialData } from '../src/data';

for (const width of [320, 390, 1440]) {
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
      const cardHeight = await page.locator('.exercise-card').first().evaluate(card => card.getBoundingClientRect().height);
      expect(cardHeight).toBeGreaterThanOrEqual(width <= 760 ? 112 : 128);
      expect(cardHeight).toBeLessThanOrEqual(width <= 760 ? 116 : 132);
      const cards = page.locator('.exercise-card img');
      await expect(cards).toHaveCount(workout.exercises.length);
      await expect.poll(() => cards.evaluateAll(images => images.every(image => {
        const img = image as HTMLImageElement;
        return img.naturalWidth > 0 && new URL(img.src).pathname.endsWith('_inicial.png');
      }))).toBe(true);
      await expect.poll(() => cards.evaluateAll(images => images.every(image => {
        const img = image as HTMLImageElement, box = img.getBoundingClientRect();
        const container = img.parentElement!.getBoundingClientRect();
        return getComputedStyle(img).objectFit === 'contain' && box.width <= img.naturalWidth + 1 &&
          box.height <= img.naturalHeight + 1 && box.left >= container.left - 1 && box.right <= container.right + 1 &&
          box.top >= container.top - 1 && box.bottom <= container.bottom + 1 &&
          Math.abs(box.width / box.height - img.naturalWidth / img.naturalHeight) < .02;
      }))).toBe(true);
      await page.screenshot({ path: `test-results/abc-${workout.id}-${width}-list.png`, fullPage: true });
      const initialSources = await cards.evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
      await page.getByRole('button', { name: `Executar ${workout.exercises[0].name}`, exact: true }).click();
      for (const [index, exercise] of workout.exercises.entries()) {
        const image = page.locator('.execution-image img');
        await expect(page.getByRole('heading', { name: exercise.name, exact: true })).toBeVisible();
        await expect(image).toHaveAttribute('src', /_inicial\.png(?:\?.*)?$/);
        expect(await image.evaluate((img: HTMLImageElement) => img.src)).toBe(initialSources[index]);
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => {
          const box = img.getBoundingClientRect(), container = img.closest('.exercise-visual')!.getBoundingClientRect();
          return getComputedStyle(img).objectFit === 'contain' && box.width <= img.naturalWidth + 1 &&
            box.height <= img.naturalHeight + 1 && box.left >= container.left + 47 && box.right <= container.right - 47 &&
            box.top >= container.top - 1 && box.bottom <= container.bottom + 1 &&
            Math.abs(box.width / box.height - img.naturalWidth / img.naturalHeight) < .02;
        })).toBe(true);
        await page.locator('.execution-art').screenshot({ path: `test-results/abc-${exercise.id}-${width}-initial.png` });
        if (index === 0) await page.screenshot({ path: `test-results/abc-${workout.id}-${width}-execution.png`, fullPage: true });
        await page.clock.runFor(1999);
        await expect(image).toHaveAttribute('src', /_inicial\.png(?:\?.*)?$/);
        await page.clock.runFor(1);
        await expect(image).toHaveAttribute('src', /_final\.png(?:\?.*)?$/);
        await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth > 0)).toBe(true);
        await page.locator('.execution-art').screenshot({ path: `test-results/abc-${exercise.id}-${width}-final.png` });
        await page.clock.runFor(2000);
        await expect(image).toHaveAttribute('src', /_inicial\.png(?:\?.*)?$/);
        const toggle = page.getByRole('button', { name: `Alternar posição do exercício ${exercise.name}`, exact: true });
        await toggle.click();
        await expect(image).toHaveAttribute('src', /_final\.png(?:\?.*)?$/);
        await page.getByRole('button', { name: 'Posição anterior do movimento', exact: true }).click();
        await expect(image).toHaveAttribute('src', /_inicial\.png(?:\?.*)?$/);
        await page.getByRole('button', { name: 'Próxima posição do movimento', exact: true }).click();
        await expect(image).toHaveAttribute('src', /_final\.png(?:\?.*)?$/);
        await toggle.press('ArrowRight');
        await expect(image).toHaveAttribute('src', /_inicial\.png(?:\?.*)?$/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (index < workout.exercises.length - 1) await page.getByRole('button', { name: 'Próximo exercício', exact: true }).click();
      }
    });
  }
}
