import type { TeacherIdentity } from './teacher/models';
export type AuthSession = {role:'ALUNO';userId:string;login:string;name:string}|{role:'PROFESSOR';teacherId:string;userId:string;login:string;name:string};
export interface AuthService {
  mode:'server'|'unavailable';
  readSession():AuthSession|null;
  refresh():Promise<AuthSession|null>;
  login(user:string,password:string):Promise<AuthSession>;
  logout():Promise<void>;
}
export const AUTH_UNAVAILABLE='Não foi possível conectar ao servidor. Tente novamente.';
export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
let current:AuthSession|null=null;
export async function api<T>(action:string,input?:unknown):Promise<T> {
  const response=await fetch(`/api/forja?action=${action}`,{method:input===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:input===undefined?{}:{'Content-Type':'application/json'},body:input===undefined?undefined:JSON.stringify(input)});
  const value=await response.json().catch(()=>({error:AUTH_UNAVAILABLE}));
  if(!response.ok) {if(response.status===401 && action!=='login') {current=null;window.dispatchEvent(new Event('forja:expired'));} throw new ApiError(value.error||AUTH_UNAVAILABLE,response.status);}
  return value;
}
const service:AuthService={
  mode:'server',readSession:()=>current,
  async refresh(){const value=await api<{session:AuthSession|null}>('session');current=value.session;return current;},
  async login(login,password){const value=await api<{session:AuthSession}>('login',{login,password});current=value.session;return current;},
  async logout(){await api('logout',{});current=null;try{localStorage.setItem('forja:logout',String(Date.now()));}catch{/* Server session is already revoked. */}},
};
export function loadAuthService(){return Promise.resolve(service);}
export function authenticatedTeacherIdentity(id:string):TeacherIdentity {
  if(current?.role!=='PROFESSOR'||current.teacherId!==id) throw new Error('Acesso não autorizado.');
  return {id,login:current.login,name:current.name,email:''};
}
