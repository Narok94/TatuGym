import { test, expect, type Page } from '@playwright/test';
import { createInitialData } from '../src/data';
import { lastExerciseSets, previousDrafts } from '../src/sessionLogic';
import type { WorkoutRecord } from '../src/types';

const key='meu-treino:v1:henrique-local';
function fixture() {
  const data=createInitialData(); data.welcomed=true; data.theme='dark';
  const workout=structuredClone(data.workouts[0]);
  const older:WorkoutRecord={id:'older',workout,startedAt:'2026-10-20T12:00:00Z',finishedAt:'2026-10-20T13:00:00Z',currentExercise:0,rest:{remaining:0,endsAt:null},sets:[
    {exerciseId:workout.exercises[0].id,setIndex:0,load:45,reps:10,completedAt:'2026-10-20T12:01:00Z'},
    {exerciseId:workout.exercises[0].id,setIndex:1,load:47.5,reps:9,completedAt:'2026-10-20T12:02:00Z'},
  ]};
  const newer:WorkoutRecord={...structuredClone(older),id:'newer',finishedAt:'2026-10-27T13:00:00Z',sets:[
    {exerciseId:workout.exercises[1].id,setIndex:0,load:32,reps:12,completedAt:'2026-10-27T12:01:00Z'},
  ]};
  data.history=[newer,older]; return data;
}
async function seed(page:Page,data=fixture()) {
  await page.addInitScript(({key,data})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(data));},{key,data});
  await page.goto('/#workout/a');
}
const saved=(page:Page)=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),key);
const load=(page:Page)=>page.getByRole('spinbutton',{name:'Carga da série atual em kg',exact:true});
const reps=(page:Page)=>page.getByRole('spinbutton',{name:'Repetições da série atual',exact:true});

test('last execution fills each series and survives navigation and closing the page',async({page,context})=>{
  const data=fixture(); await seed(page,data);
  await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
  await expect(load(page)).toHaveValue('45');await expect(reps(page)).toHaveValue('10');
  await expect(page.getByText('Última execução: 10 repetições · 45 kg',{exact:true})).toBeVisible();
  expect((await saved(page)).activeSession.sets).toEqual([]);
  await page.getByRole('button',{name:'Selecionar série 2',exact:true}).click();
  await expect(load(page)).toHaveValue('47.5');await expect(reps(page)).toHaveValue('9');
  await load(page).fill('52.5');await reps(page).fill('11');
  expect((await saved(page)).activeSession.drafts['supino-reto:1']).toEqual({load:52.5,reps:11});
  await page.getByRole('button',{name:'Próximo exercício',exact:true}).click();
  await expect(load(page)).toHaveValue('32');await expect(reps(page)).toHaveValue('12');
  await page.getByRole('button',{name:'Exercício anterior',exact:true}).click();
  await page.getByRole('button',{name:'Selecionar série 2',exact:true}).click();
  await expect(load(page)).toHaveValue('52.5');
  await page.getByRole('button',{name:'Sair da execução e preservar progresso',exact:true}).click();
  await page.getByRole('button',{name:'Início',exact:true}).click();
  await page.getByRole('button',{name:'Continuar treino',exact:true}).click();
  await load(page).fill('55');
  await page.close();
  const reopened=await context.newPage();await reopened.goto('/#session');
  await expect(load(reopened)).toHaveValue('55');await expect(reps(reopened)).toHaveValue('11');
  await reopened.getByRole('button',{name:'Concluir série atual',exact:true}).click();
  await expect.poll(async()=>(await saved(reopened)).activeSession.sets[0]?.load).toBe(55);
  expect((await saved(reopened)).history).toEqual(data.history);
  await reopened.reload();expect((await saved(reopened)).activeSession.sets[0]).toMatchObject({load:55,reps:11,setIndex:1});
});

test('new workout appends records while preserving previous history and configured workouts',async({page})=>{
  const data=fixture();data.workouts[0].exercises=data.workouts[0].exercises.slice(0,1);data.workouts[0].exercises[0].sets=2;
  await seed(page,data);await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
  await load(page).fill('50');await reps(page).fill('12');
  await page.getByRole('button',{name:'Concluir série atual',exact:true}).click();
  await expect(load(page)).toHaveValue('47.5');await expect(reps(page)).toHaveValue('9');
  const confirm=page.getByRole('button',{name:'Concluir série atual',exact:true});await expect(confirm).toBeEnabled();await confirm.click();
  await expect.poll(async()=>(await saved(page)).history.length).toBe(3);
  const after=await saved(page);expect(after.activeSession).toBeNull();
  expect(after.history.slice(1)).toEqual(data.history);expect(after.workouts).toEqual(data.workouts);expect(after.meals).toEqual(data.meals);
  await page.getByRole('button',{name:'Ver meu progresso',exact:true}).click();
  await page.goto('/#workout/a');await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
  await expect(load(page)).toHaveValue('50');await expect(reps(page)).toHaveValue('12');
  expect((await saved(page)).activeSession.sets).toEqual([]);
});

test('storage failures are visible and retry latest progress when app goes to background',async({page})=>{
  await seed(page);await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
  await page.evaluate(key=>{
    const original=Storage.prototype.setItem;
    (window as any).restoreStorage=()=>Storage.prototype.setItem=original;
    Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Full','QuotaExceededError');original.call(this,k,v);};
  },key);
  await load(page).fill('60');
  await expect(page.getByRole('alert')).toContainText('Não foi possível salvar');await expect(load(page)).toHaveValue('60');
  await page.evaluate(()=>{(window as any).restoreStorage();window.dispatchEvent(new Event('pagehide'));});
  expect((await saved(page)).activeSession.drafts['supino-reto:0'].load).toBe(60);
  await page.reload();await expect(load(page)).toHaveValue('60');
});

test('history lookup uses most recent matching exercise without changing stored records',()=>{
  const data=fixture(); const original=structuredClone(data.history);const workout=data.workouts[0];
  expect(lastExerciseSets(data.history,workout.id,workout.exercises[0].id).map(s=>s.load)).toEqual([45,47.5]);
  expect(lastExerciseSets(data.history,'another-workout',workout.exercises[0].id)).toEqual([]);
  expect(previousDrafts(workout,data.history)['supino-reto:1']).toEqual({load:47.5,reps:9});
  expect(data.history).toEqual(original);
});
