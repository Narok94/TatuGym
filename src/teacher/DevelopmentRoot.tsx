import { useEffect, useState } from "react";
import App from "../App";
import { Brand } from "../components/UI";
import { loginTeacher, logoutTeacher, readTeacherSession } from "./devAuth";
import type { TeacherSession } from "./models";
import TeacherApp from "./TeacherApp";
import "./teacher.css";

export default function DevelopmentRoot() {
  const [route, setRoute] = useState(location.hash);
  const [session, setSession] = useState<TeacherSession | null>(readTeacherSession);
  const [error, setError] = useState("");
  useEffect(() => { const changed = () => setRoute(location.hash); window.addEventListener("hashchange", changed); return () => window.removeEventListener("hashchange", changed); }, []);
  if (!import.meta.env.DEV) return <App />;
  const leave = (student: boolean) => { logoutTeacher(); setSession(null); location.hash = student ? "home" : "professor"; };
  if (session) return <TeacherApp teacherId={session.teacherId} route={route} leave={leave} />;
  if (!route.startsWith("#professor")) return <App />;
  return <main className="teacher-login teacher-scope">
    <section className="teacher-login-card"><Brand /><p className="teacher-kicker">ESPAÇO DO PROFESSOR</p><h1>Vamos acompanhar sua turma.</h1>
      <p>Acesso simulado de desenvolvimento. Os dados ficam apenas neste navegador, sem autenticação de produção.</p>
      <form className="form-stack" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget);
        try { const next = loginTeacher(String(form.get("login")), String(form.get("password"))); setSession(next); setError(""); location.hash = "professor/dashboard"; }
        catch (reason) { setError((reason as Error).message); }
      }}>
        <label>Usuário<input name="login" required autoComplete="username" placeholder="professor" /></label>
        <label>Senha<input name="password" type="password" required autoComplete="current-password" /></label>
        {error && <p role="alert" className="teacher-error">{error}</p>}
        <button className="button primary" type="submit">Entrar como professor</button>
      </form>
      <p className="teacher-test-hint">Teste: <strong>professor / 123</strong>. Para testar outro professor: <strong>professor2 / 123</strong>.</p>
      <a href="#home">Voltar ao ambiente do aluno</a>
    </section>
  </main>;
}
