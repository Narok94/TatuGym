import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { appData, checkins } from './validation.mjs';
export function fail(status,message) { throw Object.assign(new Error(message),{status}); }
export const checksum = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function emptyData(user) { return {version:1,user:{id:user.id,name:user.name},welcomed:true,theme:'system',workouts:[],meals:[],mealLogs:{},activeSession:null,history:[],weights:[]}; }
export async function projectStudent(db,user,data,previous) {
  if(!isDeepStrictEqual(data.workouts,previous?.workouts)) {
  await db.query("UPDATE forja.workouts SET archived=true WHERE owner_id=$1 AND source='student'",[user.id]);
  await db.query("UPDATE forja.exercises SET archived=true WHERE owner_id=$1",[user.id]);
  for (const workout of data.workouts) {
    await db.query("INSERT INTO forja.workouts(owner_id,id,student_id,source,data) VALUES($1,$2,$1,'student',$3) ON CONFLICT(owner_id,id) DO UPDATE SET data=excluded.data,archived=false",[user.id,workout.id,JSON.stringify(workout)]);
    for (const exercise of workout.exercises) await db.query('INSERT INTO forja.exercises(owner_id,id,workout_id,data) VALUES($1,$2,$3,$4) ON CONFLICT(owner_id,id,workout_id) DO UPDATE SET data=excluded.data,archived=false',[user.id,exercise.id,workout.id,JSON.stringify(exercise)]);
  }
  }
  if(!isDeepStrictEqual(data.history,previous?.history)) {
  await db.query('UPDATE forja.workout_history SET archived=true WHERE user_id=$1',[user.id]);
  for (const record of data.history) await db.query('INSERT INTO forja.workout_history(user_id,id,data) VALUES($1,$2,$3) ON CONFLICT(user_id,id) DO UPDATE SET data=excluded.data,archived=false',[user.id,record.id,JSON.stringify(record)]);
  }
}
export async function studentRead(db,user) {
  const result = await db.query('SELECT data,checkins,revision FROM forja.student_data WHERE user_id=$1',[user.id]);
  const value = result.rows[0] ?? {data:emptyData(user),checkins:{},revision:0};
  const plans = await db.query("SELECT w.data FROM forja.workouts w JOIN forja.students s ON s.id=w.student_id JOIN forja.teacher_students ts ON ts.student_id=s.id AND ts.teacher_id=w.owner_id WHERE s.user_id=$1 AND w.source='teacher' AND NOT w.archived AND w.data->>'status'='ATIVO'",[user.id]);
  return {...value,assignedPlans:plans.rows.map(x=>({...x.data,id:`assigned:${x.data.teacherId}:${x.data.id}`,subtitle:x.data.description,groups:[...new Set(x.data.exercises.map(e=>e.muscleGroup).filter(Boolean))],muscle:'push'}))};
}
export async function studentWrite(db,user,body) {
  const data = appData.parse(body.data); const records = checkins.parse(body.checkins);
  data.workouts=data.workouts.filter(w=>!w.id.startsWith('assigned:'));
  await db.query('SELECT id FROM forja.users WHERE id=$1 FOR UPDATE',[user.id]);
  const old = await studentRead(db,user);
  if (old.revision !== body.revision) fail(409,'Os dados mudaram em outro dispositivo. Sua cópia local foi preservada; recarregue após exportá-la.');
  data.user.id = user.id;
  const result = await db.query('INSERT INTO forja.student_data(user_id,data,checkins) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,checkins=excluded.checkins,revision=forja.student_data.revision+1,updated_at=now() RETURNING revision',[user.id,JSON.stringify(data),JSON.stringify(records)]);
  await projectStudent(db,user,data,old.revision?old.data:undefined);
  return {revision:result.rows[0].revision};
}
export async function importStudent(db,user,body) {
  if (user.login !== 'henrique') fail(403,'Importação disponível apenas para o proprietário dos dados locais.');
  const data=appData.parse(body.data); const records=checkins.parse(body.checkins);
  const original={data,checkins:records}; const digest=checksum(original);
  await db.query('SELECT id FROM forja.users WHERE id=$1 FOR UPDATE',[user.id]);
  const imported=await db.query('SELECT checksum FROM forja.local_imports WHERE user_id=$1 AND source=$2 AND checksum=$3',[user.id,'henrique-local',digest]);
  if (imported.rowCount) return {imported:true,alreadyImported:true,checksum:digest};
  const old=await studentRead(db,user);
  if (old.revision) fail(409,'Já existem dados no banco e uma cópia local diferente. A importação foi interrompida para evitar sobreposição. Exporte a cópia local para conciliação.');
  await studentWrite(db,user,{data,checkins:records,revision:0});
  await db.query('INSERT INTO forja.local_imports(user_id,source,checksum,original) VALUES($1,$2,$3,$4)',[user.id,'henrique-local',digest,JSON.stringify(original)]);
  return {imported:true,checksum:digest};
}
