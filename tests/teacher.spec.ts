import { test, expect, type Page } from '@playwright/test';
import { createInitialData } from '../src/data';

const studentKey='meu-treino:v1:henrique-local';
async function login(page:Page, user='professor') {
  await page.goto('/#professor');
  await page.getByLabel('Usuário',{exact:true}).fill(user);
  await page.getByLabel('Senha',{exact:true}).fill('123');
  await page.getByRole('button',{name:'Entrar como professor',exact:true}).click();
  await expect(page.getByRole('heading',{name:/Olá,/})).toBeVisible();
}
async function navigate(page:Page,label:string) {
  if(await page.getByRole('button',{name:'Abrir menu',exact:true}).isVisible()) await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
  await page.getByRole('navigation',{name:'Menu do professor'}).getByRole('link',{name:label,exact:true}).click();
}
async function student(page:Page,name='Marina Teste',email='marina@example.test') {
  await navigate(page,'Alunos');await page.getByRole('button',{name:'Cadastrar aluno',exact:true}).click();
  await page.getByLabel('Nome completo',{exact:true}).fill(name);await page.getByLabel('E-mail do aluno',{exact:true}).fill(email);
  await page.getByLabel('Objetivo',{exact:true}).fill('Condicionamento');await page.getByRole('button',{name:'Salvar',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}

test('development teacher login, dashboard, logout and student data preservation',async({page})=>{
  const data=createInitialData();data.welcomed=true;
  await page.addInitScript(({key,data})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(data));},{key:studentKey,data});
  await page.goto('/#professor');
  await page.getByLabel('Usuário',{exact:true}).fill('professor');await page.getByLabel('Senha',{exact:true}).fill('wrong');
  await page.getByRole('button',{name:'Entrar como professor',exact:true}).click();await expect(page.getByRole('alert')).toContainText('inválidos');
  await page.getByLabel('Senha',{exact:true}).fill('123');await page.getByRole('button',{name:'Entrar como professor',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Olá, Professor TatuGym.'})).toBeVisible();
  await expect(page.locator('.teacher-stat strong')).toHaveText(['0','0','0','0']);
  await page.reload();await expect(page.getByRole('heading',{name:'Olá, Professor TatuGym.'})).toBeVisible();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),studentKey)).toEqual(data);
  await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
  await page.getByRole('button',{name:'Ambiente do aluno',exact:true}).click();
  await expect(page.getByRole('button',{name:'Iniciar treino',exact:true})).toBeVisible();
  await page.goto('/#professor');await expect(page.getByRole('button',{name:'Entrar como professor',exact:true})).toBeVisible();
});

test('development demo dashboard derives its indicators from local records',async({page})=>{
  await login(page);await page.getByRole('button',{name:'Carregar demonstração',exact:true}).click();
  await expect(page.locator('.teacher-stat strong')).toHaveText(['2','0','3','0']);
  await expect(page.getByRole('img',{name:/Avaliações nos últimos seis meses/})).toBeVisible();
  await page.reload();await expect(page.locator('.teacher-stat strong')).toHaveText(['2','0','3','0']);
});

