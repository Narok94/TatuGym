import type { TeacherIdentity, TeacherSession } from "./models";

// Simulation only. This module and its test credentials must not enter production bundles.
export const devTeachers: TeacherIdentity[] = [
  { id: "teacher-demo-1", login: "professor", name: "Professor TatuGym", email: "professor@example.test" },
  { id: "teacher-demo-2", login: "professor2", name: "Professor 2", email: "professor2@example.test" },
];
const sessionKey = "tatugym:dev:teacher-session:v1";
export function teacherIdentity(id: string) {
  if (!import.meta.env.DEV) throw new Error("Ambiente de teste indisponível.");
  const identity = devTeachers.find(account => account.id === id);
  if (!identity) throw new Error("Perfil de professor inválido.");
  return identity;
}
export function readTeacherSession(): TeacherSession | null {
  if (!import.meta.env.DEV) return null;
  try {
    const session = JSON.parse(sessionStorage.getItem(sessionKey) ?? "null");
    return session?.role === "PROFESSOR" && devTeachers.some(account => account.id === session.teacherId) ? session : null;
  } catch { return null; }
}
export function loginTeacher(login: string, password: string): TeacherSession {
  if (!import.meta.env.DEV) throw new Error("Acesso de teste indisponível.");
  const account = devTeachers.find(account => account.login === login.trim().toLowerCase());
  if (!account || password !== "123") throw new Error("Usuário ou senha de teste inválidos.");
  const session: TeacherSession = { role: "PROFESSOR", teacherId: account.id };
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}
export function logoutTeacher() { sessionStorage.removeItem(sessionKey); }
