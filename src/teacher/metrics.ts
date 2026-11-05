import type { Assessment, TeacherSnapshot } from "./models";

export function monthlyAssessments(assessments: Assessment[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { label: date.toLocaleDateString("pt-BR", { month: "short" }), value: assessments.filter(item => item.date.startsWith(month)).length };
  });
}
export function studentAssessments(snapshot: TeacherSnapshot, studentId: string) {
  return snapshot.assessments.filter(item => item.studentId === studentId).sort((a, b) => a.date.localeCompare(b.date));
}
export function exportAssessments(snapshot: TeacherSnapshot, studentId: string, start: string, end: string) {
  const rows = snapshot.assessments.filter(item => (!studentId || item.studentId === studentId) && (!start || item.date >= start) && (!end || item.date <= end)).sort((a, b) => a.date.localeCompare(b.date));
  const csvValue = (value: unknown) => { let text = String(value ?? ""); if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`; return `"${text.replaceAll('"', '""')}"`; };
  const table = [["Aluno", "Data", "Peso (kg)", "Altura (cm)", "Cintura (cm)", "Quadril (cm)", "Gordura (%)"],
    ...rows.map(item => [snapshot.students.find(student => student.id === item.studentId)?.name ?? "Aluno removido", item.date, item.weight, item.height, item.waist, item.hip, item.bodyFat])];
  return { rows, csv: "\ufeff" + table.map(row => row.map(csvValue).join(";")).join("\r\n") };
}
