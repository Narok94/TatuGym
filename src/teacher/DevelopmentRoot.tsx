import { useEffect, useState } from "react";
import App from "../App";
import { loginDevelopment, logoutTeacher, readDevelopmentSession } from "./devAuth";
import type { DevelopmentSession } from "./devAuth";
import LoginScreen from "../login/LoginScreen";
import TeacherApp from "./TeacherApp";
import "./teacher.css";

export default function DevelopmentRoot() {
  const [route, setRoute] = useState(location.hash);
  const [session, setSession] = useState<DevelopmentSession | null>(readDevelopmentSession);
  useEffect(() => {
    const changed = () => setRoute(location.hash);
    const restored = () => { setRoute(location.hash); setSession(readDevelopmentSession()); };
    window.addEventListener("hashchange", changed);
    window.addEventListener("pageshow", restored);
    return () => { window.removeEventListener("hashchange", changed); window.removeEventListener("pageshow", restored); };
  }, []);
  useEffect(() => {
    const target = !session ? "#login"
      : session.role === "PROFESSOR" ? (route.startsWith("#professor/") ? route : "#professor/dashboard")
      : (!route || route.startsWith("#professor") || route.startsWith("#login") ? "#home" : route);
    if (route !== target) location.replace(target);
  }, [route, session]);
  if (!import.meta.env.DEV) return <App />;
  const leave = () => { logoutTeacher(); setSession(null); location.hash = "login"; };
  if (!session) return <LoginScreen onLogin={(login, password) => {
    const next = loginDevelopment(login, password); setSession(next);
    location.hash = next.role === "PROFESSOR" ? "professor/dashboard" : "home";
  }} />;
  if (session?.role === "PROFESSOR") return <TeacherApp teacherId={session.teacherId} route={route} leave={leave} />;
  return <App onLogout={leave} />;
}
