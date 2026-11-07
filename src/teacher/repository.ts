import { api,authenticatedTeacherIdentity } from '../auth';
import { LEGACY_TEACHER_KEY } from '../persistence';
import type { TeacherRepository } from './models';
export const TEACHER_STORAGE_KEY=LEGACY_TEACHER_KEY;
export function createTeacherRepository(teacherId:string):TeacherRepository {
  authenticatedTeacherIdentity(teacherId);
  const save=async(action:string,input:unknown,id?:string)=>(await api<{id:string}>('teacher',{action,input,id})).id;
  const remove=async(action:string,id:string)=>{await api('teacher',{action,id});};
  return {
    read:()=>api('teacher'),
    saveStudent:(input,id)=>save('saveStudent',input,id),deleteStudent:id=>remove('deleteStudent',id),
    savePlan:(input,id)=>save('savePlan',input,id),deletePlan:id=>remove('deletePlan',id),
    saveAssessment:(input,id)=>save('saveAssessment',input,id),deleteAssessment:id=>remove('deleteAssessment',id),
    saveExercise:(input,id)=>save('saveExercise',input,id),deleteExercise:id=>remove('deleteExercise',id),
    saveProfile:async input=>{await save('saveProfile',input);},
    loadDemo:async()=>{throw new Error('Demonstrações não são inseridas no banco de dados.');},
  };
}
