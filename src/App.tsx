import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Dumbbell,
  Flame,
  Play,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import type { Exercise, Meal, Session as SessionType, Workout } from "./types";
import { isComplete, selectExercise, signalRestEnd } from "./sessionLogic";
import { createInitialData } from "./data";
import { localDate, uid, useAppData } from "./store";
import { Anatomy } from "./components/Anatomy";
import { BottomNav, Brand, Modal } from "./components/UI";
import { ExerciseEditor, MealEditor } from "./components/Editors";
import Home from "./pages/Home";
import { WorkoutDetails, Workouts } from "./pages/Workouts";
import Session from "./pages/Session";
import Diet from "./pages/Diet";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
const readPage = () => location.hash.slice(1) || "home";
export default function App() {
  const { data, setData, storageError } = useAppData();
  const [page, setPage] = useState(readPage);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [finishModal, setFinishModal] = useState(false);
  const [startConflict, setStartConflict] = useState<Workout | null>(null);
  const [pendingExerciseId, setPendingExerciseId] = useState<string>();
  const [finished, setFinished] = useState<{
    name: string;
    sets: number;
  } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
    null,
  );
  useEffect(() => {
    const updatePage = () => {
      setPage(readPage());
      window.scrollTo(0, 0);
    };
    const updateOnline = () => setOffline(!navigator.onLine);
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPrompt);
    };
    window.addEventListener("hashchange", updatePage);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      window.removeEventListener("hashchange", updatePage);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark =
        data.theme === "dark" || (data.theme === "system" && query.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", dark ? "#101416" : "#f6f7f8");
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [data.theme]);
  const navigate = (next: string) => {
    if (readPage() === next) {
      setPage(next);
      window.scrollTo(0, 0);
    } else location.hash = next;
  };
  const startNew = (workout: Workout, exerciseId?: string) => {
    const session: SessionType = {
      id: uid(),
      workout: structuredClone(workout),
      startedAt: new Date().toISOString(),
      currentExercise: Math.max(0, workout.exercises.findIndex(e => e.id === exerciseId)),
      sets: [],
      rest: { remaining: 0, endsAt: null },
    };
    setData((d) => ({ ...d, activeSession: session }));
    navigate("session");
  };
  const start = (workout: Workout, exerciseId?: string) => {
    if (data.activeSession) {
      if (data.activeSession.workout.id === workout.id) {
        if (exerciseId) updateSession(s => selectExercise(s, s.workout.exercises.findIndex(e => e.id === exerciseId)));
        navigate("session");
      } else {
        setPendingExerciseId(exerciseId);
        setStartConflict(workout);
      }
    } else startNew(workout, exerciseId);
  };
  const updateSession = (fn: (session: SessionType) => SessionType) =>
    setData((d) =>
      d.activeSession ? { ...d, activeSession: fn(d.activeSession) } : d,
    );
  useEffect(() => {
    if (!data.activeSession || !isComplete(data.activeSession)) return;
    const session = data.activeSession;
    setData(d => d.activeSession?.id !== session.id ? d : {
      ...d, activeSession: null,
      history: d.history.some(h => h.id === session.id) ? d.history : [{
        ...d.activeSession, finishedAt: new Date().toISOString(), rest: { remaining: 0, endsAt: null },
      }, ...d.history],
    });
    setFinished({ name: session.workout.name, sets: session.sets.length });
    navigate("progress");
  }, [data.activeSession, setData]);
  const [restNotice, setRestNotice] = useState(false);
  const restDeadline = data.activeSession?.rest.endsAt;
  useEffect(() => {
    if (!restDeadline) return;
    setRestNotice(false);
    const check = () => {
      if (Date.now() < restDeadline) return;
      window.clearInterval(timer);
      signalRestEnd();
      setRestNotice(true);
      setData(d => !d.activeSession || d.activeSession.rest.endsAt !== restDeadline ? d : {
        ...d, activeSession: { ...d.activeSession, rest: { remaining: 0, endsAt: null } },
      });
    };
    const timer = window.setInterval(check, 250);
    check();
    return () => window.clearInterval(timer);
  }, [restDeadline, setData]);
  useEffect(() => {
    if (!restNotice) return;
    const timer = window.setTimeout(() => setRestNotice(false), 6000);
    return () => window.clearTimeout(timer);
  }, [restNotice]);
  const currentWorkout = data.workouts.find((w) => w.id === page.split("/")[1]);
  if (!data.welcomed)
    return (
      <main className="welcome">
        <div className="welcome-top">
          <Brand />
          <span className="welcome-tag">SUA EVOLUÇÃO COMEÇA AQUI</span>
        </div>
        <div className="welcome-layout">
          <div className="welcome-copy">
            <span className="pill">
              <Flame size={14} />
              UM NOVO DIA. UMA NOVA CHANCE.
            </span>
            <h1>
              Seu treino.
              <br />
              Seu ritmo.
              <br />
              <em>Sua evolução.</em>
            </h1>
            <p>
              Um espaço para cuidar de você. Organize seus treinos, acompanhe
              sua alimentação e celebre cada conquista.
            </p>
            <button
              className="button primary"
              onClick={() => {
                setData((d) => ({ ...d, welcomed: true }));
                navigate("home");
              }}
            >
              Entrar
              <ArrowRight size={20} />
            </button>
            <span className="welcome-privacy">
              <ShieldCheck size={15} />
              Pessoal. Simples. No seu dispositivo.
            </span>
          </div>
          <div className="welcome-art">
            <div className="art-orbit" />
            <span className="art-word">EVOLUA</span>
            <Anatomy group="push" />
            <div className="art-caption">
              <Dumbbell size={24} />
              <div>
                <strong>Mais forte a cada dia.</strong>
                <span>O seu único limite é o próximo passo.</span>
              </div>
            </div>
          </div>
        </div>
        <div className="welcome-bottom">
          <span>MEU TREINO © {new Date().getFullYear()}</span>
          <span>CONSTÂNCIA TRANSFORMA.</span>
        </div>
      </main>
    );
  return (
    <div className={`app-shell ${page === "session" && data.activeSession ? "executing" : ""}`}>
      <header className="topbar">
        <button
          className="brand-button"
          onClick={() => navigate("home")}
          aria-label="Meu Treino — Início"
        >
          <Brand />
        </button>
        <div className="topbar-right">
          <span className="local-badge">
            <span className="pulse-dot" />
            {offline ? "Modo offline" : "Seu espaço pessoal"}
          </span>
          <button
            className="avatar-small"
            onClick={() => navigate("profile")}
            aria-label={`Abrir perfil de ${data.user.name}`}
          >
            {data.user.name.trim().charAt(0).toUpperCase()}
          </button>
        </div>
      </header>
      {offline && (
        <div className="offline-banner">
          <WifiOff size={14} />
          Você está offline. Seus registros continuam sendo salvos neste
          dispositivo.
        </div>
      )}
      {storageError && (
        <div role="alert" className="storage-error">
          {storageError}
        </div>
      )}
      <main className="main-content" id="main-content">
        {data.activeSession && page !== "session" && (
          <button className="resume-banner" onClick={() => navigate("session")}>
            <span className="pulse-dot" />
            <strong>{data.activeSession.workout.name}</strong>
            <span>em andamento</span>
            <Play size={15} fill="currentColor" />
          </button>
        )}
        {page === "home" ? (
          <Home data={data} navigate={navigate} start={start} />
        ) : page === "workouts" ? (
          <Workouts workouts={data.workouts} navigate={navigate} />
        ) : page.startsWith("workout/") && currentWorkout ? (
          <WorkoutDetails
            workout={currentWorkout}
            back={() => navigate("workouts")}
            start={() => start(currentWorkout)}
            execute={(exerciseId) => start(currentWorkout, exerciseId)}
          />
        ) : page === "session" && data.activeSession ? (
          <Session
            session={data.activeSession}
            update={updateSession}
            back={() => navigate(`workout/${data.activeSession!.workout.id}`)}
            finish={() => setFinishModal(true)}
          />
        ) : page === "diet" ? (
          <Diet
            meals={data.meals}
            completed={data.mealLogs[localDate()] || []}
            toggle={(id) =>
              setData((d) => {
                const day = localDate(),
                  logs = d.mealLogs[day] || [];
                return {
                  ...d,
                  mealLogs: {
                    ...d.mealLogs,
                    [day]: logs.includes(id)
                      ? logs.filter((l) => l !== id)
                      : [...logs, id],
                  },
                };
              })
            }
            edit={setEditingMeal}
          />
        ) : page === "progress" ? (
          <Progress
            data={data}
            back={() => navigate("profile")}
            saveWeight={(entry) =>
              setData((d) => ({
                ...d,
                weights: [
                  ...d.weights.filter((w) => w.date !== entry.date),
                  entry,
                ],
              }))
            }
            deleteWeight={(id) =>
              setData((d) => ({
                ...d,
                weights: d.weights.filter((w) => w.id !== id),
              }))
            }
          />
        ) : page === "profile" ? (
          <Profile
            data={data}
            navigate={navigate}
            setTheme={(theme) => setData((d) => ({ ...d, theme }))}
            reset={() => {
              setData({ ...createInitialData(), welcomed: true });
              navigate("home");
            }}
            install={
              installPrompt
                ? async () => {
                    await installPrompt.prompt();
                    await installPrompt.userChoice;
                    setInstallPrompt(null);
                  }
                : undefined
            }
          />
        ) : (
          <div className="empty-state">
            <h1>
              {page === "session"
                ? "Nenhum treino em andamento"
                : "Página não encontrada"}
            </h1>
            <button
              className="button primary"
              onClick={() => navigate("workouts")}
            >
              Ver meus treinos
            </button>
          </div>
        )}
      </main>
      <BottomNav page={page} navigate={navigate} />
      {restNotice && <div className="rest-notice" role="status">Descanso concluído. Pronto para a próxima série!</div>}
      {editingExercise && (
        <ExerciseEditor
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={(exercise) => {
            setData((d) => ({
              ...d,
              workouts: d.workouts.map((w) => ({
                ...w,
                exercises: w.exercises.map((e) =>
                  e.id === exercise.id ? exercise : e,
                ),
              })),
            }));
            setEditingExercise(null);
          }}
        />
      )}
      {editingMeal && (
        <MealEditor
          meal={editingMeal}
          onClose={() => setEditingMeal(null)}
          onSave={(meal) => {
            setData((d) => ({
              ...d,
              meals: d.meals.map((m) => (m.id === meal.id ? meal : m)),
            }));
            setEditingMeal(null);
          }}
        />
      )}
      {startConflict && (
        <Modal
          title="Você tem um treino em andamento"
          onClose={() => setStartConflict(null)}
        >
          <p className="muted">
            Continue o {data.activeSession?.workout.name} ou descarte a sessão
            em andamento para iniciar o {startConflict.name}.
          </p>
          <div className="modal-actions">
            <button
              className="button primary"
              onClick={() => {
                setStartConflict(null);
                navigate("session");
              }}
            >
              Continuar treino atual
            </button>
            <button
              className="button secondary"
              onClick={() => {
                startNew(startConflict, pendingExerciseId);
                setStartConflict(null);
              }}
            >
              Descartar sessão e iniciar {startConflict.name}
            </button>
          </div>
        </Modal>
      )}
      {finishModal && data.activeSession && (
        <Modal title="Finalizar treino?" onClose={() => setFinishModal(false)}>
          <p className="muted">
            Você registrou {data.activeSession.sets.length} de{" "}
            {data.activeSession.workout.exercises.reduce(
              (n, e) => n + e.sets,
              0,
            )}{" "}
            séries. As séries concluídas e suas cargas serão salvas no
            histórico.
          </p>
          <div className="modal-actions">
            <button
              className="button primary"
              onClick={() => {
                const session = data.activeSession!;
                setData((d) => d.activeSession?.id !== session.id ? d : ({
                  ...d,
                  activeSession: null,
                  history: [
                    {
                      ...session,
                      finishedAt: new Date().toISOString(),
                      rest: { remaining: 0, endsAt: null },
                    },
                    ...d.history,
                  ],
                }));
                setFinishModal(false);
                setFinished({
                  name: session.workout.name,
                  sets: session.sets.length,
                });
                navigate("progress");
              }}
            >
              <Check size={18} />
              Finalizar e salvar
            </button>
            <button
              className="button secondary"
              onClick={() => setFinishModal(false)}
            >
              Continuar treinando
            </button>
          </div>
        </Modal>
      )}
      {finished && (
        <Modal title="Mais um passo dado!" onClose={() => setFinished(null)}>
          <div className="finished-message">
            <span>
              <Check size={35} />
            </span>
            <h3>{finished.name} registrado.</h3>
            <p className="muted">
              {finished.sets} séries salvas. Cada repetição faz parte da sua
              evolução.
            </p>
          </div>
          <button
            className="button primary full-width"
            onClick={() => setFinished(null)}
          >
            Ver meu progresso
            <ArrowRight size={17} />
          </button>
        </Modal>
      )}
    </div>
  );
}
