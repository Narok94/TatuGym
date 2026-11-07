import { database, transaction } from '../server/db.mjs';
import { hashPassword } from '../server/password.mjs';

// Passwords enter only through the process environment. Existing hashes are never replaced.
try {
  const accounts = [
    { id: 'henrique', login: 'henrique', name: 'Henrique', role: 'ALUNO', password: process.env.FORJA_SEED_STUDENT_PASSWORD },
    { id: 'teacher-demo-1', login: 'professor', name: 'Professor FORJA', role: 'PROFESSOR', password: process.env.FORJA_SEED_TEACHER_PASSWORD },
  ];
  // Compatibility account from the previous teacher workspace, when explicitly supplied.
  if(process.env.FORJA_SEED_TEACHER2_PASSWORD) accounts.push({id:'teacher-demo-2',login:'professor2',name:'Professor 2',role:'PROFESSOR',password:process.env.FORJA_SEED_TEACHER2_PASSWORD});
  await transaction(async db => {
    for (const account of accounts) {
      const old = await db.query('SELECT id,role FROM forja.users WHERE login=$1', [account.login]);
      if (old.rowCount) { if (old.rows[0].role !== account.role) throw new Error('Papel incompatível.'); continue; }
      if (!account.password) throw new Error('Informe as senhas iniciais no ambiente do processo.');
      await db.query('INSERT INTO forja.users(id,login,password_hash,role,name) VALUES($1,$2,$3,$4,$5) ON CONFLICT(login) DO NOTHING', [account.id,account.login,await hashPassword(account.password),account.role,account.name]);
    }
    const { rows } = await db.query("SELECT id,login,name,role FROM forja.users WHERE login IN ('henrique','professor','professor2')");
    for (const user of rows) {
      if (user.role === 'PROFESSOR') await db.query('INSERT INTO forja.teachers(id,profile) VALUES($1,$2) ON CONFLICT DO NOTHING', [user.id,JSON.stringify({name:user.name,email:'professor@example.test',phone:'',specialty:''})]);
      else await db.query('INSERT INTO forja.students(id,user_id,profile) VALUES($1,$1,$2) ON CONFLICT DO NOTHING', [user.id,JSON.stringify({name:user.name,email:'henrique@example.test',phone:'',birthDate:'',goal:'',status:'ATIVO',notes:'',createdAt:new Date().toISOString()})]);
    }
    const teacher = rows.find(x=>x.login==='professor'), student = rows.find(x=>x.login==='henrique');
    if (teacher && student) await db.query('INSERT INTO forja.teacher_students(teacher_id,student_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[teacher.id,student.id]);
  });
  console.log('Contas iniciais verificadas; senhas existentes e professor2 preservados.');
} catch { console.error('Criação de contas interrompida; nenhuma senha foi registrada em logs.'); process.exitCode=1; }
finally { await database().end(); }
