import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { fail,checksum } from './data.mjs';
import * as schemas from './validation.mjs';

export async function teacherRead(db,user) {
  const profile=await db.query('SELECT profile FROM forja.teachers WHERE id=$1',[user.id]);
  const students=await db.query('SELECT s.id,s.profile FROM forja.students s JOIN forja.teacher_students t ON s.id=t.student_id WHERE t.teacher_id=$1',[user.id]);
  const plans=await db.query("SELECT data FROM forja.workouts WHERE owner_id=$1 AND source='teacher' AND NOT archived",[user.id]);
  const assessments=await db.query('SELECT data FROM forja.physical_assessments WHERE teacher_id=$1 AND NOT archived',[user.id]);
  const library=await db.query("SELECT data FROM forja.exercises WHERE owner_id=$1 AND workout_id='' AND NOT archived",[user.id]);
  const activities=await db.query('SELECT data FROM forja.teacher_activities WHERE teacher_id=$1 ORDER BY data->>\'at\' DESC',[user.id]);
  return {profile:profile.rows[0]?.profile,students:students.rows.map(s=>({...s.profile,id:s.id,teacherId:user.id,role:'ALUNO'})),plans:plans.rows.map(x=>x.data),assessments:assessments.rows.map(x=>x.data),library:library.rows.map(x=>x.data),activities:activities.rows.map(x=>x.data)};
}
async function linked(db,user,id) {
  const found=await db.query('SELECT student_id FROM forja.teacher_students WHERE teacher_id=$1 AND student_id=$2',[user.id,id]);
  if (!found.rowCount) fail(403,'Aluno não vinculado a este professor.');
}
export async function teacherMutation(db,user,{action,input,id},importing=false) {
  await db.query('SELECT id FROM forja.users WHERE id=$1 FOR UPDATE',[user.id]);
  const snapshot=await teacherRead(db,user);
  const entryId=id || randomUUID();
  const groups={Student:snapshot.students,Plan:snapshot.plans,Assessment:snapshot.assessments,Exercise:snapshot.library};
  const kind=action.replace(/^(save|delete)/,'');
  if (id && groups[kind] && !groups[kind].some(x=>x.id===id) && !importing) fail(403,'Registro não disponível para este professor.');
  let value;
  if (action==='saveProfile') {
    value=schemas.profile.parse(input);
    await db.query('UPDATE forja.teachers SET profile=$2 WHERE id=$1',[user.id,JSON.stringify(value)]);
  } else if (action==='saveStudent') {
    if(importing && (await db.query('SELECT id FROM forja.students WHERE id=$1',[entryId])).rowCount) fail(409,'Identificador de aluno já existente. Preserve a cópia local para conciliação.');
    value=schemas.student.parse(input); value.email=value.email.toLowerCase();
    const duplicate=await db.query("SELECT id FROM forja.students WHERE lower(profile->>'email')=$1 AND id<>$2",[value.email,entryId]);
    if (duplicate.rowCount) fail(409,'E-mail já cadastrado.');
    value={...value,createdAt:(importing?input.createdAt:null) ?? snapshot.students.find(x=>x.id===id)?.createdAt ?? new Date().toISOString()};
    await db.query('INSERT INTO forja.students(id,profile) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET profile=excluded.profile',[entryId,JSON.stringify(value)]);
    await db.query('INSERT INTO forja.teacher_students(teacher_id,student_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[user.id,entryId]);
  } else if (action==='savePlan') {
    value=schemas.plan.parse(input); if(value.studentId) await linked(db,user,value.studentId);
    for (const ex of value.exercises) if(ex.libraryId && !snapshot.library.some(x=>x.id===ex.libraryId)) fail(403,'Exercício indisponível.');
    value={...value,id:entryId,teacherId:user.id,updatedAt:(importing?input.updatedAt:null) ?? new Date().toISOString()};
    await db.query("INSERT INTO forja.workouts(owner_id,id,student_id,source,data) VALUES($1,$2,$3,'teacher',$4) ON CONFLICT(owner_id,id) DO UPDATE SET data=excluded.data,student_id=excluded.student_id,archived=false",[user.id,entryId,value.studentId||null,JSON.stringify(value)]);
    await db.query('UPDATE forja.exercises SET archived=true WHERE owner_id=$1 AND workout_id=$2',[user.id,entryId]);
    for(const ex of value.exercises) await db.query('INSERT INTO forja.exercises(owner_id,id,workout_id,data) VALUES($1,$2,$3,$4) ON CONFLICT(owner_id,id,workout_id) DO UPDATE SET data=excluded.data,archived=false',[user.id,ex.id,entryId,JSON.stringify(ex)]);
  } else if (action==='saveAssessment') {
    value=schemas.assessment.parse(input); await linked(db,user,value.studentId);
    value={...value,id:entryId,teacherId:user.id};
    await db.query('INSERT INTO forja.physical_assessments(teacher_id,id,student_id,data) VALUES($1,$2,$3,$4) ON CONFLICT(teacher_id,id) DO UPDATE SET data=excluded.data,student_id=excluded.student_id,archived=false',[user.id,entryId,value.studentId,JSON.stringify(value)]);
  } else if (action==='saveExercise') {
    value={...schemas.library.parse(input),id:entryId,teacherId:user.id};
    await db.query('INSERT INTO forja.exercises(owner_id,id,data) VALUES($1,$2,$3) ON CONFLICT(owner_id,id,workout_id) DO UPDATE SET data=excluded.data,archived=false',[user.id,entryId,JSON.stringify(value)]);
  } else if(action==='deleteStudent') {
    await linked(db,user,id);
    const s=snapshot.students.find(x=>x.id===id);
    await db.query('UPDATE forja.students SET profile=$2 WHERE id=$1',[id,JSON.stringify({...s,status:'INATIVO'})]);
  } else if(action==='deletePlan') await db.query("UPDATE forja.workouts SET archived=true WHERE owner_id=$1 AND id=$2 AND source='teacher'",[user.id,id]);
  else if(action==='deleteAssessment') await db.query('UPDATE forja.physical_assessments SET archived=true WHERE teacher_id=$1 AND id=$2',[user.id,id]);
  else if(action==='deleteExercise') {
    await db.query("UPDATE forja.exercises SET archived=true WHERE owner_id=$1 AND id=$2 AND workout_id=''",[user.id,id]);
    for(const item of snapshot.plans.filter(p=>p.exercises.some(e=>e.libraryId===id))) {
      const exercises=item.exercises.map(ex=>{if(ex.libraryId!==id)return ex;const {libraryId,...copy}=ex;return copy;});
      await teacherMutation(db,user,{action:'savePlan',id:item.id,input:{...item,exercises}});
    }
  }
  else fail(400,'Operação inválida.');
  const activity={id:randomUUID(),teacherId:user.id,title:'Cadastro atualizado',at:new Date().toISOString()};
  await db.query('INSERT INTO forja.teacher_activities(teacher_id,id,data) VALUES($1,$2,$3)',[user.id,activity.id,JSON.stringify(activity)]);
  return {id:entryId};
}
export async function importTeacher(db,user,body) {
  // Only the authenticated teacher's legacy partition may be imported.
  const legacyId=user.login==='professor'?'teacher-demo-1':user.login==='professor2'?'teacher-demo-2':user.id;
  const original=structuredClone(body);
  const digest=checksum(original);
  await db.query('SELECT id FROM forja.users WHERE id=$1 FOR UPDATE',[user.id]);
  if((await db.query('SELECT 1 FROM forja.local_imports WHERE user_id=$1 AND source=$2 AND checksum=$3',[user.id,'teacher-local',digest])).rowCount) return {imported:true};
  const snapshot=await teacherRead(db,user);
  const arrays=['students','plans','assessments','library','activities'];
  if(body.version!==1 || !body.profiles || !arrays.every(k=>Array.isArray(body[k]))) fail(400,'Dados locais incompatíveis.');
  const own=Object.fromEntries(arrays.map(k=>[k,body[k].filter(x=>x.teacherId===legacyId)]));
  // Never overwrite a different server record during an import.
  for(const k of arrays) for(const row of own[k]) if(snapshot[k].some(x=>x.id===row.id)) fail(409,'Registro já existente no banco. Importação preservada para conciliação.');
  if(body.profiles[legacyId]) await teacherMutation(db,user,{action:'saveProfile',input:body.profiles[legacyId]});
  // New imports carry original IDs; the ownership checks above already checked collisions.
  for(const [key,action] of [['students','saveStudent'],['library','saveExercise'],['plans','savePlan'],['assessments','saveAssessment']]) {
    for(const row of own[key]) {
      const result=await teacherMutation(db,user,{action,input:row,id:row.id},true);
      // Remap imported references to generated IDs without changing the saved original.
      if(key==='students') for(const target of [...own.plans,...own.assessments]) if(target.studentId===row.id) target.studentId=result.id;
      if(key==='library') for(const p of own.plans) for(const ex of p.exercises) if(ex.libraryId===row.id) ex.libraryId=result.id;
    }
  }
  for(const row of own.activities) await db.query('INSERT INTO forja.teacher_activities(teacher_id,id,data) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[user.id,row.id,JSON.stringify({...row,teacherId:user.id})]);
  const verified=await teacherRead(db,user);
  for(const key of arrays) for(const row of own[key]) {
    const saved=verified[key].find(x=>x.id===row.id);
    if(!isDeepStrictEqual(saved,{...row,teacherId:user.id})) fail(409,'A conferência dos dados locais do professor falhou. A importação foi revertida e o original foi preservado.');
  }
  if(body.profiles[legacyId]&&!isDeepStrictEqual(verified.profile,body.profiles[legacyId])) fail(409,'Perfil local incompatível. O original foi preservado.');
  await db.query('INSERT INTO forja.local_imports(user_id,source,checksum,original) VALUES($1,$2,$3,$4)',[user.id,'teacher-local',digest,JSON.stringify(original)]);
  return {imported:true};
}
