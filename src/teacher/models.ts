export interface TeacherIdentity { id: string; login: string; name: string; email: string }
export interface TeacherSession { role: "PROFESSOR"; teacherId: string }
export interface TeacherProfile { name: string; email: string; phone: string; specialty: string }
export interface Student {
  id: string; teacherId: string; role: "ALUNO"; name: string; email: string; phone: string;
  birthDate: string; goal: string; status: "ATIVO" | "INATIVO"; notes: string; createdAt: string;
}
export interface PlanExercise {
  id: string; name: string; muscleGroup: string; sets: number; reps: string; load: number;
  rest: number; instructions: string; libraryId?: string;
}
export interface TrainingPlan {
  id: string; teacherId: string; studentId: string; name: string; description: string;
  status: "RASCUNHO" | "ATIVO"; duration: number; exercises: PlanExercise[]; updatedAt: string;
}
export interface Assessment {
  id: string; teacherId: string; studentId: string; date: string; weight: number; height: number;
  waist: number | null; hip: number | null; bodyFat: number | null; notes: string;
}
export interface LibraryExercise {
  id: string; teacherId: string; name: string; muscleGroup: string; equipment: string;
  instructions: string; imageUrl: string;
}
export interface Activity { id: string; teacherId: string; title: string; at: string }
export interface TeacherSnapshot {
  profile: TeacherProfile; students: Student[]; plans: TrainingPlan[];
  assessments: Assessment[]; library: LibraryExercise[]; activities: Activity[];
}
export interface TeacherDatabase {
  version: 1; profiles: Record<string, TeacherProfile>; students: Student[]; plans: TrainingPlan[];
  assessments: Assessment[]; library: LibraryExercise[]; activities: Activity[];
}
export type StudentInput = Omit<Student, "id" | "teacherId" | "role" | "createdAt">;
export type PlanInput = Omit<TrainingPlan, "id" | "teacherId" | "updatedAt">;
export type AssessmentInput = Omit<Assessment, "id" | "teacherId">;
export type LibraryInput = Omit<LibraryExercise, "id" | "teacherId">;
export interface TeacherRepository {
  read(): Promise<TeacherSnapshot>;
  saveStudent(input: StudentInput, id?: string): Promise<string>;
  deleteStudent(id: string): Promise<void>;
  savePlan(input: PlanInput, id?: string): Promise<string>;
  deletePlan(id: string): Promise<void>;
  saveAssessment(input: AssessmentInput, id?: string): Promise<string>;
  deleteAssessment(id: string): Promise<void>;
  saveExercise(input: LibraryInput, id?: string): Promise<string>;
  deleteExercise(id: string): Promise<void>;
  saveProfile(input: TeacherProfile): Promise<void>;
  loadDemo(): Promise<void>;
}
