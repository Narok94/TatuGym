import { lazy, Suspense, useEffect, useState } from "react";
import App from "./App";
import { loadAuthService } from "./auth";
import type { AuthService, AuthSession } from "./auth";
import LoginScreen from "./login/LoginScreen";
import { prepareData, flushStudent,exportPreservedData } from './persistence';

const TeacherApp = lazy(() => import("./teacher/TeacherApp"));
export default function AppRoot() {
  const [route, setRoute] = useState(location.hash);
  const [auth, setAuth] = useState<AuthService | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    loadAuthService().then(async provider => {
      if (!active) return;
      setAuth(provider);
      try { const next = await provider.refresh(); if (next) await prepareData(next); if(active) setSession(next); }
      catch(reason) { if(active) setError((reason as Error).message); }
      finally { if(active) setReady(true); }
    });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const changed = () => setRoute(location.hash);
    const restored = async (event:PageTransitionEvent) => {
      setRoute(location.hash);
      if(auth && event.persisted) {
        setReady(false);
        try {const next=await auth.refresh();if(next) await prepareData(next);setSession(next);}
        catch(reason) {setSession(null);setError((reason as Error).message);}
        finally {setReady(true);}
      }
    };
    const expired = () => {setSession(null);location.hash='login';};
    const storage = (event:StorageEvent) => {if(event.key==='forja:logout') expired();};
    window.addEventListener("hashchange", changed);
    window.addEventListener("pageshow", restored);
    window.addEventListener('forja:expired',expired);window.addEventListener('storage',storage);
    return () => { window.removeEventListener("hashchange", changed); window.removeEventListener("pageshow", restored);window.removeEventListener('forja:expired',expired);window.removeEventListener('storage',storage); };
  }, [auth]);
  useEffect(() => {
    if (!auth || !ready) return;
    const target = !session ? "#login"
      : session.role === "PROFESSOR" ? (route.startsWith("#professor/") ? route : "#professor/dashboard")
      : (!route || route.startsWith("#professor") || route.startsWith("#login") ? "#home" : route);
    if (route !== target) location.replace(target);
  }, [route, session, auth, ready]);
  if (!auth || !ready) return <div role="status">Carregando…</div>;
  const leave = async () => {
    try { if(session?.role==='ALUNO') await flushStudent(); await auth.logout(); setError(""); setSession(null); location.hash = "login"; }
    catch { setError("Não foi possível encerrar a sessão. Tente sair novamente."); }
  };
  if (!session) return <>{error && <div className="storage-error"><p role="alert">{error}</p>{auth.readSession() && <button className="button secondary" onClick={()=>{const current=auth.readSession();if(current)exportPreservedData(current);}}>Exportar dados preservados</button>}</div>}<LoginScreen mode={auth.mode} onLogin={async (login, password) => {
    const next = await auth.login(login, password);
    try {await prepareData(next);}catch(reason){setError((reason as Error).message);return;}
    setError(''); setSession(next);
    location.hash = next.role === "PROFESSOR" ? "professor/dashboard" : "home";
  }} /></>;
  return <>{error && <p role="alert" className="storage-error">{error}</p>}
    {session.role === "PROFESSOR"
      ? <Suspense fallback={<div role="status">Carregando…</div>}><TeacherApp key={session.userId} teacherId={session.teacherId} route={route} leave={leave} /></Suspense>
      : <App key={session.userId} onLogout={leave} />}
  </>;
}
