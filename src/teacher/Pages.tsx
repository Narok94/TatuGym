import { useState } from "react";
import type { ReactNode } from "react";
import { Copy, Download, Dumbbell, LogOut, Pencil, Plus, Printer, Trash2, TrendingUp } from "lucide-react";
import type { Assessment, LibraryExercise, Student, TeacherProfile, TeacherSnapshot, TrainingPlan } from "./models";
import { exportAssessments, studentAssessments } from "./metrics";
import { TeacherChart } from "./Charts";
import { localDate } from "../store";
import { value } from "./Forms";

export function PageHeading({ title, description, action, actionLabel }: { title: string; description: string; action?: () => void; actionLabel?: string }) {
  return <div className="teacher-page-heading"><div><h1>{title}</h1><p>{description}</p></div>{action && <button className="button primary" onClick={action}><Plus size={16} />{actionLabel}</button>}</div>;
}
export function TeacherTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return <div className="teacher-table-wrap"><table className="teacher-table"><thead><tr>{columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
export function Empty({ children }: { children: ReactNode }) { return <p className="teacher-empty">{children}</p>; }
export function EditActions({ name, edit, remove, children }: { name: string; edit: () => void; remove: () => void; children?: ReactNode }) {
  return <div className="teacher-row-actions">{children}<button className="icon-button" aria-label={`Editar ${name}`} onClick={edit}><Pencil size={16} /></button><button className="icon-button teacher-danger" aria-label={`Excluir ${name}`} onClick={remove}><Trash2 size={16} /></button></div>;
}
export function StudentsPage({ snapshot, edit, remove }: { snapshot: TeacherSnapshot; edit: (student?: Student) => void; remove: (student: Student) => void }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("");
  const students = snapshot.students.filter(student => `${student.name} ${student.email}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")) && (!status || student.status === status)).sort((a, b) => a.name.localeCompare(b.name));
  return <><PageHeading title="Seus alunos" description="Cadastros locais, objetivos e planos em um só lugar." action={() => edit()} actionLabel="Cadastrar aluno" />
    <section className="teacher-panel"><div className="teacher-filters"><label>Buscar alunos<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome ou e-mail" /></label>
      <label>Filtrar situação<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todas</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option></select></label></div>
      <TeacherTable columns={["Aluno", "Objetivo", "Situação", "Treinos", "Ações"]}>{students.map(student => <tr key={student.id}>
        <td data-label="Aluno"><strong>{student.name}</strong><small>{student.email}</small><small>{student.phone}</small></td><td data-label="Objetivo">{student.goal || "—"}</td>
        <td data-label="Situação"><span className={`teacher-status ${student.status === "ATIVO" ? "is-active" : ""}`}>{student.status === "ATIVO" ? "Ativo" : "Inativo"}</span></td>
        <td data-label="Treinos">{snapshot.plans.filter(plan => plan.studentId === student.id).length}</td>
        <td data-label="Ações"><EditActions name={student.name} edit={() => edit(student)} remove={() => remove(student)}><a className="icon-button" aria-label={`Ver evolução de ${student.name}`} href={`#professor/evolucao/${student.id}`}><TrendingUp size={17} /></a></EditActions></td>
      </tr>)}</TeacherTable>{!students.length && <Empty>{snapshot.students.length ? "Nenhum aluno corresponde aos filtros." : "Sua turma começa aqui. Cadastre seu primeiro aluno."}</Empty>}
    </section></>;
}
export function PlansPage({ snapshot, edit, remove, duplicate }: { snapshot: TeacherSnapshot; edit: (plan?: TrainingPlan) => void; remove: (plan: TrainingPlan) => void; duplicate: (plan: TrainingPlan) => void }) {
  const [query, setQuery] = useState(""); const [studentId, setStudentId] = useState("");
  const plans = snapshot.plans.filter(plan => plan.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && (!studentId || plan.studentId === studentId));
  return <><PageHeading title="Treinos da turma" description="Crie modelos, organize exercícios e vincule os planos aos seus alunos." action={() => edit()} actionLabel="Criar treino" />
    <section className="teacher-panel"><div className="teacher-filters"><label>Buscar treinos<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label><label>Filtrar aluno<select value={studentId} onChange={event => setStudentId(event.target.value)}><option value="">Todos os alunos e modelos</option>{snapshot.students.map(student => <option value={student.id} key={student.id}>{student.name}</option>)}</select></label></div>
      <TeacherTable columns={["Treino", "Aluno", "Exercícios", "Situação", "Ações"]}>{plans.map(plan => <tr key={plan.id}><td data-label="Treino"><strong>{plan.name}</strong><small>{plan.duration} min · atualizado em {new Date(plan.updatedAt).toLocaleDateString("pt-BR")}</small></td><td data-label="Aluno">{snapshot.students.find(student => student.id === plan.studentId)?.name ?? "Modelo"}</td><td data-label="Exercícios">{plan.exercises.length}</td><td data-label="Situação"><span className={`teacher-status ${plan.status === "ATIVO" ? "is-active" : ""}`}>{plan.status === "ATIVO" ? "Ativo" : "Rascunho"}</span></td><td data-label="Ações"><EditActions name={plan.name} edit={() => edit(plan)} remove={() => remove(plan)}><button className="icon-button" aria-label={`Duplicar ${plan.name}`} onClick={() => duplicate(plan)}><Copy size={16} /></button></EditActions></td></tr>)}</TeacherTable>
      {!plans.length && <Empty>{snapshot.plans.length ? "Nenhum treino corresponde aos filtros." : "Crie um treino ou um modelo para começar."}</Empty>}
    </section></>;
}
export const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
export function AssessmentsPage({ snapshot, edit, remove }: { snapshot: TeacherSnapshot; edit: (assessment?: Assessment) => void; remove: (assessment: Assessment) => void }) {
  const [studentId, setStudentId] = useState("");
  const assessments = snapshot.assessments.filter(item => !studentId || item.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
  return <><PageHeading title="Avaliações físicas" description="Registre as medidas de cada aluno e preserve seu acompanhamento ao longo do tempo." action={snapshot.students.length ? () => edit() : undefined} actionLabel="Registrar avaliação" />
    <section className="teacher-panel"><div className="teacher-filters"><label>Aluno nas avaliações<select value={studentId} onChange={event => setStudentId(event.target.value)}><option value="">Todos os alunos</option>{snapshot.students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label></div>
      <TeacherTable columns={["Aluno", "Data", "Peso", "Cintura", "Ações"]}>{assessments.map(item => {
        const name = snapshot.students.find(student => student.id === item.studentId)?.name ?? "Aluno";
        return <tr key={item.id}><td data-label="Aluno"><strong>{name}</strong><small>{item.notes}</small></td><td data-label="Data">{formatDate(item.date)}</td><td data-label="Peso">{item.weight.toLocaleString("pt-BR")} kg</td><td data-label="Cintura">{item.waist === null ? "—" : `${item.waist.toLocaleString("pt-BR")} cm`}</td><td data-label="Ações"><EditActions name={`avaliação de ${name} em ${formatDate(item.date)}`} edit={() => edit(item)} remove={() => remove(item)} /></td></tr>;
      })}</TeacherTable>
      {!assessments.length && <Empty>{snapshot.students.length ? "Nenhuma avaliação registrada para esta seleção." : <a href="#professor/alunos">Cadastre um aluno antes de registrar uma avaliação.</a>}</Empty>}
    </section></>;
}
export function EvolutionPage({ snapshot, initialStudentId }: { snapshot: TeacherSnapshot; initialStudentId?: string }) {
  const [studentId, setStudentId] = useState(initialStudentId ?? snapshot.students[0]?.id ?? "");
  const [metric, setMetric] = useState<"weight" | "waist" | "bodyFat">("weight");
  const student = snapshot.students.find(item => item.id === studentId);
  const assessments = studentAssessments(snapshot, studentId);
  const first = assessments[0], last = assessments.at(-1);
  const metrics = { weight: { label: "Peso", unit: " kg" }, waist: { label: "Cintura", unit: " cm" }, bodyFat: { label: "Gordura corporal", unit: "%" } };
  const points = assessments.filter(item => item[metric] !== null).map(item => ({ label: formatDate(item.date).slice(0, 5), value: item[metric] as number }));
  return <><PageHeading title="Evolução dos alunos" description="Compare medições cadastradas, sem estimativas ou resultados fictícios automáticos." />
    <section className="teacher-panel"><div className="teacher-filters"><label>Aluno na evolução<select value={studentId} onChange={event => setStudentId(event.target.value)}><option value="">Selecione um aluno</option>{snapshot.students.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Medida no gráfico<select value={metric} onChange={event => setMetric(event.target.value as typeof metric)}><option value="weight">Peso</option><option value="waist">Cintura</option><option value="bodyFat">Gordura corporal</option></select></label></div>
      <h2>{student ? `Acompanhamento de ${student.name}` : "Selecione um aluno"}</h2>
      {last && first && <div className="teacher-evolution-stats"><div><small>Primeiro peso</small><strong>{first.weight.toLocaleString("pt-BR")} kg</strong></div><div><small>Último peso</small><strong>{last.weight.toLocaleString("pt-BR")} kg</strong></div><div><small>Variação registrada</small><strong>{(last.weight - first.weight).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg</strong></div><div><small>Avaliações</small><strong>{assessments.length}</strong></div></div>}
      <TeacherChart title={`Evolução de ${metrics[metric].label.toLowerCase()}${student ? ` de ${student.name}` : ""}`} data={points} unit={metrics[metric].unit} />
      <p className="teacher-help">{student?.goal ? `Objetivo cadastrado: ${student.goal}. ` : ""}Medidas informadas pelo professor; não são dados sincronizados do aplicativo do aluno.</p>
    </section></>;
}
function ExerciseThumbnail({ source }: { source: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="teacher-exercise-thumbnail">{source && !failed ? <img src={source} alt="" loading="lazy" onError={() => setFailed(true)} /> : <Dumbbell size={24} />}</span>;
}
export function LibraryPage({ snapshot, edit, remove }: { snapshot: TeacherSnapshot; edit: (exercise?: LibraryExercise) => void; remove: (exercise: LibraryExercise) => void }) {
  const [query, setQuery] = useState(""); const [group, setGroup] = useState("");
  const groups = [...new Set(snapshot.library.map(item => item.muscleGroup))].sort();
  const exercises = snapshot.library.filter(item => `${item.name} ${item.equipment}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()) && (!group || item.muscleGroup === group));
  return <><PageHeading title="Biblioteca de exercícios" description="Sua biblioteca começa vazia. Cadastre os movimentos e adicione imagens reais quando estiverem disponíveis." action={() => edit()} actionLabel="Cadastrar exercício" />
    <section className="teacher-panel"><div className="teacher-filters"><label>Buscar exercícios<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome ou equipamento" /></label><label>Filtrar grupo muscular<select value={group} onChange={event => setGroup(event.target.value)}><option value="">Todos os grupos</option>{groups.map(item => <option key={item}>{item}</option>)}</select></label></div>
      <div className="teacher-library-grid">{exercises.map(item => <article className="teacher-library-item" key={item.id}><ExerciseThumbnail key={item.imageUrl} source={item.imageUrl} /><div><h2>{item.name}</h2><span className="teacher-status">{item.muscleGroup}</span><p>{item.equipment || "Sem equipamento informado"}</p><p>{item.instructions || "Instruções ainda não cadastradas."}</p>{!item.imageUrl && <small>Imagem real pendente</small>}</div><EditActions name={item.name} edit={() => edit(item)} remove={() => remove(item)} /></article>)}</div>
      {!exercises.length && <Empty>{snapshot.library.length ? "Nenhum exercício corresponde aos filtros." : "Nenhum exercício cadastrado. Sua biblioteca não recebe conteúdo definitivo automaticamente."}</Empty>}
    </section></>;
}
function downloadText(contents: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([contents], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ReportsPage({ snapshot }: { snapshot: TeacherSnapshot }) {
  const [studentId, setStudentId] = useState(""); const [start, setStart] = useState(""); const [end, setEnd] = useState("");
  const invalidRange = !!start && !!end && start > end;
  const report = exportAssessments(snapshot, studentId, start, end);
  const months = [...new Set(report.rows.map(item => item.date.slice(0, 7)))].sort();
  const chart = months.map(month => ({ label: `${month.slice(5)}/${month.slice(0, 4)}`, value: report.rows.filter(item => item.date.startsWith(month)).length }));
  return <><PageHeading title="Relatórios da turma" description="Relatórios calculados a partir dos cadastros e avaliações locais. Sem integração com execução dos alunos nesta fase." />
    <section className="teacher-panel"><div className="teacher-filters teacher-print-hide"><label>Aluno no relatório<select value={studentId} onChange={event => setStudentId(event.target.value)}><option value="">Todos os alunos</option>{snapshot.students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label><label>Período inicial<input type="date" value={start} max={end || undefined} onChange={event => setStart(event.target.value)} /></label><label>Período final<input type="date" value={end} min={start || undefined} onChange={event => setEnd(event.target.value)} /></label></div>
      {invalidRange && <p className="teacher-error" role="alert">O início do período deve ser anterior ao fim.</p>}
      <div className="teacher-report-summary"><span><strong>{report.rows.length}</strong> avaliações no filtro</span><span><strong>{new Set(report.rows.map(item => item.studentId)).size}</strong> alunos avaliados</span><div className="teacher-row-actions teacher-print-hide"><button className="button secondary" disabled={!report.rows.length || invalidRange} onClick={() => downloadText(report.csv, "text/csv;charset=utf-8", `tatugym-relatorio-${localDate()}.csv`)}><Download size={16} />Exportar CSV</button><button className="button secondary" onClick={() => window.print()}><Printer size={16} />Imprimir</button></div></div>
      <h2>Avaliações por mês no período</h2><TeacherChart title="Avaliações por mês no relatório" data={chart} bars />
      <TeacherTable columns={["Aluno", "Data", "Peso", "Altura", "Gordura"]}>{report.rows.map(item => <tr key={item.id}><td data-label="Aluno">{snapshot.students.find(student => student.id === item.studentId)?.name}</td><td data-label="Data">{formatDate(item.date)}</td><td data-label="Peso">{item.weight.toLocaleString("pt-BR")} kg</td><td data-label="Altura">{item.height} cm</td><td data-label="Gordura">{item.bodyFat === null ? "—" : `${item.bodyFat}%`}</td></tr>)}</TeacherTable>
      {!report.rows.length && <Empty>Nenhuma avaliação corresponde ao período e aluno selecionados.</Empty>}
    </section></>;
}
export function SettingsPage({ snapshot, save, onLogout }: { snapshot: TeacherSnapshot; save: (profile: TeacherProfile) => void; onLogout: () => void }) {
  const [error, setError] = useState("");
  return <><PageHeading title="Configurações do professor" description="Atualize seu perfil e guarde uma cópia dos seus dados de teste." />
    <div className="teacher-dashboard-columns"><section className="teacher-panel"><h2>Perfil profissional</h2><form className="teacher-form form-stack" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); try { save({ name: value(form, "name"), email: value(form, "email"), phone: value(form, "phone"), specialty: value(form, "specialty") }); setError(""); } catch (reason) { setError((reason as Error).message); } }}>
      <label>Nome do professor<input name="name" required maxLength={100} defaultValue={snapshot.profile.name} /></label><label>E-mail de contato<input name="email" type="email" required maxLength={200} defaultValue={snapshot.profile.email} /></label><label>Telefone profissional<input name="phone" type="tel" maxLength={30} defaultValue={snapshot.profile.phone} /></label><label>Especialidade<input name="specialty" maxLength={200} defaultValue={snapshot.profile.specialty} /></label>
      {error && <p className="teacher-error" role="alert">{error}</p>}<button className="button primary" type="submit">Salvar configurações</button></form></section>
      <section className="teacher-panel"><h2>Seus dados neste navegador</h2><p className="teacher-form-note">A persistência é local e provisória. Outros dispositivos, navegadores e endereços não compartilham os dados. Limpar o armazenamento do site remove os cadastros. A cópia abaixo contém apenas os registros deste professor.</p>
        <button className="button secondary" onClick={() => downloadText(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: snapshot }, null, 2), "application/json", `tatugym-professor-${localDate()}.json`)}><Download size={16} />Exportar meus dados</button>
        <h2 className="teacher-settings-heading">Próxima integração</h2><p className="teacher-form-note">Autenticação real, credenciais dos alunos, sincronização, upload de imagens e controle de acesso no servidor serão implementados com o backend. O login simulado não é uma barreira de segurança.</p>
        <button className="button secondary" onClick={onLogout}><LogOut size={16} />Sair</button>
      </section></div></>;
}
