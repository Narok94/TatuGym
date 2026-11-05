import { localDate, uid } from "../store";
import { teacherIdentity } from "./devAuth";
import type { AssessmentInput, LibraryInput, PlanInput, StudentInput, TeacherDatabase, TeacherProfile, TeacherRepository } from "./models";

export const TEACHER_STORAGE_KEY = "tatugym:dev:teacher-workspace:v1";
function readDatabase(): TeacherDatabase {
  const raw = localStorage.getItem(TEACHER_STORAGE_KEY);
  if (!raw) return { version: 1, profiles: {}, students: [], plans: [], assessments: [], library: [], activities: [] };
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error("Não foi possível ler os dados locais do professor. O conteúdo original foi preservado; guarde uma cópia antes de corrigir o armazenamento."); }
  if (!data || data.version !== 1 || !data.profiles || typeof data.profiles !== "object" || Array.isArray(data.profiles) || ![data.students, data.plans, data.assessments, data.library, data.activities].every(Array.isArray)) {
    throw new Error("Dados locais incompatíveis. O conteúdo foi preservado; faça uma cópia antes de corrigir o armazenamento.");
  }
  return data;
}
function text(value: string, label: string, limit = 200) {
  if (!value.trim() || value.trim().length > limit) throw new Error(`${label}: preencha até ${limit} caracteres.`);
}
function email(value: string) { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Informe um e-mail válido."); }
function number(value: number, min: number, max: number, label: string) {
  if (!Number.isFinite(value) || value < min || value > max) throw new Error(`${label}: valor inválido.`);
}
function date(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || localDate(parsed) !== value || value > localDate()) throw new Error("Informe uma data válida, até hoje.");
}
export function createTeacherRepository(teacherId: string): TeacherRepository {
  const identity = teacherIdentity(teacherId);
  const owned = (rows: { id: string; teacherId: string }[], id: string) => {
    if (!rows.some(row => row.id === id && row.teacherId === teacherId)) throw new Error("Registro não disponível para este professor.");
  };
  const student = (data: TeacherDatabase, id: string) => owned(data.students, id);
  const transact = (action: (data: TeacherDatabase) => string | void, title: string) => {
    const data = readDatabase();
    const result = action(data);
    data.activities.unshift({ id: uid(), teacherId, title, at: new Date().toISOString() });
    try { localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(data)); }
    catch { throw new Error("Não foi possível salvar no navegador. Verifique o espaço disponível; nenhuma alteração foi gravada."); }
    return result;
  };
  return {
    read() {
      const data = readDatabase();
      return { profile: data.profiles[teacherId] ?? { name: identity.name, email: identity.email, phone: "", specialty: "" },
        students: data.students.filter(row => row.teacherId === teacherId), plans: data.plans.filter(row => row.teacherId === teacherId),
        assessments: data.assessments.filter(row => row.teacherId === teacherId), library: data.library.filter(row => row.teacherId === teacherId),
        activities: data.activities.filter(row => row.teacherId === teacherId) };
    },
    saveStudent(input: StudentInput, id?: string) {
      text(input.name, "Nome", 100); const normalized = input.email.trim().toLowerCase(); email(normalized);
      if (input.birthDate) date(input.birthDate);
      if (!["ATIVO", "INATIVO"].includes(input.status)) throw new Error("Situação inválida.");
      return transact(data => {
        if (id) owned(data.students, id);
        if (data.students.some(row => row.email === normalized && row.id !== id)) throw new Error("Este e-mail já possui uma conta de aluno vinculada a um professor.");
        const current = data.students.find(row => row.id === id);
        const entry = { ...input, name: input.name.trim(), email: normalized, id: id ?? uid(), teacherId, role: "ALUNO" as const, createdAt: current?.createdAt ?? new Date().toISOString() };
        if (current) data.students[data.students.indexOf(current)] = entry; else data.students.push(entry);
        return entry.id;
      }, id ? "Cadastro de aluno atualizado" : "Nova conta local de aluno criada") as string;
    },
    deleteStudent(id) {
      transact(data => { owned(data.students, id); data.students = data.students.filter(row => row.id !== id);
        data.plans = data.plans.filter(row => row.teacherId !== teacherId || row.studentId !== id);
        data.assessments = data.assessments.filter(row => row.teacherId !== teacherId || row.studentId !== id);
      }, "Aluno e registros vinculados excluídos");
    },
    savePlan(input: PlanInput, id?: string) {
      text(input.name, "Nome do treino", 100); number(input.duration, 1, 600, "Duração");
      if (!["ATIVO", "RASCUNHO"].includes(input.status) || !input.exercises.length) throw new Error("Adicione pelo menos um exercício e informe a situação.");
      for (const exercise of input.exercises) {
        text(exercise.name, "Exercício", 100); text(exercise.reps, "Repetições", 30);
        number(exercise.sets, 1, 30, "Séries"); if (!Number.isInteger(exercise.sets)) throw new Error("Séries devem ser inteiras.");
        number(exercise.load, 0, 2000, "Carga"); number(exercise.rest, 0, 1800, "Descanso");
      }
      return transact(data => { if (id) owned(data.plans, id); if (input.studentId) student(data, input.studentId);
        for (const exercise of input.exercises) if (exercise.libraryId) owned(data.library, exercise.libraryId);
        const entry = { ...input, id: id ?? uid(), teacherId, updatedAt: new Date().toISOString() };
        const index = data.plans.findIndex(row => row.id === id);
        if (index >= 0) data.plans[index] = entry; else data.plans.push(entry); return entry.id;
      }, id ? "Treino atualizado" : "Treino criado") as string;
    },
    deletePlan(id) { transact(data => { owned(data.plans, id); data.plans = data.plans.filter(row => row.id !== id); }, "Treino excluído"); },
    saveAssessment(input: AssessmentInput, id?: string) {
      date(input.date); number(input.weight, 10, 500, "Peso"); number(input.height, 50, 250, "Altura");
      for (const [label, value] of [["Cintura", input.waist], ["Quadril", input.hip], ["Gordura corporal", input.bodyFat]] as const) if (value !== null) number(value, 0, label === "Gordura corporal" ? 100 : 300, label);
      return transact(data => { if (id) owned(data.assessments, id); student(data, input.studentId);
        const entry = { ...input, id: id ?? uid(), teacherId }; const index = data.assessments.findIndex(row => row.id === id);
        if (index >= 0) data.assessments[index] = entry; else data.assessments.push(entry); return entry.id;
      }, id ? "Avaliação física atualizada" : "Avaliação física registrada") as string;
    },
    deleteAssessment(id) { transact(data => { owned(data.assessments, id); data.assessments = data.assessments.filter(row => row.id !== id); }, "Avaliação física excluída"); },
    saveExercise(input: LibraryInput, id?: string) {
      text(input.name, "Nome", 100); text(input.muscleGroup, "Grupo muscular", 100);
      if (input.imageUrl) { let url: URL; try { url = new URL(input.imageUrl); } catch { throw new Error("Informe uma URL válida para a imagem."); }
        if (!["https:", "http:"].includes(url.protocol)) throw new Error("A imagem deve usar HTTP ou HTTPS."); }
      return transact(data => { if (id) owned(data.library, id); const entry = { ...input, id: id ?? uid(), teacherId };
        const index = data.library.findIndex(row => row.id === id); if (index >= 0) data.library[index] = entry; else data.library.push(entry); return entry.id;
      }, id ? "Exercício da biblioteca atualizado" : "Exercício adicionado à biblioteca") as string;
    },
    deleteExercise(id) { transact(data => { owned(data.library, id); data.library = data.library.filter(row => row.id !== id);
      data.plans = data.plans.map(plan => plan.teacherId !== teacherId ? plan : { ...plan, exercises: plan.exercises.map(exercise => exercise.libraryId === id ? { ...exercise, libraryId: undefined } : exercise) });
    }, "Exercício excluído da biblioteca"); },
    saveProfile(input: TeacherProfile) { text(input.name, "Nome", 100); email(input.email); transact(data => { data.profiles[teacherId] = input; }, "Configurações do professor atualizadas"); },
    loadDemo() {
      transact(data => {
        if (data.students.some(row => row.teacherId === teacherId) || data.plans.some(row => row.teacherId === teacherId) || data.assessments.some(row => row.teacherId === teacherId)) throw new Error("Use a demonstração apenas em um espaço vazio para não misturar seus cadastros.");
        const now = new Date(); const daysAgo = (days: number) => { const d = new Date(now); d.setDate(d.getDate() - days); return localDate(d); };
        const first = uid(), second = uid();
        data.students.push(...[[first, "Ana — demonstração"], [second, "Bruno — demonstração"]].map(([id, name]) => ({ id, teacherId, role: "ALUNO" as const, name, email: `${id}@demo.test`, phone: "", birthDate: "", goal: "Condicionamento", status: "ATIVO" as const, notes: "Registro fictício para testes.", createdAt: now.toISOString() })));
        for (const [offset, weight] of [[60, 76], [30, 75], [0, 74]]) data.assessments.push({ id: uid(), teacherId, studentId: first, date: daysAgo(offset), weight, height: 170, waist: 82 - (60 - offset) / 30, hip: 98, bodyFat: null, notes: "Medição simulada" });
        data.plans.push({ id: uid(), teacherId, studentId: first, name: "Adaptação — demonstração", description: "Plano fictício, editável para testar os formulários.", status: "RASCUNHO", duration: 30, updatedAt: now.toISOString(), exercises: [{ id: uid(), name: "Agachamento livre", muscleGroup: "Pernas", sets: 3, reps: "10–12", load: 0, rest: 60, instructions: "Exemplo de cadastro; ajustar conforme avaliação individual." }] });
      }, "Dados fictícios de demonstração carregados");
    },
  };
}
