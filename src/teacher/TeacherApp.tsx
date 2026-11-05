import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, BookOpen, ClipboardList, Dumbbell, LayoutDashboard, LogOut, Menu, Settings, TrendingUp, Users, X } from "lucide-react";
import { Brand, Modal } from "../components/UI";
import { Anatomy } from "../components/Anatomy";
import { createTeacherRepository, TEACHER_STORAGE_KEY } from "./repository";
import { monthlyAssessments } from "./metrics";
import { TeacherChart } from "./Charts";
import type { Assessment, LibraryExercise, Student, TeacherRepository, TeacherSnapshot, TrainingPlan } from "./models";
import { AssessmentEditor, LibraryEditor, PlanEditor, StudentEditor } from "./Forms";
import { AssessmentsPage, EvolutionPage, LibraryPage, PlansPage, ReportsPage, SettingsPage, StudentsPage } from "./Pages";

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
  const [deleting, setDeleting] = useState<{ title: string; description: string; run: () => void } | null>(null);
  const [notice, setNotice] = useState("");
  const page = pages.find(item => item.id === route.split("/")[1]) ?? pages[0];
  const refresh = () => { try { setSnapshot(repository.read()); setError(""); } catch (reason) { setError((reason as Error).message); } };
  const perform = (action: () => void) => { try { action(); refresh(); setNotice("Alteração salva neste navegador."); } catch (reason) { setError((reason as Error).message); } };
  useEffect(() => {
    try { setSnapshot(repository.read()); setError(""); } catch (reason) { setError((reason as Error).message); }
    const changed = (event: StorageEvent) => { if (event.key === TEACHER_STORAGE_KEY) { try { setSnapshot(repository.read()); setError(""); } catch (reason) { setError((reason as Error).message); } } };
    window.addEventListener("storage", changed); return () => window.removeEventListener("storage", changed);
  }, [repository]);
  useEffect(() => { const previous = document.documentElement.dataset.theme; document.documentElement.dataset.theme = "dark"; return () => { document.documentElement.dataset.theme = previous; }; }, []);
  useEffect(() => { setMenu(false); setNotice(""); window.scrollTo(0, 0); }, [route]);
  let content: ReactNode = null;
  if (snapshot) {
    switch (page.id) {
      case "dashboard": content = <TeacherDashboard snapshot={snapshot} repository={repository} refresh={refresh} />; break;
      case "alunos": content = <StudentsPage snapshot={snapshot} edit={student => setStudentEditor({ student })} remove={student => setDeleting({ title: `Excluir ${student.name}?`, description: "A conta local, os treinos e as avaliações deste aluno serão excluídos deste navegador. Esta ação não pode ser desfeita.", run: () => repository.deleteStudent(student.id) })} />; break;
      case "treinos": content = <PlansPage snapshot={snapshot} edit={plan => setPlanEditor({ plan })} remove={plan => setDeleting({ title: `Excluir ${plan.name}?`, description: "Este plano local será excluído. A conta do aluno será preservada.", run: () => repository.deletePlan(plan.id) })} duplicate={plan => perform(() => { repository.savePlan({ ...plan, name: `${plan.name} (cópia)`, status: "RASCUNHO" }); })} />; break;
      case "avaliacoes": content = <AssessmentsPage snapshot={snapshot} edit={assessment => setAssessmentEditor({ assessment })} remove={assessment => setDeleting({ title: "Excluir avaliação?", description: "Apenas esta medição local será excluída. As demais avaliações serão preservadas.", run: () => repository.deleteAssessment(assessment.id) })} />; break;
      case "evolucao": content = <EvolutionPage key={route} snapshot={snapshot} initialStudentId={route.split("/")[2]} />; break;
      case "relatorios": content = <ReportsPage snapshot={snapshot} />; break;
      case "biblioteca": content = <LibraryPage snapshot={snapshot} edit={exercise => setLibraryEditor({ exercise })} remove={exercise => setDeleting({ title: `Excluir ${exercise.name}?`, description: "O exercício será removido da biblioteca. Treinos já criados mantêm sua cópia das instruções.", run: () => repository.deleteExercise(exercise.id) })} />; break;
      case "configuracoes": content = <SettingsPage snapshot={snapshot} onLogout={() => leave(false)} save={profile => { repository.saveProfile(profile); refresh(); setNotice("Configurações salvas neste navegador."); }} />; break;
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
      <a className="teacher-user" href="#professor/configuracoes"><span>{snapshot?.profile.name ?? "Professor"}</span><b>{snapshot?.profile.name.charAt(0) ?? "P"}</b></a>
    </header>
      <p className="teacher-local-notice">Desenvolvimento · dados locais e provisórios neste navegador. Sem sincronização ou autenticação de produção.</p>
      <main className="teacher-content" id="teacher-content">
        {error && <div className="teacher-error" role="alert">{error}<button className="button secondary" onClick={refresh}>Tentar novamente</button></div>}
        {notice && <p role="status" className="teacher-success">{notice}</p>}
        {content}
      </main>
    </div>
    {studentEditor && <StudentEditor student={studentEditor.student} close={() => setStudentEditor(null)} save={(input, id) => { repository.saveStudent(input, id); refresh(); setStudentEditor(null); setNotice("Aluno salvo neste navegador."); }} />}
    {planEditor && snapshot && <PlanEditor plan={planEditor.plan} students={snapshot.students} library={snapshot.library} close={() => setPlanEditor(null)} save={(input, id) => { repository.savePlan(input, id); refresh(); setPlanEditor(null); setNotice("Treino salvo neste navegador."); }} />}
    {assessmentEditor && snapshot && <AssessmentEditor assessment={assessmentEditor.assessment} students={snapshot.students} close={() => setAssessmentEditor(null)} save={(input, id) => { repository.saveAssessment(input, id); refresh(); setAssessmentEditor(null); setNotice("Avaliação salva neste navegador."); }} />}
    {libraryEditor && <LibraryEditor exercise={libraryEditor.exercise} close={() => setLibraryEditor(null)} save={(input, id) => { repository.saveExercise(input, id); refresh(); setLibraryEditor(null); setNotice("Exercício salvo na biblioteca local."); }} />}
    {deleting && <Modal title={deleting.title} onClose={() => setDeleting(null)}><p className="teacher-delete-note">{deleting.description}</p><div className="teacher-form-actions"><button className="button secondary" onClick={() => setDeleting(null)}>Cancelar</button><button className="button primary" onClick={() => { try { deleting.run(); refresh(); setDeleting(null); setNotice("Registro excluído."); } catch (reason) { setError((reason as Error).message); setDeleting(null); } }}>Confirmar exclusão</button></div></Modal>}
  </div>;
}
function TeacherDashboard({ snapshot, repository, refresh }: { snapshot: TeacherSnapshot; repository: TeacherRepository; refresh: () => void }) {
  const [error, setError] = useState("");
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
    <div className="teacher-dashboard-columns"><section className="teacher-panel"><div className="teacher-section-heading"><h2>Atividades recentes</h2><span>{snapshot.activities.length} registros locais</span></div>
      {snapshot.activities.length ? <ul className="teacher-activity">{snapshot.activities.slice(0, 7).map(item => <li key={item.id}><span className="pulse-dot" /><div>{item.title}<small>{new Date(item.at).toLocaleString("pt-BR")}</small></div></li>)}</ul> : <p className="teacher-empty">Seus cadastros e atualizações aparecerão aqui.</p>}</section>
      <section className="teacher-panel"><h2>Comece pelo essencial</h2><div className="teacher-quick-links"><a href="#professor/alunos">Cadastrar e acompanhar alunos <Users size={18} /></a><a href="#professor/avaliacoes">Registrar avaliação física <ClipboardList size={18} /></a><a href="#professor/biblioteca">Organizar sua biblioteca <BookOpen size={18} /></a></div>
        {!snapshot.students.length && <><button className="button secondary" onClick={() => { try { repository.loadDemo(); refresh(); setError(""); } catch (reason) { setError((reason as Error).message); } }}>Carregar demonstração</button><small className="teacher-help">Opcional: cria dois alunos fictícios, um treino e três avaliações. Não preenche a biblioteca.</small></>}
        {error && <p className="teacher-error" role="alert">{error}</p>}</section></div>
  </>;
}