test('teacher student CRUD and ownership separation',async({page})=>{
  await login(page);await student(page);
  await page.reload();await expect(page.getByText('Marina Teste',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Editar Marina Teste',exact:true}).click();await page.getByLabel('Nome completo',{exact:true}).fill('Marina Atualizada');
  await page.getByRole('button',{name:'Salvar',exact:true}).click();await expect(page.getByText('Marina Atualizada',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Abrir menu',exact:true}).click();await page.getByRole('button',{name:'Sair',exact:true}).click();
  await login(page,'professor2');await navigate(page,'Alunos');await expect(page.getByText('Marina Atualizada',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Cadastrar aluno',exact:true}).click();await page.getByLabel('Nome completo',{exact:true}).fill('Outro vínculo');await page.getByLabel('E-mail do aluno',{exact:true}).fill('marina@example.test');
  await page.getByRole('button',{name:'Salvar',exact:true}).click();await expect(page.getByRole('alert')).toContainText('já possui');await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  const denied=await page.evaluate(async()=>{
    const module=await import('/src/teacher/repository.ts');const repo=module.createTeacherRepository('teacher-demo-2');
    const db=JSON.parse(localStorage.getItem(module.TEACHER_STORAGE_KEY)!);try{repo.deleteStudent(db.students[0].id);return false;}catch{return true;}
  });expect(denied).toBe(true);
  await student(page,'Outro aluno','outro@example.test');
  await page.getByRole('button',{name:'Excluir Outro aluno',exact:true}).click();await page.getByRole('button',{name:'Confirmar exclusão',exact:true}).click();await expect(page.getByText('Outro aluno',{exact:true})).toHaveCount(0);
});

test('teacher workout creation, exercise ordering, editing and duplication',async({page})=>{
  await login(page);await student(page);await navigate(page,'Treinos');await page.getByRole('button',{name:'Criar treino',exact:true}).click();
  await page.getByLabel('Nome do treino',{exact:true}).fill('Plano funcional');await page.getByRole('combobox',{name:'Aluno responsável',exact:true}).selectOption({label:'Marina Teste'});
  await page.getByLabel('Nome exercício 1',{exact:true}).fill('Agachamento');await page.getByLabel('Grupo muscular exercício 1',{exact:true}).fill('Pernas');
  await page.getByRole('button',{name:'Adicionar exercício',exact:true}).click();await page.getByLabel('Nome exercício 2',{exact:true}).fill('Remada');
  await page.getByRole('button',{name:'Subir exercício 2',exact:true}).click();await expect(page.getByLabel('Nome exercício 1',{exact:true})).toHaveValue('Remada');
  await page.getByRole('button',{name:'Salvar',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();await page.getByRole('button',{name:'Editar Plano funcional',exact:true}).click();await expect(page.getByLabel('Nome exercício 1',{exact:true})).toHaveValue('Remada');
  await page.getByRole('combobox',{name:'Situação do treino',exact:true}).selectOption('ATIVO');await page.getByRole('button',{name:'Salvar',exact:true}).click();
  await page.getByRole('button',{name:'Duplicar Plano funcional',exact:true}).click();await expect(page.getByText('Plano funcional (cópia)',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Excluir Plano funcional (cópia)',exact:true}).click();await page.getByRole('button',{name:'Confirmar exclusão',exact:true}).click();
  await expect(page.getByText('Plano funcional (cópia)',{exact:true})).toHaveCount(0);
});

test('teacher assessment CRUD and evolution charts reflect saved measurements',async({page})=>{
  await login(page);await student(page);await navigate(page,'Avaliações físicas');
  for(const [date,weight] of [['2026-01-01','80'],['2026-02-01','78']]) {
    await page.getByRole('button',{name:'Registrar avaliação',exact:true}).click();await page.getByLabel('Data da avaliação',{exact:true}).fill(date);
    await page.getByLabel('Peso (kg)',{exact:true}).fill(weight);await page.getByLabel('Altura (cm)',{exact:true}).fill('175');
    await page.getByLabel('Cintura (cm)',{exact:true}).fill('85');await page.getByRole('button',{name:'Salvar',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await navigate(page,'Evolução');await expect(page.getByRole('img',{name:/Evolução de peso de Marina Teste/})).toBeVisible();await expect(page.getByText('-2 kg',{exact:true})).toBeVisible();
  await navigate(page,'Avaliações físicas');await page.getByRole('button',{name:'Editar avaliação de Marina Teste em 01/02/2026',exact:true}).click();await page.getByLabel('Peso (kg)',{exact:true}).fill('79');await page.getByRole('button',{name:'Salvar',exact:true}).click();
  await page.reload();await expect(page.getByText('79 kg',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Excluir avaliação de Marina Teste em 01/02/2026',exact:true}).click();await page.getByRole('button',{name:'Confirmar exclusão',exact:true}).click();
  await expect(page.getByText('79 kg',{exact:true})).toHaveCount(0);await expect(page.getByText('80 kg',{exact:true})).toBeVisible();
});

test('teacher exercise library starts empty and supports CRUD and workout reuse',async({page})=>{
  await login(page);await navigate(page,'Biblioteca de exercícios');await expect(page.getByText(/Nenhum exercício cadastrado/)).toBeVisible();
  await page.getByRole('button',{name:'Cadastrar exercício',exact:true}).click();await page.getByLabel('Nome do exercício',{exact:true}).fill('Remada com halter');await page.getByLabel('Grupo muscular',{exact:true}).fill('Costas');
  await page.getByLabel('Instruções do movimento',{exact:true}).fill('Manter a coluna alinhada.');await page.getByRole('button',{name:'Salvar',exact:true}).click();
  await expect(page.getByText('Imagem real pendente',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Editar Remada com halter',exact:true}).click();await page.getByLabel('Equipamento',{exact:true}).fill('Halter');await page.getByRole('button',{name:'Salvar',exact:true}).click();
  await page.reload();await expect(page.getByText('Halter',{exact:true})).toBeVisible();
  await navigate(page,'Treinos');await page.getByRole('button',{name:'Criar treino',exact:true}).click();await page.getByLabel('Nome do treino',{exact:true}).fill('Plano biblioteca');
  await page.getByRole('combobox',{name:'Biblioteca para exercício 1',exact:true}).selectOption({label:'Remada com halter'});
  await expect(page.getByLabel('Nome exercício 1',{exact:true})).toHaveValue('Remada com halter');await page.getByRole('button',{name:'Salvar',exact:true}).click();
  await navigate(page,'Biblioteca de exercícios');await page.getByRole('button',{name:'Excluir Remada com halter',exact:true}).click();await page.getByRole('button',{name:'Confirmar exclusão',exact:true}).click();
  await navigate(page,'Treinos');await page.getByRole('button',{name:'Editar Plano biblioteca',exact:true}).click();await expect(page.getByLabel('Nome exercício 1',{exact:true})).toHaveValue('Remada com halter');
  await expect(page.getByRole('textbox',{name:'Instruções exercício 1',exact:true})).toHaveValue('Manter a coluna alinhada.');await page.getByRole('button',{name:'Salvar',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('teacher reports export filtered data and settings persist',async({page})=>{
  await login(page);await page.getByRole('button',{name:'Carregar demonstração',exact:true}).click();await navigate(page,'Relatórios');
  await expect(page.getByRole('img',{name:/Avaliações por mês no relatório/})).toBeVisible();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar CSV',exact:true}).click();const download=await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/tatugym-relatorio-.*\.csv/);
  const file=await download.path();const fs=await import('node:fs/promises');const csv=await fs.readFile(file!,'utf8');expect(csv).toContain('Ana — demonstração');expect(csv.split('\r\n')).toHaveLength(4);
  await page.getByRole('combobox',{name:'Aluno no relatório',exact:true}).selectOption({label:'Bruno — demonstração'});await expect(page.getByRole('button',{name:'Exportar CSV',exact:true})).toBeDisabled();
  await navigate(page,'Configurações');await page.getByLabel('Nome do professor',{exact:true}).fill('Professor Henrique');await page.getByLabel('Especialidade',{exact:true}).fill('Treinamento funcional');await page.getByRole('button',{name:'Salvar configurações',exact:true}).click();
  await page.reload();await expect(page.getByLabel('Nome do professor',{exact:true})).toHaveValue('Professor Henrique');await expect(page.getByLabel('Especialidade',{exact:true})).toHaveValue('Treinamento funcional');
  const backupPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar meus dados',exact:true}).click();const backup=await backupPromise;const json=JSON.parse(await fs.readFile((await backup.path())!,'utf8'));expect(json.data.students).toHaveLength(2);expect(json.data.profile.name).toBe('Professor Henrique');
});

test('teacher repository rejects cross-owner associations and preserves malformed storage',async({page})=>{
  await login(page);await student(page);
  const result=await page.evaluate(async()=>{
    const module=await import('/src/teacher/repository.ts');const data=JSON.parse(localStorage.getItem(module.TEACHER_STORAGE_KEY)!);const other=module.createTeacherRepository('teacher-demo-2');let rejected=0;
    try{other.saveAssessment({studentId:data.students[0].id,date:'2026-01-01',weight:70,height:170,waist:null,hip:null,bodyFat:null,notes:''});}catch{rejected++;}
    const before=localStorage.getItem(module.TEACHER_STORAGE_KEY);localStorage.setItem(module.TEACHER_STORAGE_KEY,'invalid-json');try{other.saveProfile({name:'Other',email:'other@example.test',phone:'',specialty:''});}catch{rejected++;}
    const preserved=localStorage.getItem(module.TEACHER_STORAGE_KEY)==='invalid-json';localStorage.setItem(module.TEACHER_STORAGE_KEY,before!);return {rejected,preserved};
  });expect(result).toEqual({rejected:2,preserved:true});
});

test('teacher desktop and mobile layouts have usable navigation without page overflow',async({page})=>{
  await login(page);await page.getByRole('button',{name:'Carregar demonstração',exact:true}).click();
  for(const size of [{width:1440,height:1000},{width:1024,height:768},{width:390,height:844},{width:320,height:568}]) {
    await page.setViewportSize(size);
    for(const section of ['Dashboard','Alunos','Treinos','Avaliações físicas','Evolução','Relatórios','Biblioteca de exercícios','Configurações']) {
      await navigate(page,section);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await expect(page.locator('#teacher-content h1').first()).toBeVisible();
    }
    await navigate(page,'Dashboard');await page.screenshot({path:`test-results/teacher-dashboard-${size.width}-${test.info().project.name}.png`,fullPage:true});
  }
  await page.getByRole('button',{name:'Abrir menu',exact:true}).click();await page.getByRole('button',{name:'Sair',exact:true}).click();await expect(page.getByRole('button',{name:'Entrar como professor',exact:true})).toBeVisible();
});
