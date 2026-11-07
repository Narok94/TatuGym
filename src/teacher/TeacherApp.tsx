import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, BookOpen, ClipboardList, Dumbbell, LayoutDashboard, LogOut, Menu, Settings, TrendingUp, Users, X } from "lucide-react";
import { Brand, Modal } from "../components/UI";
import { Anatomy } from "../components/Anatomy";
import { createTeacherRepository } from "./repository";
import { monthlyAssessments } from "./metrics";
import { TeacherChart } from "./Charts";
import type { Assessment, LibraryExercise, Student, TeacherSnapshot, TrainingPlan } from "./models";
import { AssessmentEditor, LibraryEditor, PlanEditor, StudentEditor } from "./Forms";
import { AssessmentsPage, EvolutionPage, LibraryPage, PlansPage, ReportsPage, SettingsPage, StudentsPage } from "./Pages";
import "./teacher.css";

const pages = [
  { id: "dashboard", name: "Dashboard", icon: LayoutDashboard }, { id: "alunos", name: "Alunos", icon: Users },
  { id: "treinos", name: "Treinos", icon: Dumbbell }, { id: "avaliacoes", name: "Avaliações físicas", icon: ClipboardList },
  { id: "evolucao", name: "Evolução", icon: TrendingUp }, { id: "relatorios", name: "Relatórios", icon: Activity },
  { id: "biblioteca", name: "Biblioteca de exercícios", icon: BookOpen }, { id: "configuracoes", name: "Configurações", icon: Settings },
];
export default function TeacherApp({ teacherId, route, leave }: { teacherId: string; route: string; leave: (student: boolean) => void }) {
  const repository = useMemo(() => createTeacherRepository(teacherId), [teacherId]);
  const [snapshot, setSnapshot] = useState<TeacherSnapshot | null>(null);
  const [error, setError] = useState(""); const [menu, setMenu] = useState(false);
  const [studentEditor, setStudentEditor] = useState<{ student?: Student } | null>(null);
  const [planEditor, setPlanEditor] = useState<{ plan?: TrainingPlan } | null>(null);
  const [assessmentEditor, setAssessmentEditor] = useState<{ assessment?: Assessment } | null>(null);
  const [libraryEditor, setLibraryEditor] = useState<{ exercise?: LibraryExercise } | null>(null);
  const [deleting, setDeleting] = useState<{ title: string; description: string; run: () => Promise<void> } | null>(null);
  const [notice, setNotice] = useState("");
  const page = pages.find(item => item.id === route.split("/")[1]) ?? pages[0];
  const refresh = async () => { try { setSnapshot(await repository.read()); setError(""); } catch (reason) { setError((reason as Error).message); } };
  const perform = async (action: () => Promise<unknown>) => { try { await action(); await refresh(); setNotice("Alteração salva no servidor."); } catch (reason) { setError((reason as Error).message); } };
  useEffect(() => { void refresh(); }, [repository]);
  useEffect(() => { const previous = document.documentElement.dataset.theme; document.documentElement.dataset.theme = "dark"; return () => { document.documentElement.dataset.theme = previous; }; }, []);
  useEffect(() => { setMenu(false); setNotice(""); window.scrollTo(0, 0); }, [route]);
  let content: ReactNode = null;
  if (snapshot) {
    switch (page.id) {
      case "dashboard": content = <TeacherDashboard snapshot={snapshot} />; break;
      case "alunos": content = <StudentsPage snapshot={snapshot} edit={student => setStudentEditor({ student })} remove={student => setDeleting({ title: `Excluir ${student.name}?`, description: "O cadastro será marcado como inativo. Treinos e avaliações serão preservados.", run: () => repository.deleteStudent(student.id) })} />; break;
      case "treinos": content = <PlansPage snapshot={snapshot} edit={plan => setPlanEditor({ plan })} remove={plan => setDeleting({ title: `Excluir ${plan.name}?`, description: "Este plano será arquivado. A conta do aluno será preservada.", run: () => repository.deletePlan(plan.id) })} duplicate={plan => perform(async () => { await repository.savePlan({ ...plan, name: `${plan.name} (cópia)`, status: "RASCUNHO" }); })} />; break;
      case "avaliacoes": content = <AssessmentsPage snapshot={snapshot} edit={assessment => setAssessmentEditor({ assessment })} remove={assessment => setDeleting({ title: "Excluir avaliação?", description: "Esta medição será arquivada. As demais avaliações serão preservadas.", run: () => repository.deleteAssessment(assessment.id) })} />; break;
      case "evolucao": content = <EvolutionPage key={route} snapshot={snapshot} initialStudentId={route.split("/")[2]} />; break;
      case "relatorios": content = <ReportsPage snapshot={snapshot} />; break;
      case "biblioteca": content = <LibraryPage snapshot={snapshot} edit={exercise => setLibraryEditor({ exercise })} remove={exercise => setDeleting({ title: `Excluir ${exercise.name}?`, description: "O exercício será removido da biblioteca. Treinos já criados mantêm sua cópia das instruções.", run: () => repository.deleteExercise(exercise.id) })} />; break;
      case "configuracoes": content = <SettingsPage snapshot={snapshot} onLogout={() => leave(false)} save={async profile => { await repository.saveProfile(profile); await refresh(); setNotice("Configurações salvas no servidor."); }} />; break;
    }
  }
  return <div className="teacher-scope teacher-shell app-shell">
    {menu && <button className="teacher-backdrop" aria-label="Fechar menu lateral" onClick={() => setMenu(false)} />}
    <aside className={`teacher-sidebar${menu ? " is-open" : ""}`}><Brand /><span className="teacher-role">PROFESSOR</span>
      <nav aria-label="Menu do professor">{pages.map(item => <a key={item.id} href={`#professor/${item.id}`} onClick={() => setMenu(false)} aria-current={page.id === item.id ? "page" : undefined}><item.icon size={19} />{item.name}</a>)}</nav>
      <div className="teacher-sidebar-bottom"><small>Seu treino. Sua turma.<br />Um passo de cada vez.</small>
        <button onClick={() => leave(true)}><Users size={17} />Ambiente do aluno</button><button onClick={() => leave(false)}><LogOut size={17} />Sair</button></div>
    </aside>
    <div className="teacher-body"><header className="teacher-topbar"><button className="teacher-menu-button icon-button" aria-label={menu ? "Fechar menu" : "Abrir menu"} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button>
      <div><p className="teacher-kicker">ESPAÇO DO PROFESSOR</p><strong>{page.name}</strong></div>
      <div className="teacher-account-actions"><a className="teacher-user" href="#professor/configuracoes"><span>{snapshot?.profile.name ?? "Professor"}</span><b>{snapshot?.profile.name.charAt(0) ?? "P"}</b></a>
        <button className="teacher-logout" aria-label="Sair da conta" onClick={() => leave(false)}><LogOut size={18} />Sair</button></div>
    </header>
      <p className="teacher-local-notice">Dados sincronizados com segurança na sua conta FORJA.</p>
      <main className="teacher-content" id="teacher-content">
        {error && <div className="teacher-error" role="alert">{error}<button className="button secondary" onClick={refresh}>Tentar novamente</button></div>}
        {notice && <p role="status" className="teacher-success">{notice}</p>}
        {content}
      </main>
    </div>
    {studentEditor && <StudentEditor student={studentEditor.student} close={() => setStudentEditor(null)} save={async (input, id) => { await repository.saveStudent(input, id); await refresh(); setStudentEditor(null); setNotice("Aluno salvo no servidor."); }} />}
    {planEditor && snapshot && <PlanEditor plan={planEditor.plan} students={snapshot.students} library={snapshot.library} close={() => setPlanEditor(null)} save={async (input, id) => { await repository.savePlan(input, id); await refresh(); setPlanEditor(null); setNotice("Treino salvo no servidor."); }} />}
    {assessmentEditor && snapshot && <AssessmentEditor assessment={assessmentEditor.assessment} students={snapshot.students} close={() => setAssessmentEditor(null)} save={async (input, id) => { await repository.saveAssessment(input, id); await refresh(); setAssessmentEditor(null); setNotice("Avaliação salva no servidor."); }} />}
    {libraryEditor && <LibraryEditor exercise={libraryEditor.exercise} close={() => setLibraryEditor(null)} save={async (input, id) => { await repository.saveExercise(input, id); await refresh(); setLibraryEditor(null); setNotice("Exercício salvo na biblioteca."); }} />}
    {deleting && <Modal title={deleting.title} onClose={() => setDeleting(null)}><p className="teacher-delete-note">{deleting.description}</p><div className="teacher-form-actions"><button className="button secondary" onClick={() => setDeleting(null)}>Cancelar</button><button className="button primary" onClick={async () => { try { await deleting.run(); await refresh(); setDeleting(null); setNotice("Registro excluído."); } catch (reason) { setError((reason as Error).message); setDeleting(null); } }}>Confirmar exclusão</button></div></Modal>}
  </div>;
}
function TeacherDashboard({ snapshot }: { snapshot: TeacherSnapshot }) {
  const stats = [
    { name: "Alunos ativos", value: snapshot.students.filter(item => item.status === "ATIVO").length, icon: Users },
    { name: "Treinos ativos", value: snapshot.plans.filter(item => item.status === "ATIVO").length, icon: Dumbbell },
    { name: "Avaliações registradas", value: snapshot.assessments.length, icon: ClipboardList },
    { name: "Exercícios na biblioteca", value: snapshot.library.length, icon: BookOpen },
  ];
  return <>
    <div className="teacher-page-heading"><div><p className="teacher-kicker">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p><h1>Olá, {snapshot.profile.name}.</h1><p>Acompanhe cada aluno, valorize cada conquista.</p></div><a className="button primary" href="#professor/alunos">Gerenciar alunos</a></div>
    <div className="teacher-stats">{stats.map(stat => <div className="teacher-panel teacher-stat" key={stat.name}><stat.icon size={21} /><strong>{stat.value}</strong><span>{stat.name}</span></div>)}</div>
    <div className="teacher-dashboard-columns"><section className="teacher-panel teacher-welcome"><div><p className="teacher-kicker">SUA TURMA, SEU ACOMPANHAMENTO</p><h2>Constância se constrói em conjunto.</h2><p>Cadastre seus alunos, organize os treinos e registre avaliações para acompanhar a evolução.</p>
      <a className="button primary" href="#professor/treinos">Organizar treinos</a></div><Anatomy group="push" /></section>
      <section className="teacher-panel"><h2>Avaliações por mês</h2><TeacherChart title="Avaliações nos últimos seis meses" data={monthlyAssessments(snapshot.assessments)} bars /></section></div>
    <div className="teacher-dashboard-columns"><section className="teacher-panel"><div className="teacher-section-heading"><h2>Atividades recentes</h2><span>{snapshot.activities.length} registros</span></div>
      {snapshot.activities.length ? <ul className="teacher-activity">{snapshot.activities.slice(0, 7).map(item => <li key={item.id}><span className="pulse-dot" /><div>{item.title}<small>{new Date(item.at).toLocaleString("pt-BR")}</small></div></li>)}</ul> : <p className="teacher-empty">Seus cadastros e atualizações aparecerão aqui.</p>}</section>
      <section className="teacher-panel"><h2>Comece pelo essencial</h2><div className="teacher-quick-links"><a href="#professor/alunos">Cadastrar e acompanhar alunos <Users size={18} /></a><a href="#professor/avaliacoes">Registrar avaliação física <ClipboardList size={18} /></a><a href="#professor/biblioteca">Organizar sua biblioteca <BookOpen size={18} /></a></div>
</section></div>
  </>;
}
