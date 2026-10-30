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

test('entire dashboard fits iPhone portrait screens without scrolling or overlaps', async ({ page }) => {
  for (const size of [
    { width:320, height:568, top:20, bottom:0 },
    { width:375, height:667, top:20, bottom:0 },
    { width:375, height:812, top:44, bottom:34 },
    { width:390, height:844, top:59, bottom:34 },
    { width:393, height:852, top:59, bottom:34 },
    { width:430, height:932, top:59, bottom:34 },
  ]) {
    await page.setViewportSize({width:size.width,height:size.height});
    await page.addStyleTag({content:`:root { --safe-top:${size.top}px; --safe-bottom:${size.bottom}px; }`});
    await page.evaluate(() => scrollTo(0,0));
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight), JSON.stringify(size)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const selectors=['.topbar','.page-header','.weekly-checkin','.hero-workout','.next-meal','.bottom-nav'];
    let bottom=size.top;
    for(const selector of selectors) {
      const box=(await page.locator(selector).boundingBox())!;
      expect(box.y,selector).toBeGreaterThanOrEqual(bottom - 1);
      expect(box.y+box.height,selector).toBeLessThanOrEqual(size.height + 1);
      bottom=box.y+box.height;
    }
    await expect(page.locator('.hero-workout .button')).toBeVisible();
    const meal = (await page.locator('.next-meal').boundingBox())!;
    const nav = (await page.locator('.bottom-nav').boundingBox())!;
    expect(nav.y - meal.y - meal.height, 'no unused space below cards').toBeLessThanOrEqual(13);
    const navInset = Math.min(6, size.bottom);
    expect(nav.height - navInset, 'compact navigation with reduced lower spacing').toBeLessThanOrEqual(54);
    const navButton = (await page.locator('.bottom-nav button').first().boundingBox())!;
    expect(navButton.height).toBeGreaterThanOrEqual(44);
    expect(navButton.y + navButton.height, 'menu lowered with a small bottom margin').toBeCloseTo(size.height - navInset, 0);
    const action = (await page.locator('.hero-workout .button').boundingBox())!;
    const hero = (await page.locator('.hero-workout').boundingBox())!;
    expect(action.y + action.height).toBeLessThanOrEqual(hero.y + hero.height);
    if(size.width === 390 || size.width === 320) {
      await page.screenshot({path:`test-results/dashboard-${size.width}-${test.info().project.name}.png`});
    }
    await expect.poll(() => page.locator('.checkin-plate img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  }
  await page.getByRole('button',{name:'Check-in QUI, 29/10/2026'}).click();
  await expect(page.locator('.weekly-checkin')).toContainText('1/7 dias');
  await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Supino reto',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Sair da execução e preservar progresso',exact:true}).click();
  await page.getByRole('button',{name:'Início',exact:true}).click();
  await expect(page.getByRole('button',{name:'Continuar treino',exact:true})).toBeVisible();
  await page.locator('.next-meal').click();
  await expect(page.locator('.dashboard-home')).toHaveCount(0);
});

test('dashboard header matches the workout page header', async ({page}) => {
  for(const width of [320,390]) {
    await page.setViewportSize({width,height:844});
    const metrics = () => page.locator('.topbar').evaluate(header => {
      const brand=header.querySelector('.brand')!;
      const mark=header.querySelector('.brand-mark')!;
      return {height:header.getBoundingClientRect().height,
        padding:getComputedStyle(header).paddingInline,
        font:getComputedStyle(brand).fontSize, mark:mark.getBoundingClientRect().width};
    });
    const home=await metrics();
    await page.getByRole('button',{name:'Treinos',exact:true}).click();
    expect(await metrics()).toEqual(home);
    await page.getByRole('button',{name:'Início',exact:true}).click();
  }
});

test('navigation stays flush with the viewport and identical on every mobile route', async ({page}) => {
  await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
  for(const size of [{width:320,height:568,bottom:0},{width:390,height:844,bottom:34}]) {
    await page.setViewportSize({width:size.width,height:size.height});
    await page.addStyleTag({content:`:root { --safe-bottom:${size.bottom}px; }`});
    let baseline: unknown;
    for(const route of ['home','workouts','workout/a','diet','profile','progress','session']) {
      await page.evaluate(route=>{location.hash=route;},route);
      await expect(page).toHaveURL(new RegExp(`#${route}$`));
      await expect(page.locator('.dashboard-home')).toHaveCount(route==='home'?1:0);
      const nav=page.getByRole('navigation',{name:'Navegação principal'});
      const metrics=await nav.evaluate(el=>{
        const rect=el.getBoundingClientRect();
        return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,
          paddingBottom:getComputedStyle(el).paddingBottom,
          buttons:Array.from(el.querySelectorAll('button')).map(button=>{
            const box=button.getBoundingClientRect();return {y:box.y,height:box.height};
          })};
      });
      expect(metrics.y+metrics.height).toBe(size.height);
      expect(metrics.paddingBottom).toBe(`${Math.min(6,size.bottom)}px`);
      if(baseline) expect(metrics).toEqual(baseline); else baseline=metrics;
      await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
      expect((await nav.boundingBox())!.y).toBe(metrics.y);
      await page.evaluate(()=>scrollTo(0,0));
      if(route==='home'||route==='workouts') await page.screenshot({path:`test-results/nav-${route}-${size.width}-${test.info().project.name}.png`});
    }
  }
});
