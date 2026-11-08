import { randomBytes,createHash } from 'node:crypto';
import { database,transaction } from '../server/db.mjs';
import { hashPassword,verifyPassword } from '../server/password.mjs';
import { fail,studentRead,studentWrite,importStudent } from '../server/data.mjs';
import { teacherRead,teacherMutation,importTeacher } from '../server/teacher.mjs';
import { passwordChange } from '../server/validation.mjs';

const hash=value=>createHash('sha256').update(value).digest('hex');
const cookieName=process.env.VERCEL?'__Host-forja_session':'forja_session';
const dummy=hashPassword(randomBytes(32).toString('hex'));
function cookie(token,age) { return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${process.env.VERCEL?'; Secure':''}`; }
function sessionToken(req) { return (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(`${cookieName}=`))?.slice(cookieName.length+1); }
function publicSession(user) { return {...(user.role==='PROFESSOR'?{teacherId:user.id}:{}),role:user.role,userId:user.id,login:user.login,name:user.name,mustChangePassword:!!user.must_change_password}; }
async function session(req) {
  const token=sessionToken(req);
  if(!token) return null;
  const result=await database().query('SELECT u.* FROM forja.sessions s JOIN forja.users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now()',[hash(token)]);
  return result.rows[0]??null;
}
async function body(req) {
  if(req.body) return typeof req.body==='string'?JSON.parse(req.body):req.body;
  let raw=''; for await(const chunk of req) {raw+=chunk; if(Buffer.byteLength(raw)>3_500_000) fail(413,'Dados muito grandes; exporte uma cópia para migração assistida.');}
  return raw?JSON.parse(raw):{};
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store, private');
  res.setHeader('Vary','Cookie'); res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,value)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(value));};
  try {
    const url=new URL(req.url,'http://localhost'); const action=url.searchParams.get('action')||'session';
    if(!['GET','POST'].includes(req.method)) fail(405,'Método não permitido.');
    if(req.method==='POST') {
      if(!req.headers['content-type']?.startsWith('application/json')) fail(415,'Envie JSON.');
      const origin=req.headers.origin;
      const host=req.headers.host;
      if(origin && new URL(origin).host!==host) fail(403,'Origem não permitida.');
      if(req.headers['sec-fetch-site']==='cross-site') fail(403,'Origem não permitida.');
    }
    if(action==='session' && req.method==='GET') { const user=await session(req); return send(200,{session:user?publicSession(user):null}); }
    if(action==='login' && req.method==='POST') {
      const input=await body(req);
      if(typeof input.login!=='string'||typeof input.password!=='string'||input.login.length>200||input.password.length>1024) fail(400,'Informe usuário e senha.');
      const login=input.login.trim().toLowerCase();
      const ip=process.env.VERCEL?(req.headers['x-vercel-forwarded-for']||'unknown'):(req.socket?.remoteAddress||'local');
      for(const key of [hash(`login:${login}`),hash(`ip:${ip}`)]) {
        const limit=await database().query("INSERT INTO forja.login_attempts(key,attempts,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN forja.login_attempts.reset_at<now() THEN 1 ELSE forja.login_attempts.attempts+1 END,reset_at=CASE WHEN forja.login_attempts.reset_at<now() THEN now()+interval '15 minutes' ELSE forja.login_attempts.reset_at END RETURNING attempts",[key]);
        if(limit.rows[0].attempts>(key===hash(`login:${login}`)?15:100)) fail(429,'Muitas tentativas. Tente novamente em 15 minutos.');
      }
      const token=randomBytes(32).toString('hex');
      const user=await transaction(async db=>{
        const result=await db.query('SELECT * FROM forja.users WHERE login=$1 FOR UPDATE',[login]);
        const user=result.rows[0];
        if(!await verifyPassword(input.password,user?.password_hash||await dummy) || !user) fail(401,'Usuário ou senha inválidos. Confira seus dados e tente novamente.');
        const old=sessionToken(req);
        if(old) await db.query('DELETE FROM forja.sessions WHERE token_hash=$1',[hash(old)]);
        await db.query("INSERT INTO forja.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+$3*interval '1 second')",[hash(token),user.id,user.must_change_password?900:604800]);
        await db.query('DELETE FROM forja.login_attempts WHERE key=$1',[hash(`login:${login}`)]);
        return user;
      });
      res.setHeader('Set-Cookie',cookie(token,user.must_change_password?900:604800)); return send(200,{session:publicSession(user)});
    }
    if(action==='logout' && req.method==='POST') {
      const token=sessionToken(req);
      if(token) await database().query('DELETE FROM forja.sessions WHERE token_hash=$1',[hash(token)]);
      res.setHeader('Set-Cookie',cookie('',0)); return send(200,{ok:true});
    }
    const user=await session(req); if(!user) fail(401,'Sua sessão expirou. Entre novamente.');
    if(action==='change-password' && req.method==='POST') {
      if(user.role!=='ALUNO') fail(403,'Alteração disponível para o aluno autenticado.');
      const input=passwordChange.parse(await body(req));
      const key=hash(`password-change:${user.id}`);
      const limit=await database().query("INSERT INTO forja.login_attempts(key,attempts,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN forja.login_attempts.reset_at<now() THEN 1 ELSE forja.login_attempts.attempts+1 END,reset_at=CASE WHEN forja.login_attempts.reset_at<now() THEN now()+interval '15 minutes' ELSE forja.login_attempts.reset_at END RETURNING attempts",[key]);
      if(limit.rows[0].attempts>15) fail(429,'Muitas tentativas. Tente novamente em 15 minutos.');
      const token=randomBytes(32).toString('hex');
      const updated=await transaction(async db=>{
        const fresh=(await db.query('SELECT * FROM forja.users WHERE id=$1 FOR UPDATE',[user.id])).rows[0];
        // A reset revokes prior sessions, including requests already queued in another tab.
        const active=await db.query('SELECT 1 FROM forja.sessions WHERE token_hash=$1 AND user_id=$2 AND expires_at>now()',[hash(sessionToken(req)||''),user.id]);
        if(!active.rowCount) fail(401,'Sua sessão expirou. Entre novamente.');
        if(!fresh.must_change_password) fail(409,'A senha já foi alterada. Entre novamente com sua senha atual.');
        if(!await verifyPassword(input.currentPassword,fresh.password_hash)) fail(403,'Senha temporária incorreta.');
        if(input.newPassword===input.currentPassword) fail(422,'Escolha uma senha diferente da temporária.');
        await db.query('UPDATE forja.users SET password_hash=$2,must_change_password=false WHERE id=$1',[user.id,await hashPassword(input.newPassword)]);
        await db.query('DELETE FROM forja.sessions WHERE user_id=$1',[user.id]);
        await db.query("INSERT INTO forja.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",[hash(token),user.id]);
        await db.query('DELETE FROM forja.login_attempts WHERE key=$1',[key]);
        return {...fresh,must_change_password:false};
      });
      res.setHeader('Set-Cookie',cookie(token,604800));return send(200,{session:publicSession(updated)});
    }
    if(user.must_change_password) return send(403,{error:'Altere sua senha temporária para continuar.',code:'MUST_CHANGE_PASSWORD'});
    if(['student','import-student'].includes(action)) {
      if(user.role!=='ALUNO') fail(403,'Acesso exclusivo do aluno autenticado.');
      if(action==='student' && req.method==='GET') return send(200,await studentRead(database(),user));
      if(req.method==='POST') { const input=await body(req); return send(200,await transaction(db=>action==='student'?studentWrite(db,user,input):importStudent(db,user,input))); }
    }
    if(['teacher','import-teacher'].includes(action)) {
      if(user.role!=='PROFESSOR') fail(403,'Acesso exclusivo de professor.');
      if(action==='teacher'&&req.method==='GET') return send(200,await teacherRead(database(),user));
      if(req.method==='POST') { const input=await body(req); return send(200,await transaction(db=>action==='teacher'?teacherMutation(db,user,input):importTeacher(db,user,input))); }
    }
    fail(404,'Operação não encontrada.');
  } catch(error) {
    const status=error.status||(error.code==='23505'?409:error.name==='ZodError'||error instanceof SyntaxError?400:503);
    if(error.code==='23505') return send(409,{error:'Login ou e-mail já cadastrado. Escolha outro.'});
    send(status,{error:status===503?'Serviço indisponível. Seus dados locais foram preservados.':status===400?'Dados inválidos. Verifique os campos e preserve sua cópia local.':error.message});
  }
}
