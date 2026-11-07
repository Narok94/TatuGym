import { test,expect,type Page } from '@playwright/test';
import { createInitialData } from '../../src/data';
const studentKey='meu-treino:v1:henrique-local';
const teacherKey='tatugym:dev:teacher-workspace:v1';
const studentPassword=process.env.FORJA_SEED_STUDENT_PASSWORD!;
const teacherPassword=process.env.FORJA_SEED_TEACHER_PASSWORD!;
const teacher2Password=process.env.FORJA_SEED_TEACHER2_PASSWORD!;
async function login(page:Page,login:string,password:string) {
  await page.getByLabel('Usuário ou e-mail',{exact:true}).fill(login);
  await page.getByLabel('Senha',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
}
test('real Neon: migration, persistence, guards, logout and teacher isolation',async({page,context,browser},info)=>{
  // Each browser project uses the same original, exercising idempotent migration across devices.
  const data=createInitialData();data.welcomed=true;data.theme='dark';data.workouts[0].name='Treino preservado — importação';
  data.workouts[0].exercises[0].load=47;
  data.weights=[{id:'existing-weight',date:'2026-11-01',value:80}];
  const legacy={version:1,profiles:{},students:[],plans:[],assessments:[],library:[],activities:[]};
  await page.addInitScript(({studentKey,teacherKey,data,legacy})=>{
    if(!localStorage.getItem(studentKey)) localStorage.setItem(studentKey,JSON.stringify(data));
    if(!localStorage.getItem(`${studentKey}:weekly-checkins`)) localStorage.setItem(`${studentKey}:weekly-checkins`,JSON.stringify({'2026-11-02':true}));
    if(!localStorage.getItem(teacherKey)) localStorage.setItem(teacherKey,JSON.stringify(legacy));
    sessionStorage.setItem('tatugym:dev:teacher-session:v1',JSON.stringify({role:'PROFESSOR',teacherId:'teacher-demo-1'}));
  },{studentKey,teacherKey,data,legacy});
  await page.goto('/#professor/dashboard');await expect(page).toHaveURL(/#login$/);
  await login(page,'henrique','invalid');await expect(page.getByRole('alert')).toContainText('inválidos');
  await login(page,'henrique',studentPassword);await expect(page).toHaveURL(/#home$/);
  await expect(page.getByRole('heading',{name:'Treino preservado — importação'})).toBeVisible();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),studentKey)).toEqual(data);
  const cookie=(await context.cookies()).find(x=>x.name==='forja_session');expect(cookie?.httpOnly).toBe(true);
  // WebKit's automation cookie API can report None on plain HTTP localhost.
  const cookieResponse=await context.request.post('/api/forja?action=login',{data:{login:'henrique',password:studentPassword}});
  expect(cookieResponse.headers()['set-cookie']).toContain('SameSite=Lax');
  const before=await (await context.request.get('/api/forja?action=student')).json();
  expect(before.data.workouts[0].exercises[0].load).toBe(47);
  expect((await context.request.get('/api/forja?action=teacher')).status()).toBe(403);
  await page.reload();await expect(page.getByRole('heading',{name:'Treino preservado — importação'})).toBeVisible();
  const again=await (await context.request.post('/api/forja?action=import-student',{data:{data,checkins:{'2026-11-02':true}}})).json();expect(again.imported).toBe(true);
  expect((await (await context.request.get('/api/forja?action=student')).json()).revision).toBe(before.revision);
  const cross=await context.request.post('/api/forja?action=student',{headers:{Origin:'https://foreign.example'},data:before});expect(cross.status()).toBe(403);
  // Toggle a real UI control and wait for its server acknowledgement before reload.
  await page.getByRole('button',{name:/Check-in SEG/}).click();
  await expect.poll(async()=>Object.keys((await (await context.request.get('/api/forja?action=student')).json()).checkins).length).toBe(0);
  await page.reload();await expect(page.getByRole('button',{name:/Check-in SEG/})).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:/Check-in SEG/}).click();
  await expect.poll(async()=>Object.keys((await (await context.request.get('/api/forja?action=student')).json()).checkins).length).toBe(1);
  const current=await (await context.request.get('/api/forja?action=student')).json();
  expect((await context.request.post('/api/forja?action=student',{data:{...current,revision:current.revision-1}})).status()).toBe(409);
  await page.getByRole('button',{name:'Sair da conta',exact:true}).click();await expect(page).toHaveURL(/#login$/);
  expect((await context.request.get('/api/forja?action=student')).status()).toBe(401);
  await page.goto('/#home');await expect(page).toHaveURL(/#login$/);await expect(page.locator('.app-shell')).toHaveCount(0);
  await login(page,'professor',teacherPassword);await expect(page).toHaveURL(/#professor\/dashboard$/);
  await expect(page.getByRole('heading',{name:'Olá, Professor FORJA.'})).toBeVisible();
  expect((await context.request.get('/api/forja?action=student')).status()).toBe(403);
  const other=await browser.newContext();
  await other.request.post('http://127.0.0.1:5180/api/forja?action=login',{data:{login:'professor2',password:teacher2Password}});
  const otherData=await (await other.request.get('http://127.0.0.1:5180/api/forja?action=teacher')).json();expect(otherData.students).toHaveLength(0);
  const own=await (await context.request.get('/api/forja?action=teacher')).json();
  const forbidden=await other.request.post('http://127.0.0.1:5180/api/forja?action=teacher',{data:{action:'saveStudent',id:own.students[0].id,input:own.students[0]}});expect(forbidden.status()).toBe(403);
  const title=`Plano persistido ${info.project.name}`;
  await page.evaluate(()=>{location.hash='professor/treinos';});
  await page.getByRole('button',{name:'Criar treino',exact:true}).click();
  await page.getByLabel('Nome do treino',{exact:true}).fill(title);
  await page.getByRole('combobox',{name:'Aluno responsável',exact:true}).selectOption(own.students[0].id);
  await page.getByRole('combobox',{name:'Situação do treino',exact:true}).selectOption('ATIVO');
  await page.getByLabel('Nome exercício 1',{exact:true}).fill('Supino');
  await page.getByRole('button',{name:'Salvar',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const savedPlan=(await (await context.request.get('/api/forja?action=teacher')).json()).plans.find((p:{name:string})=>p.name===title);
  expect(savedPlan).toBeTruthy();const savedId=savedPlan.id;
  expect((await other.request.post('http://127.0.0.1:5180/api/forja?action=teacher',{data:{action:'deletePlan',id:savedId}})).status()).toBe(403);
  await page.reload();await expect(page.getByText(title,{exact:true})).toBeVisible();
  expect((await (await context.request.get('/api/forja?action=teacher')).json()).plans.some((p:{name:string})=>p.name===title)).toBe(true);
  await page.getByRole('button',{name:'Sair da conta',exact:true}).click();await expect(page).toHaveURL(/#login$/);
  await login(page,'henrique',studentPassword);await expect(page).toHaveURL(/#home$/);
  await page.goto('/#workouts');await expect(page.getByRole('button',{name:`Abrir ${title}`,exact:true})).toBeVisible();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),studentKey)).toEqual(data);
  await other.close();
});

test('real workout: sets and offline drafts persist without changing the legacy backup',async({page,context})=>{
  await page.goto('/#login');await login(page,'henrique',studentPassword);
  await expect(page).toHaveURL(/#home$/);
  const baseline=await (await context.request.get('/api/forja?action=student')).json();
  await page.evaluate(()=>{location.hash='workout/a';});
  await page.getByRole('button',{name:'Iniciar treino',exact:true}).click();
  const load=page.getByRole('spinbutton',{name:'Carga da série atual em kg',exact:true});
  const reps=page.getByRole('spinbutton',{name:'Repetições da série atual',exact:true});
  await load.fill('52.5');await reps.fill('11');
  await page.getByRole('button',{name:'Concluir série atual',exact:true}).click();
  await expect.poll(async()=>(await (await context.request.get('/api/forja?action=student')).json()).data.activeSession?.sets[0]?.load).toBe(52.5);
  await page.reload();await expect(load).toBeVisible();
  await context.setOffline(true);
  await load.fill('57.5');await reps.fill('9');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('forja:pending:henrique')!).data.activeSession.drafts['supino-reto:1'].load)).toBe(57.5);
  await context.setOffline(false);
  await expect.poll(async()=>(await (await context.request.get('/api/forja?action=student')).json()).data.activeSession?.drafts?.['supino-reto:1']?.load).toBe(57.5);
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('forja:pending:henrique'))).toBeNull();
  await page.reload();await expect(load).toHaveValue('57.5');await expect(reps).toHaveValue('9');
  const after=await (await context.request.get('/api/forja?action=student')).json();
  expect(after.data.history).toEqual(baseline.data.history);
  expect(after.data.workouts).toEqual(baseline.data.workouts);
  // Restore only the fixtures in the isolated test schema for the next browser project.
  const restored=await context.request.post('/api/forja?action=student',{data:{...baseline,revision:after.revision}});expect(restored.status()).toBe(200);
  await page.evaluate(()=>{location.hash='profile';});
  await page.getByRole('button',{name:'Sair da conta',exact:true}).click();await expect(page).toHaveURL(/#login$/);
});
