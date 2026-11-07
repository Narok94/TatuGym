import { api } from './auth';
import type { AuthSession } from './auth';
import type { AppData,Workout } from './types';
export const LEGACY_STUDENT_KEY='meu-treino:v1:henrique-local';
export const LEGACY_TEACHER_KEY='tatugym:dev:teacher-workspace:v1';
type StudentState={data:AppData;checkins:Record<string,true>;revision:number;assignedPlans?:Workout[]};
let state:StudentState;
let userId='';
let saving:Promise<void>|null=null;
let generation=0;
let error='';
const pendingKey=()=>`forja:pending:${userId}`;
const emit=()=>window.dispatchEvent(new Event('forja:data'));
export const readStudent=()=>state;
export const viewStudent=()=>({...state.data,workouts:[...state.data.workouts,...(state.assignedPlans??[])]});
export const persistenceError=()=>error;
export function exportPreservedData(session:AuthSession) {
  const keys=Object.keys(localStorage).filter(key=>key===`forja:pending:${session.userId}`||(session.role==='ALUNO'&&session.login==='henrique'&&(key===LEGACY_STUDENT_KEY||key.startsWith(`${LEGACY_STUDENT_KEY}:`))));
  const backup={exportedAt:new Date().toISOString(),records:Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)]))};
  if(session.role==='PROFESSOR') {
    const raw=localStorage.getItem(LEGACY_TEACHER_KEY);
    if(raw) {
      const value=JSON.parse(raw);const legacyId=session.login==='professor'?'teacher-demo-1':session.login==='professor2'?'teacher-demo-2':session.userId;
      backup.records[LEGACY_TEACHER_KEY]=JSON.stringify({version:value.version,profiles:{[legacyId]:value.profiles?.[legacyId]},...Object.fromEntries(['students','plans','assessments','library','activities'].map(k=>[k,(value[k]??[]).filter((row:{teacherId:string})=>row.teacherId===legacyId)]))});
    }
  }
  const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download='forja-dados-preservados.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function digest(value:string) {const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');}
export async function prepareData(session:AuthSession) {
  if(session.role==='PROFESSOR') {
    const raw=localStorage.getItem(LEGACY_TEACHER_KEY);
    if(raw) {
      const value=JSON.parse(raw);const legacyId=session.login==='professor'?'teacher-demo-1':session.login==='professor2'?'teacher-demo-2':session.userId;
      if(value.version!==1 || !value.profiles || !['students','plans','assessments','library','activities'].every(k=>Array.isArray(value[k]))) throw new Error('Dados locais do professor incompatíveis. O original foi preservado.');
      const own={...value,profiles:value.profiles[legacyId]?{[legacyId]:value.profiles[legacyId]}:{},...Object.fromEntries(['students','plans','assessments','library','activities'].map(k=>[k,value[k].filter((row:{teacherId:string})=>row.teacherId===legacyId)]))};
      if(Object.keys(own.profiles).length || ['students','plans','assessments','library','activities'].some(k=>own[k].length)) {
        const marker=`forja:migrated:${session.userId}:${await digest(JSON.stringify(own))}`;
        if(!localStorage.getItem(marker)) {await api('import-teacher',own);await api('teacher');localStorage.setItem(marker,'verified');}
      }
    }
    return;
  }
  userId=session.userId;error='';
  const raw=session.login==='henrique'?localStorage.getItem(LEGACY_STUDENT_KEY):null;
  const checkRaw=session.login==='henrique'?localStorage.getItem(`${LEGACY_STUDENT_KEY}:weekly-checkins`):null;
  state=await api<StudentState>('student');
  if(raw || checkRaw) {
    const original={data:raw?JSON.parse(raw):state.data,checkins:checkRaw?JSON.parse(checkRaw):{}};
    const marker=`forja:migrated:${userId}:${await digest(JSON.stringify(original))}`;
    if(!localStorage.getItem(marker)) {
      const receipt=await api<{alreadyImported?:boolean}>('import-student',original);
      const verified=await api<StudentState>('student');
      const expected={...original.data,user:{...original.data.user,id:userId}};
      if(!receipt.alreadyImported && (canonical(expected)!==canonical(verified.data)||canonical(original.checkins)!==canonical(verified.checkins))) throw new Error('A verificação da transferência falhou. Os registros locais permanecem intactos.');
      localStorage.setItem(marker,'verified');state=verified;
    }
  }
  const pending=localStorage.getItem(pendingKey());
  if(pending) {
    const draft=JSON.parse(pending) as StudentState;
    if(canonical(draft.data)===canonical(state.data)&&canonical(draft.checkins)===canonical(state.checkins)) localStorage.removeItem(pendingKey());
    else if(draft.revision===state.revision) {state=draft;generation++;await flushStudent();if(error) throw new Error(error);}
    else throw new Error('Há alterações locais pendentes e dados mais recentes no servidor. A cópia pendente foi preservada; exporte-a antes de conciliar.');
  }
}
function canonical(value:unknown):string {
  if(Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if(value && typeof value==='object') return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical((value as Record<string,unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function updateStudent(data:AppData,checkins=state.checkins) {
  state={...state,data:{...data,workouts:data.workouts.filter(w=>!w.id.startsWith('assigned:'))},checkins};generation++;
  try {localStorage.setItem(pendingKey(),JSON.stringify(state));error='Salvando no servidor…';}
  catch {error='Não foi possível guardar a cópia pendente neste dispositivo. Mantenha a página aberta e exporte seus dados.';emit();return;}
  emit();void flushStudent();
}
export async function flushStudent() {
  if(saving) return saving;
  saving=(async()=>{
    while(localStorage.getItem(pendingKey())) {
      const version=generation;const draft=state;
      try {
        const saved=await api<{revision:number}>('student',draft);
        state={...state,revision:saved.revision};
        if(version===generation) {localStorage.removeItem(pendingKey());error='';}
        else localStorage.setItem(pendingKey(),JSON.stringify(state));
        emit();
      } catch(reason) {error=`${(reason as Error).message} Alterações pendentes preservadas neste dispositivo.`;emit();break;}
    }
  })().finally(()=>{saving=null;});
  return saving;
}
window.addEventListener('online',()=>{if(userId) void flushStudent();});
