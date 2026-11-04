import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, List, Pause, Play, Undo2, X } from "lucide-react";
import type { Session as SessionType, WorkoutRecord } from "../types";
import { ExerciseImage } from "../components/ExerciseImage";
import { Modal } from "../components/UI";
import { completeSet, editSet, undoSet, emptyRest, lastExerciseSets, nextSet, selectSet, selectExercise, unlockRestAudio } from "../sessionLogic";

export default function Session({ session, history, update, back, finish }: {
  session: SessionType;
  history: WorkoutRecord[];
  update: (fn: (s: SessionType) => SessionType) => void;
  back: () => void;
  finish: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [showList, setShowList] = useState(false);
  const [locked, setLocked] = useState(false);
  const [emptyField, setEmptyField] = useState<string | null>(null);
  const lockUntil = useRef(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= lockUntil.current) setLocked(false);
    }, 200);
    return () => window.clearInterval(timer);
  }, []);
  const { workout, currentExercise, rest } = session;
  const exercise = workout.exercises[currentExercise];
  const previousSets = useMemo(() => lastExerciseSets(history, workout.id, exercise.id), [history, workout.id, exercise.id]);
  const index = session.currentSet ?? nextSet(session);
  const previous = previousSets.find(s => s.setIndex === index) ?? previousSets.at(-1);
  const key = `${exercise.id}:${index}`;
  const recorded = session.sets.find(s => s.exerciseId === exercise.id && s.setIndex === index);
  const last = session.sets.filter(s => s.exerciseId === exercise.id).at(-1);
  const values = (recorded ? recorded : session.drafts?.[key]) ?? { load: last?.load ?? previous?.load ?? exercise.load,
    reps: last?.reps ?? previous?.reps ?? (Number(exercise.reps.match(/\d+/)?.[0]) || 1) };
  const remaining = rest.endsAt ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : rest.remaining;
  const running = !!rest.endsAt && remaining > 0;
  const ratio = exercise.rest > 0 ? Math.min(1, remaining / exercise.rest) : 0;
  const valid = emptyField !== `${key}:load` && emptyField !== `${key}:reps` && Number.isInteger(values.reps) && values.reps >= 1 && values.reps <= 999 && Number.isFinite(values.load) && values.load >= 0 && values.load <= 1000;
  const move = (i: number) => { update(s => selectExercise(s, i)); setShowList(false); };
  function draft(field: "load" | "reps", value: string) {
    setEmptyField(value === "" ? `${key}:${field}` : null);
    // Keep an empty edit local; preserve the last saved number until replaced.
    if (value === "") return;
    if (recorded && index !== undefined) {
      update(s => editSet(s, exercise.id, index, field === "load" ? Number(value) : values.load, field === "reps" ? Number(value) : values.reps));
      return;
    }
    update(s => ({ ...s, drafts: { ...s.drafts, [key]: { ...values, [field]: Number(value) } } }));
  }
  function confirm() {
    if (index === undefined || recorded || !valid || Date.now() < lockUntil.current) return;
    lockUntil.current = Date.now() + 900;
    setLocked(true);
    unlockRestAudio();
    setNow(Date.now());
    update(s => completeSet(s, exercise.id, index, values.load, values.reps));
  }
  return <section className="execution" aria-label="Execução do treino">
    <header className="execution-header">
      <button className="execution-icon" aria-label="Voltar" onClick={back}><ArrowLeft /></button>
      <div><h1>{exercise.name}</h1><p aria-live="polite">{index === undefined ? "Exercício concluído" : `Série ${index + 1} de ${exercise.sets}`}</p></div>
      <button className="execution-icon" aria-label="Lista de exercícios" onClick={() => setShowList(true)}><List /></button>
      <div className="series-navigation" role="group" aria-label="Séries do exercício">
        {Array.from({length: exercise.sets}, (_, i) => {
          const done = session.sets.some(s => s.exerciseId === exercise.id && s.setIndex === i);
          return <button key={i} className={done ? "is-complete" : ""} aria-current={index === i ? "step" : undefined}
            aria-label={`Selecionar série ${i + 1}${done ? ", concluída" : ""}`}
            onClick={() => { setEmptyField(null); update(s => selectSet(s, i)); }}>{i + 1}{done && <Check size={10} />}</button>;
        })}
        {recorded && index !== undefined && <button className="series-undo" aria-label={`Desfazer série ${index + 1}`}
          onClick={() => update(s => undoSet(s, exercise.id, index))}><Undo2 size={16} /></button>}
      </div>
    </header>
    <div className="execution-art">
      <ExerciseImage name={exercise.name} className="execution-image" />
      <button className="execution-icon previous" disabled={currentExercise === 0} aria-label="Exercício anterior" onClick={() => move(currentExercise - 1)}><ChevronLeft /></button>
      <button className="execution-icon next" disabled={currentExercise === workout.exercises.length - 1} aria-label="Próximo exercício" onClick={() => move(currentExercise + 1)}><ChevronRight /></button>
    </div>
    <div className="execution-values" key={key}>
      <label><input aria-label="Repetições da série atual" type="number" inputMode="numeric" min="1" max="999" step="1" disabled={index === undefined} value={emptyField === `${key}:reps` || Number.isNaN(values.reps) ? "" : values.reps}
        onFocus={e => { if (e.currentTarget.value === "0") draft("reps", ""); else e.currentTarget.select(); }}
        onBlur={() => setEmptyField(null)} onChange={e => draft("reps", e.target.value)} /><span>repetições <small>alvo {exercise.reps}</small></span></label>
      <label><input aria-label="Carga da série atual em kg" type="number" inputMode="decimal" min="0" max="1000" step="0.5" disabled={index === undefined} value={emptyField === `${key}:load` || Number.isNaN(values.load) ? "" : values.load}
        onFocus={e => { if (e.currentTarget.value === "0") draft("load", ""); else e.currentTarget.select(); }}
        onBlur={() => setEmptyField(null)} onChange={e => draft("load", e.target.value)} /><span>kg</span></label>
      {previous && <small className="execution-previous">Última execução: {previous.reps} repetições · {previous.load.toLocaleString("pt-BR")} kg</small>}
    </div>
    <div className="execution-rest">
      <div className="execution-timer">
        <svg viewBox="0 0 200 200" aria-hidden="true"><circle className="rest-track" cx="100" cy="100" r="88" /><circle className="rest-progress" cx="100" cy="100" r="88" pathLength="100" strokeDasharray={`${ratio * 100} 100`} opacity={remaining > 0 ? 1 : 0} /></svg>
        <div role="timer" aria-label="Tempo de descanso"><strong>{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</strong><span>{remaining > 0 && !running ? "Pausado" : "Descanso"}</span></div>
      </div>
      <button className="rest-skip" disabled={remaining === 0} onClick={() => update(s => ({ ...s, rest: emptyRest() }))}>Pular descanso</button>
    </div>
    <footer className="execution-controls">
      <button className="execution-circle" aria-label="Sair da execução e preservar progresso" onClick={back}><X /></button>
      <button className="execution-circle" disabled={remaining === 0} aria-label={running ? "Pausar descanso" : "Retomar descanso"} onClick={() => {
        const current = rest.endsAt ? Math.max(0, Math.ceil((rest.endsAt - Date.now()) / 1000)) : rest.remaining;
        if (!current) return;
        unlockRestAudio(); setNow(Date.now());
        update(s => ({ ...s, rest: { remaining: current, endsAt: running ? null : Date.now() + current * 1000 } }));
      }}>{running || remaining === 0 ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}</button>
      <button className="execution-circle confirm" aria-label={recorded ? "Série já concluída; alterações salvas automaticamente" : "Concluir série atual"} disabled={!!recorded || locked || index === undefined || !valid} onClick={confirm}><Check /></button>
    </footer>
    {showList && <Modal title="Exercícios do treino" onClose={() => setShowList(false)}>
      <div className="execution-list">{workout.exercises.map((e, i) => <button key={e.id} aria-current={i === currentExercise ? "step" : undefined} onClick={() => move(i)}>
        <ExerciseImage name={e.name} /><span>{e.name}</span><small>{session.sets.filter(s => s.exerciseId === e.id).length}/{e.sets}</small>{nextSet(session, i) === undefined && <Check size={16} />}
      </button>)}</div>
      <button className="button secondary full-width" onClick={() => { setShowList(false); finish(); }}>Finalizar treino agora</button>
    </Modal>}
  </section>;
}
