import { useId, useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import logo from "../assets/logo_forja_transparente.png";
import "./login.css";

export default function LoginScreen({ onLogin }: { onLogin: (user: string, password: string) => void }) {
  const [user, setUser] = useState(""); const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false); const [error, setError] = useState(""); const [recovery, setRecovery] = useState(false);
  const id = useId();
  return <div className="forja-login">
    <main className="forja-login-main">
      <img className="forja-login-logo" src={logo} alt="FORJA — Sua evolução é construída." />
      <section className="forja-login-panel" aria-labelledby={`${id}-title`}>
        <h1 id={`${id}-title`}>Acesse sua conta</h1>
        <form className="forja-login-form" onSubmit={event => { event.preventDefault(); setRecovery(false); setError(""); try { onLogin(user, password); } catch (reason) { setError((reason as Error).message); } }}>
          <label className="forja-sr-only" htmlFor={`${id}-user`}>Usuário ou e-mail</label>
          <div className="forja-input"><UserRound size={23} aria-hidden="true" /><input id={`${id}-user`} name="login" autoComplete="username" required maxLength={200} autoCapitalize="none" spellCheck={false} placeholder="Usuário ou e-mail" value={user} onChange={event => setUser(event.target.value)} /></div>
          <label className="forja-sr-only" htmlFor={`${id}-password`}>Senha</label>
          <div className="forja-input forja-password"><LockKeyhole size={23} aria-hidden="true" /><input id={`${id}-password`} name="password" autoComplete="current-password" required type={visible ? "text" : "password"} placeholder="Senha" value={password} onChange={event => setPassword(event.target.value)} /><button type="button" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={21} /> : <Eye size={21} />}</button></div>
          {error && <p className="forja-login-error" role="alert">{error}</p>}
          <button type="submit" className="forja-enter">Entrar</button>
          <a className="forja-recovery" href="#login" onClick={event => { event.preventDefault(); setRecovery(true); setError(""); }}>Esqueceu sua senha?</a>
          {recovery && <p className="forja-login-message" role="status">Recuperação de senha indisponível nesta etapa. Será habilitada com o backend.</p>}
        </form>
      </section>
    </main>
    <footer className="forja-login-footer">Ambiente de desenvolvimento · autenticação simulada, sem segurança de produção.</footer>
  </div>;
}
