import { test, expect, type Page } from '@playwright/test';
import { createInitialData } from '../src/data';
import type { Session } from '../src/types';
import { completeSet, emptyRest, isComplete, nextSet, selectExercise } from '../src/sessionLogic';
const key = 'meu-treino:v1:henrique-local';
async function setup(page: Page) {
  const data = createInitialData(); data.welcomed = true; data.theme = 'dark';
  await page.addInitScript(({key, data}) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(data)); }, {key, data});
  await page.goto('/');
}
async function saved(page: Page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key); }
async function start(page: Page) { await page.getByRole('button', {name: 'Iniciar treino', exact: true}).click(); await expect(page.getByRole('heading', {name: 'Supino reto', exact:true})).toBeVisible(); }
async function confirm(page: Page) { const button = page.getByRole('button', {name:'Concluir série atual', exact:true}); await expect(button).toBeEnabled(); await button.click(); }

test('dashboard, image-only cards, details and responsive layout', async ({page}) => {
  await setup(page);
  await expect(page.getByText('Acesso rápido')).toHaveCount(0);
  await expect(page.getByText('Seu progresso hoje')).toHaveCount(0);
  await expect(page.locator('.greeting-icon')).toHaveCount(0);
  await expect(page.locator('.next-meal')).toBeVisible();
  await page.getByRole('button', {name:'Treinos',exact:true}).click();
  await expect(page.locator('.asset-workout-card')).toHaveCount(3);
  await expect(page.locator('.workout-card-content')).toHaveCount(0);
  for (const name of ['A','B','C']) {
    await page.getByRole('button',{name:`Abrir Treino ${name}`,exact:true}).click();
    const expected = name === 'B' ? 6 : 7;
    await expect(page.locator('.exercise-card img')).toHaveCount(expected);
    await expect.poll(() => page.locator('.exercise-card img').evaluateAll(imgs => imgs.every(i => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await expect(page.getByText('Força que vem de dentro.')).toHaveCount(0);
    await expect(page.locator('.detail-art')).toHaveCSS('height', '155px');
    await page.getByRole('button',{name:'Voltar',exact:true}).click();
  }
  for (const width of [320,375,390,430,1024]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('load and reps can be cleared and typed without a leading zero', async ({page}) => {
  await setup(page); await start(page);
  const load = page.getByRole('spinbutton', {name:'Carga da série atual em kg', exact:true});
  const reps = page.getByRole('spinbutton', {name:'Repetições da série atual', exact:true});
  const complete = page.getByRole('button', {name:'Concluir série atual', exact:true});
  await load.fill('0'); await load.blur(); await load.focus();
  await expect(load).toHaveValue(''); await expect(complete).toBeDisabled();
  await load.pressSequentially('30'); await expect(load).toHaveValue('30');
  await load.fill(''); await expect(load).toHaveValue('');
  await expect(complete).toBeDisabled();
  expect(Object.values((await saved(page)).activeSession.drafts)[0]).toMatchObject({load:30});
  await load.blur(); await expect(load).toHaveValue('30');
  await load.fill(''); await load.pressSequentially('32.5');
  await reps.fill(''); await expect(reps).toHaveValue(''); await expect(complete).toBeDisabled();
  await reps.pressSequentially('12'); await expect(reps).toHaveValue('12');
  await confirm(page);
  expect((await saved(page)).activeSession.sets[0]).toMatchObject({load:32.5,reps:12});
  await page.reload();
  expect((await saved(page)).activeSession.sets[0]).toMatchObject({load:32.5,reps:12});
});

test('series edits, double taps, rest pause/resume/skip, navigation and reload', async ({page}) => {
  await setup(page); await start(page);
  await expect(page.getByRole('timer')).toContainText('00:00');
  await expect(page.getByRole('button',{name:'Retomar descanso',exact:true})).toBeDisabled();
  await page.getByRole('spinbutton',{name:'Repetições da série atual',exact:true}).fill('11');
  await page.getByRole('spinbutton',{name:'Carga da série atual em kg',exact:true}).fill('42.5');
  await page.getByRole('button',{name:'Concluir série atual',exact:true}).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); b.click(); });
  await expect(page.getByText('Série 2 de 4', {exact:true})).toBeVisible();
  expect((await saved(page)).activeSession.sets).toHaveLength(1);
  expect((await saved(page)).activeSession.sets[0]).toMatchObject({reps:11,load:42.5,setIndex:0});
  await page.getByRole('button',{name:'Pausar descanso',exact:true}).click();
  const paused = await page.getByRole('timer').innerText();
  await page.waitForTimeout(1100); expect(await page.getByRole('timer').innerText()).toBe(paused);
  await page.getByRole('button',{name:'Retomar descanso',exact:true}).click();
  await page.getByRole('button',{name:'Pular descanso',exact:true}).click();
  await expect(page.getByRole('timer')).toContainText('00:00');
  await page.getByRole('spinbutton',{name:'Carga da série atual em kg',exact:true}).fill('45');
  await page.getByRole('button',{name:'Lista de exercícios',exact:true}).click();
  await page.getByRole('button',{name:/^Crucifixo/}).click();
  await expect(page.getByText('Série 1 de 3',{exact:true})).toBeVisible();
  await confirm(page);
  await page.getByRole('button',{name:'Lista de exercícios',exact:true}).click();
  await page.getByRole('button',{name:/^Supino reto/}).click();
  await expect(page.getByText('Série 2 de 4',{exact:true})).toBeVisible();
  await expect(page.getByRole('spinbutton',{name:'Carga da série atual em kg',exact:true})).toHaveValue('45');
  await page.reload();
  await expect(page.getByText('Série 2 de 4',{exact:true})).toBeVisible();
  await expect(page.getByRole('spinbutton',{name:'Carga da série atual em kg',exact:true})).toHaveValue('45');
  await page.getByRole('button',{name:'Sair da execução e preservar progresso',exact:true}).click();
  await page.getByRole('button',{name:'Início',exact:true}).click();
  await page.getByRole('button',{name:'Continuar treino',exact:true}).click();
  expect((await saved(page)).activeSession.sets).toHaveLength(2);
  await page.screenshot({path:`docs/execution-${test.info().project.name}.png`});
});

test('rest expires with visual, audio and vibration signals; no meal notifications', async ({page}) => {
  await setup(page);
  await page.evaluate(key => { const d=JSON.parse(localStorage.getItem(key)!); d.workouts[0].exercises[0].rest=2; localStorage.setItem(key,JSON.stringify(d)); },key);
  await page.reload();
  await page.evaluate(() => {
    (window as any).signals = {sound:0,vibration:0};
    Object.defineProperty(navigator,'vibrate',{value:()=>{ (window as any).signals.vibration++; return true; }, configurable:true});
    const Audio = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Audio) return;
    const old = Audio.prototype.createOscillator;
    Audio.prototype.createOscillator = function() { (window as any).signals.sound++; return old.call(this); };
  });
  await start(page); await confirm(page);
  await expect(page.getByRole('status')).toContainText('Descanso concluído', {timeout:6000});
  await expect(page.getByRole('timer')).toContainText('00:00');
  const signals = await page.evaluate(() => (window as any).signals);
  expect(signals.vibration).toBe(1); if (await page.evaluate(() => !!(window.AudioContext ?? (window as any).webkitAudioContext))) expect(signals.sound).toBe(1);
  await page.waitForTimeout(1100);
  expect(await page.evaluate(() => (window as any).signals.vibration)).toBe(1);
});

test('complete an entire real workout and preserve history/profile/meals', async ({page}) => {
  await setup(page); const before = await saved(page); await start(page);
  for (const exercise of before.workouts[0].exercises) {
    await expect(page.getByRole('heading',{name:exercise.name,exact:true})).toBeVisible();
    await expect(page.getByRole('timer')).toContainText('00:00');
    for (let i=0;i<exercise.sets;i++) { await expect(page.getByText(`Série ${i+1} de ${exercise.sets}`,{exact:true})).toBeVisible(); await confirm(page); }
  }
  await expect(page.getByText('Treino A registrado.',{exact:true})).toBeVisible();
  const after=await saved(page);
  expect(after.activeSession).toBeNull(); expect(after.history).toHaveLength(1);
  expect(after.history[0].sets).toHaveLength(22);
  expect(new Set(after.history[0].sets.map((s:any)=>s.exerciseId+':'+s.setIndex)).size).toBe(22);
  expect(after.workouts).toEqual(before.workouts); expect(after.meals).toEqual(before.meals); expect(after.user).toEqual(before.user);
  await page.reload(); expect((await saved(page)).history).toHaveLength(1);
});

test('session transitions reject duplicates and handle out-of-order completion', () => {
  const workout = createInitialData().workouts[0];
  const s: Session = {id:'test',workout,startedAt:new Date().toISOString(),currentExercise:0,sets:[],rest:emptyRest()};
  let state = completeSet(s, workout.exercises[0].id, 0, 42.5, 10, 1000);
  expect(completeSet(state,workout.exercises[0].id,0,100,1)).toBe(state);
  expect(completeSet(state,workout.exercises[0].id,1,-1,10)).toBe(state);
  expect(completeSet(state,workout.exercises[0].id,1,40,1.5)).toBe(state);
  expect(selectExercise(state,-1)).toBe(state);
  state=selectExercise(state,workout.exercises.length-1);
  for(let n=0;n<workout.exercises.length;n++) {
    const e=state.workout.exercises[state.currentExercise];
    for(let i=nextSet(state);i!==undefined;i=nextSet(state)) {
      state=completeSet(state,e.id,i,e.load,10);
      if(state.currentExercise!==workout.exercises.indexOf(e)) break;
    }
  }
  expect(isComplete(state)).toBe(true); expect(state.sets).toHaveLength(22);
  expect(state.rest).toEqual(emptyRest());
});


test('safe top inset and execution controls stay visible on small mobile screens', async ({page}) => {
  await setup(page);
  await page.addStyleTag({content: ':root { --safe-top: 59px; }'});
  expect((await page.locator('.topbar').boundingBox())!.y).toBeGreaterThanOrEqual(59);
  await start(page);
  for (const size of [{width:320,height:568},{width:375,height:667},{width:390,height:844}]) {
    await page.setViewportSize(size);
    await page.evaluate(() => scrollTo(0,0));
    const controls = (await page.locator('.execution-controls').boundingBox())!;
    const nav = (await page.locator('.bottom-nav').boundingBox())!;
    expect(controls.y + controls.height).toBeLessThanOrEqual(nav.y);
    expect((await page.locator('.execution-header').boundingBox())!.y).toBeGreaterThanOrEqual(59);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
