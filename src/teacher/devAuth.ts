import type { TeacherIdentity, TeacherSession } from "./models";
import { STORAGE_KEY } from "../store";

export type DevelopmentSession = TeacherSession | { role: "ALUNO"; userId: string; login: "henrique" };
function studentIdentity() {
  try {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")?.user;
    if (typeof user?.id === "string" && typeof user.name === "string") return user;
  } catch { /* Login must not overwrite unreadable student data. */ }
  return { id: "henrique-local", name: "Henrique" };
}

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
export function readDevelopmentSession(): DevelopmentSession | null {
  if (!import.meta.env.DEV) return null;
  try {
    const session = JSON.parse(sessionStorage.getItem(sessionKey) ?? "null");
    if (session?.role === "PROFESSOR" && devTeachers.some(account => account.id === session.teacherId)) return session;
    return session?.role === "ALUNO" && session.login === "henrique" && session.userId === studentIdentity().id ? session : null;
  } catch { return null; }
}
export function readTeacherSession(): TeacherSession | null {
  const session = readDevelopmentSession(); return session?.role === "PROFESSOR" ? session : null;
}
function authenticate(login: string, password: string): DevelopmentSession {
  if (!import.meta.env.DEV) throw new Error("Acesso de teste indisponível.");
  const normalized = login.trim().toLocaleLowerCase("pt-BR");
  const account = devTeachers.find(account => account.login === normalized || account.email.toLowerCase() === normalized);
  if (account && password === "123") return { role: "PROFESSOR", teacherId: account.id };
  if (normalized === "henrique" && password === "9860") return { role: "ALUNO", userId: studentIdentity().id, login: "henrique" };
  throw new Error("Usuário ou senha inválidos. Confira seus dados e tente novamente.");
}
export function loginDevelopment(login: string, password: string): DevelopmentSession {
  const session = authenticate(login, password);
  sessionStorage.setItem(sessionKey, JSON.stringify(session));
  return session;
}
export function loginTeacher(login: string, password: string): TeacherSession {
  const session = authenticate(login, password);
  if (session.role !== "PROFESSOR") throw new Error("Usuário ou senha de teste inválidos.");
  sessionStorage.setItem(sessionKey, JSON.stringify(session)); return session;
}
export function logoutTeacher() { sessionStorage.removeItem(sessionKey); }
