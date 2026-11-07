import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import { database,transaction } from '../server/db.mjs';
import { importStudent,studentRead,studentWrite } from '../server/data.mjs';
import { teacherRead,teacherMutation,importTeacher } from '../server/teacher.mjs';
const rollback=Symbol('rollback');
async function isolated(action) {
  assert.match(process.env.FORJA_TEST_SCHEMA||'',/^forja_test_/);
  try {await transaction(async db=>{await action(db);throw rollback;});}catch(error){if(error!==rollback)throw error;}
}
after(async()=>{await database().end();});
test('student import is atomic, preserves full snapshots, rejects conflicts and stays idempotent',()=>isolated(async db=>{
  const user=(await db.query("SELECT * FROM forja.users WHERE login='henrique'")).rows[0];
  const workout={id:'legacy-workout',name:'Original',subtitle:'Original',groups:['Peito'],duration:40,muscle:'push',exercises:[{id:'e1',name:'Supino',sets:2,reps:'8',load:40,rest:60}]};
  const session={id:'legacy-session',workout,startedAt:'2026-11-01T12:00:00Z',currentExercise:0,currentSet:1,sets:[],drafts:{'e1:1':{load:41,reps:9}},rest:{remaining:12,endsAt:1790000000000}};
  const original={data:{version:1,user:{id:'henrique-local',name:'Henrique'},welcomed:true,theme:'dark',workouts:[workout],meals:[],mealLogs:{'2026-11-01':['meal']},activeSession:session,history:[{...session,id:'history',finishedAt:'2026-11-01T13:00:00Z'}],weights:[{id:'weight',date:'2026-11-01',value:80}]},checkins:{'2026-11-01':true}};
  const serialized=JSON.stringify(original);
  await importStudent(db,user,original);
  assert.equal(JSON.stringify(original),serialized);
  const first=await studentRead(db,user);
  assert.deepEqual(first.data,{...original.data,user:{...original.data.user,id:user.id}});
  assert.deepEqual(first.checkins,original.checkins);
  const archive=await db.query('SELECT original FROM forja.local_imports WHERE user_id=$1',[user.id]);assert.deepEqual(archive.rows[0].original,original);
  await importStudent(db,user,original);
  assert.equal((await studentRead(db,user)).revision,first.revision);
  const changed={...first,data:{...first.data,theme:'light'}};
  await studentWrite(db,user,changed);
  assert.equal((await importStudent(db,user,original)).alreadyImported,true);
  assert.equal((await studentRead(db,user)).data.theme,'light');
  await assert.rejects(()=>importStudent(db,user,{...original,data:{...original.data,theme:'system'}}),{status:409});
  await assert.rejects(()=>studentWrite(db,user,first),{status:409});
  assert.equal((await db.query('SELECT count(*)::int AS n FROM forja.workouts WHERE owner_id=$1',[user.id])).rows[0].n,1);
}));
test('teacher import preserves IDs, timestamps, ownership and original library copies',()=>isolated(async db=>{
  const teacher=(await db.query("SELECT * FROM forja.users WHERE login='professor2'")).rows[0];
  const primary=(await db.query("SELECT * FROM forja.users WHERE login='professor'")).rows[0];
  const id=teacher.id,at='2026-10-01T12:00:00Z';
  const original={version:1,profiles:{[id]:{name:'Professor 2',email:'p2@example.test',phone:'11',specialty:'Força'}},students:[{id:'legacy-student',teacherId:id,role:'ALUNO',name:'Cadastro original',email:'original@example.test',phone:'',birthDate:'',goal:'Força',status:'ATIVO',notes:'Observações preservadas',createdAt:at}],library:[{id:'legacy-exercise',teacherId:id,name:'Supino',muscleGroup:'Peito',equipment:'Barra',instructions:'Instrução original',imageUrl:''}],plans:[{id:'legacy-plan',teacherId:id,studentId:'legacy-student',name:'Plano original',description:'Orientações',status:'ATIVO',duration:40,updatedAt:at,exercises:[{id:'pe1',libraryId:'legacy-exercise',name:'Supino',muscleGroup:'Peito',sets:3,reps:'8',load:40,rest:60,instructions:'Instrução original'}]}],assessments:[{id:'legacy-assessment',teacherId:id,studentId:'legacy-student',date:'2026-10-01',weight:80,height:175,waist:null,hip:null,bodyFat:null,notes:'Original'}],activities:[{id:'legacy-activity',teacherId:id,title:'Registro original',at}]};
  const immutable=structuredClone(original);
  await importTeacher(db,teacher,structuredClone(original));
  const saved=await teacherRead(db,teacher);
  for(const key of ['students','plans','assessments','library']) assert.deepEqual(saved[key],immutable[key]);
  assert.deepEqual(saved.profile,immutable.profiles[id]);
  assert.ok(saved.activities.some(x=>x.id==='legacy-activity'));
  const archived=await db.query('SELECT original FROM forja.local_imports WHERE user_id=$1',[id]);assert.deepEqual(archived.rows[0].original,immutable);
  await importTeacher(db,teacher,structuredClone(original));assert.equal((await teacherRead(db,teacher)).plans.length,1);
  await assert.rejects(()=>teacherMutation(db,primary,{action:'saveStudent',id:'legacy-student',input:original.students[0]}),{status:403});
  await teacherMutation(db,teacher,{action:'deleteExercise',id:'legacy-exercise'});
  const detached=(await teacherRead(db,teacher)).plans[0];assert.equal(detached.exercises[0].libraryId,undefined);assert.equal(detached.exercises[0].instructions,'Instrução original');
  await teacherMutation(db,teacher,{action:'savePlan',id:detached.id,input:detached});
  await teacherMutation(db,teacher,{action:'deleteStudent',id:'legacy-student'});
  assert.equal((await teacherRead(db,teacher)).students[0].status,'INATIVO');assert.equal((await teacherRead(db,teacher)).assessments.length,1);
}));
