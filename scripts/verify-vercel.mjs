import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
const deployment=process.argv[2];
if(!deployment) throw new Error('Informe a URL do Preview.');
const cli=process.env.FORJA_VERCEL_CLI||join(process.env.APPDATA,'npm/node_modules/vercel/dist/vc.js');
const directory=mkdtempSync(join(tmpdir(),'forja-verify-'));
const jar=join(directory,'cookies'),headers=join(directory,'headers');
const memoryCookies=new Map();
async function request(action,payload) {
  if(process.env.FORJA_VERIFY_DIRECT==='1') {
    const response=await fetch(new URL(`/api/forja?action=${action}`,deployment),{method:payload===undefined?'GET':'POST',headers:{Cookie:[...memoryCookies].map(([key,value])=>`${key}=${value}`).join(';'),...(payload===undefined?{}:{'Content-Type':'application/json'})},body:payload===undefined?undefined:JSON.stringify(payload)});
    for(const cookie of response.headers.getSetCookie()) {
      const pair=cookie.split(';')[0],index=pair.indexOf('=');
      memoryCookies.set(pair.slice(0,index),pair.slice(index+1));
    }
    return {status:response.status,value:await response.json(),headers:response.headers.getSetCookie().map(value=>`set-cookie: ${value}`).join('\n')};
  }
  const args=[cli,'curl',`/api/forja?action=${action}`,'--deployment',deployment,'--','--silent','--show-error','--cookie',jar,'--cookie-jar',jar,'--dump-header',headers,'--write-out','\n%{http_code}'];
  if(payload!==undefined) args.push('--request','POST','--header','Content-Type:application/json','--data-binary','@-');
  const result=spawnSync(process.execPath,args,{input:payload===undefined?undefined:JSON.stringify(payload),encoding:'utf8',windowsHide:true});
  if(result.status!==0) throw new Error('Falha ao consultar deployment. Nenhuma credencial registrada.');
  const output=result.stdout.trim();const split=output.lastIndexOf('\n');
  return {status:Number(output.slice(split+1)),value:JSON.parse(output.slice(0,split)),headers:readFileSync(headers,'utf8')};
}
function check(condition) {if(!condition)throw new Error('Validação hospedada falhou. Consulte a API sem registrar dados sensíveis.');}
try {
  check((await request('session')).value.session===null);check((await request('student')).status===401);
  for(const [login,role,key,resource] of [['henrique','ALUNO','FORJA_VERIFY_STUDENT_PASSWORD','student'],['professor','PROFESSOR','FORJA_VERIFY_TEACHER_PASSWORD','teacher'],['professor2','PROFESSOR','FORJA_VERIFY_TEACHER2_PASSWORD','teacher']]) {
    const password=process.env[key];if(!password)throw new Error(`Configure ${key} no processo.`);
    const result=await request('login',{login,password});check(result.status===200&&result.value.session.role===role);
    const cookie=result.headers.split('\n').find(line=>/^set-cookie: __Host-forja_session=/i.test(line));
    check(cookie&&['HttpOnly','Secure','SameSite=Lax'].every(flag=>cookie.includes(flag)));
    check((await request('session')).value.session.login===login);check((await request(resource)).status===200);
    check((await request(resource==='student'?'teacher':'student')).status===403);
    check((await request('logout',{})).status===200);check((await request('session')).value.session===null);check((await request(resource)).status===401);
    console.log(`${login}: login, cookie HTTPS, permissões e logout verificados na Vercel.`);
  }
} finally {
  // Only this process's freshly created temporary cookie directory is removed.
  if(resolve(directory).startsWith(resolve(tmpdir())+sep)&&basename(directory).startsWith('forja-verify-')) rmSync(directory,{recursive:true,force:true});
}
