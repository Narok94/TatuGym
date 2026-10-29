import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  CircleCheck,
  Clock3,
  Dumbbell,
  Flag,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import type { Exercise, Session as SessionType, SetLog } from "../types";
import { ExerciseImage } from "../components/ExerciseImage";
import { PageHeader } from "../components/UI";

function SetRow({
  index,
  log,
  exercise,
  draft,
  onDraft,
  onToggle,
}: {
  index: number;
  log?: SetLog;
  exercise: Exercise;
  draft?: { load: number; reps: number };
  onDraft: (load: number, reps: number) => void;
  onToggle: (load: number, reps: number) => void;
}) {
  const [load, setLoad] = useState(log?.load ?? draft?.load ?? exercise.load);
  const [reps, setReps] = useState(
    log?.reps ?? draft?.reps ?? (Number(exercise.reps.match(/\d+/)?.[0]) || 12),
  );
  return (
    <div className={`set-row ${log ? "done" : ""}`}>
      <span className="set-number">{index + 1}</span>
      <label>
        <span className="sr-only">Repetições da série {index + 1}</span>
        <input
          type="number"
          min="1"
          max="999"
          value={reps}
          disabled={!!log}
          onChange={(e) => {
            const value = Number(e.target.value);
            setReps(value);
            onDraft(load, value);
          }}
        />
      </label>
      <label>
        <span className="sr-only">Carga em kg da série {index + 1}</span>
        <input
          type="number"
          min="0"
          max="1000"
          step="0.5"
          value={load}
          disabled={!!log}
          onChange={(e) => {
            const value = Number(e.target.value);
            setLoad(value);
            onDraft(value, reps);
          }}
        />
      </label>
      <button
        className="set-check"
        aria-label={
          log ? `Desmarcar série ${index + 1}` : `Concluir série ${index + 1}`
        }
        aria-pressed={!!log}
        disabled={!log && (reps < 1 || reps > 999 || load < 0 || load > 1000)}
        onClick={() => onToggle(load, reps)}
      >
        {log ? <Check size={20} /> : <span />}
      </button>
    </div>
  );
}
export default function Session({
  session,
  update,
  back,
  finish,
}: {
  session: SessionType;
  update: (fn: (s: SessionType) => SessionType) => void;
  back: () => void;
  finish: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);
  const { workout, currentExercise, rest } = session;
  const exercise = workout.exercises[currentExercise];
  const total = workout.exercises.reduce((sum, e) => sum + e.sets, 0);
  const progress = Math.round((session.sets.length / total) * 100);
  const remaining = rest.endsAt
    ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000))
    : rest.remaining;
  const running = !!rest.endsAt && remaining > 0;
  const timerPercent = Math.min(1, remaining / exercise.rest);
  function toggle(index: number, load: number, reps: number) {
    update((s) => {
      const existing = s.sets.some(
        (l) => l.exerciseId === exercise.id && l.setIndex === index,
      );
      return {
        ...s,
        sets: existing
          ? s.sets.filter(
              (l) => !(l.exerciseId === exercise.id && l.setIndex === index),
            )
          : [
              ...s.sets,
              {
                exerciseId: exercise.id,
                setIndex: index,
                load,
                reps,
                completedAt: new Date().toISOString(),
              },
            ],
        rest: existing
          ? s.rest
          : {
              remaining: exercise.rest,
              endsAt: Date.now() + exercise.rest * 1000,
            },
      };
    });
  }
  return (
    <>
      <PageHeader
        eyebrow={`${workout.name.toUpperCase()} · EM ANDAMENTO`}
        title={exercise.name}
        description={`Exercício ${currentExercise + 1} de ${workout.exercises.length}`}
        back={back}
      >
        <button
          className="button secondary compact"
          aria-label="Finalizar treino"
          onClick={finish}
        >
          <Flag size={16} />
          <span>Finalizar treino</span>
        </button>
      </PageHeader>
      <div className="session-progress">
        <div>
          <span>Seu progresso</span>
          <strong>
            {session.sets.length} de {total} séries <span>· {progress}%</span>
          </strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="session-grid">
        <div className="session-main">
          <div className="session-exercise-banner">
            <ExerciseImage name={exercise.name} className="session-exercise-image" />
            <span className="eyebrow">FOCO NA EXECUÇÃO</span>
            <h2>
              Cada repetição
              <br />
              faz a diferença.
            </h2>
            <div>
              <span>
                <Dumbbell size={16} />
                {exercise.sets} séries
              </span>
              <span>
                <Clock3 size={16} />
                {exercise.rest}s de descanso
              </span>
            </div>
          </div>
          <section className="panel sets-panel">
            <div className="section-title">
              <h2>Suas séries</h2>
              <span className="pill subtle">
                <CircleCheck size={14} />
                {
                  session.sets.filter((s) => s.exerciseId === exercise.id)
                    .length
                }
                /{exercise.sets}
              </span>
            </div>
            <div className="set-table-head">
              <span>Série</span>
              <span>Repetições</span>
              <span>Carga (kg)</span>
              <span className="sr-only">Concluir</span>
            </div>
            {Array.from({ length: exercise.sets }, (_, index) => (
              <SetRow
                key={`${exercise.id}-${index}`}
                index={index}
                exercise={exercise}
                draft={session.drafts?.[`${exercise.id}:${index}`]}
                onDraft={(load, reps) =>
                  update((s) => ({
                    ...s,
                    drafts: {
                      ...s.drafts,
                      [`${exercise.id}:${index}`]: { load, reps },
                    },
                  }))
                }
                log={session.sets.find(
                  (l) => l.exerciseId === exercise.id && l.setIndex === index,
                )}
                onToggle={(load, reps) => toggle(index, load, reps)}
              />
            ))}
            <p className="helper">
              <CheckCheck size={15} />
              Marque a série para registrar e iniciar o descanso.
            </p>
          </section>
          <div className="session-navigation">
            <button
              className="button secondary"
              disabled={currentExercise === 0}
              onClick={() =>
                update((s) => ({
                  ...s,
                  currentExercise: s.currentExercise - 1,
                }))
              }
            >
              <ArrowLeft size={17} />
              Anterior
            </button>
            {currentExercise < workout.exercises.length - 1 ? (
              <button
                className="button primary"
                onClick={() =>
                  update((s) => ({
                    ...s,
                    currentExercise: s.currentExercise + 1,
                  }))
                }
              >
                Próximo exercício
                <ArrowRight size={17} />
              </button>
            ) : (
              <button className="button primary" onClick={finish}>
                <Flag size={17} />
                Finalizar treino
              </button>
            )}
          </div>
        </div>
        <aside>
          <section className="panel rest-panel">
            <span className="eyebrow">RECUPERE PARA IR ALÉM</span>
            <h2>Descanso entre séries</h2>
            <div className={`timer ${running ? "running" : ""}`}>
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <circle className="ring-track" cx="100" cy="100" r="88" />
                <circle
                  className="ring-value"
                  cx="100"
                  cy="100"
                  r="88"
                  strokeDasharray={`${timerPercent * 553} 553`}
                />
              </svg>
              <div role="timer" aria-label="Tempo de descanso">
                <strong>
                  {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                  {String(remaining % 60).padStart(2, "0")}
                </strong>
                <span>
                  {running
                    ? "Respire. Você está indo bem."
                    : remaining === 0
                      ? "Pronto para a próxima?"
                      : "No seu tempo."}
                </span>
              </div>
            </div>
            <div className="timer-controls">
              <button
                className="button secondary"
                onClick={() => {
                  setNow(Date.now());
                  update((s) => ({
                    ...s,
                    rest: running
                      ? { remaining, endsAt: null }
                      : {
                          remaining: remaining || exercise.rest,
                          endsAt:
                            Date.now() + (remaining || exercise.rest) * 1000,
                        },
                  }));
                }}
              >
                {running ? (
                  <Pause size={17} />
                ) : remaining === 0 ? (
                  <RotateCcw size={17} />
                ) : (
                  <Play size={17} />
                )}{" "}
                {running ? "Pausar" : remaining === 0 ? "Reiniciar" : "Iniciar"}
              </button>
              <button
                className="text-button"
                onClick={() =>
                  update((s) => ({
                    ...s,
                    rest: { remaining: 0, endsAt: null },
                  }))
                }
              >
                <SkipForward size={17} />
                Pular descanso
              </button>
            </div>
          </section>
          <section className="panel session-outline">
            <h3>Neste treino</h3>
            {workout.exercises.map((e, i) => {
              const done =
                session.sets.filter((l) => l.exerciseId === e.id).length >=
                e.sets;
              return (
                <button
                  className={i === currentExercise ? "current" : ""}
                  key={e.id}
                  onClick={() => update((s) => ({ ...s, currentExercise: i }))}
                >
                  <span className={done ? "success" : ""}>
                    {done ? (
                      <Check size={15} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  {e.name}
                  <span className="outline-count">
                    {session.sets.filter((l) => l.exerciseId === e.id).length}/
                    {e.sets}
                  </span>
                </button>
              );
            })}
          </section>
        </aside>
      </div>
    </>
  );
}
