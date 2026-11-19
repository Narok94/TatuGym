import { useEffect, useRef, useState } from "react";
import { HeartPulse, Pause, Play, RotateCcw } from "lucide-react";
import { Modal, PageHeader } from "../components/UI";
import { cardioExercises, cardioPosition, newCardioTimer, restoreCardioTimer } from "../cardioCircuit";
import type { CardioTimer, RopeSeconds } from "../cardioCircuit";
import { signalRestEnd, unlockRestAudio } from "../sessionLogic";

const storageKey = "forja:cardio:henrique:v1";
const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

export default function Cardio() {
  const [timer, setTimer] = useState<CardioTimer>(() => {
    try { return restoreCardioTimer(localStorage.getItem(storageKey)); }
    catch { return newCardioTimer(); }
  });
  const [now, setNow] = useState(Date.now);
  const [resetting, setResetting] = useState(false);
  const position = cardioPosition(timer, now);
  const lastPhase = useRef(position.index);
  const running = timer.resumedAt !== null && !position.complete;
  const started = timer.status !== "idle";
  const phase = position.phase;
  const exercise = cardioExercises[phase?.exercise ?? 3];
  const next = position.phases[position.index + 1];

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(timer)); }
    catch { /* The timer still works when local storage is unavailable. */ }
  }, [timer]);
  useEffect(() => {
    if (timer.resumedAt === null) return;
    const tick = () => setNow(Date.now());
    const interval = window.setInterval(tick, 200);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    tick();
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [timer.resumedAt]);
  useEffect(() => {
    if (lastPhase.current !== position.index && started) signalRestEnd();
    lastPhase.current = position.index;
    if (position.complete && timer.status !== "complete") {
      setTimer(current => ({ ...current, status: "complete", elapsedMs: position.totalMs, resumedAt: null }));
    }
  }, [position.index, position.complete, position.totalMs, started, timer.status]);

  function toggle() {
    unlockRestAudio();
    const time = Date.now();
    setNow(time);
    setTimer(current => current.resumedAt === null
      ? { ...current, status: "active", resumedAt: time }
      : { ...current, elapsedMs: cardioPosition(current, time).elapsedMs, resumedAt: null });
  }
  function reset() {
    lastPhase.current = 0;
    setNow(Date.now());
    setTimer(newCardioTimer(timer.ropeSeconds));
    setResetting(false);
  }

  return (
    <section className="cardio-page">
      <PageHeader eyebrow="SEU CIRCUITO" title="Cardio" description="Circuito definitivo: cardio + abdômen" />
      <section className={`panel cardio-timer${phase?.kind !== "exercise" ? " cardio-rest" : ""}`} aria-label="Timer do circuito">
        <div className="cardio-timer-heading">
          <span className="pill"><HeartPulse size={16} />{position.complete ? "3 voltas concluídas" : `Volta ${phase?.round ?? 1} de 3`}</span>
          <span className="muted">Total: {formatTime(position.totalMs / 1000)}</span>
        </div>
        <div aria-live="polite" aria-atomic="true">
          <p className="eyebrow">{position.complete ? "CIRCUITO CONCLUÍDO" : !started ? "PRONTO PARA COMEÇAR" : !running ? "PAUSADO" : phase?.kind === "exercise" ? "EXERCÍCIO" : "DESCANSO"}</p>
          <h2>{position.complete ? "Muito bem, Henrique!" : phase?.kind === "round-rest" ? "Descanso entre voltas" : phase?.kind === "rest" ? "Descanso entre exercícios" : exercise.name}</h2>
        </div>
        <div className="cardio-stage">
          {!position.complete && phase?.kind === "exercise" && <img className="cardio-current-image" src={exercise.image} alt={exercise.name} />}
          <div className="cardio-clock" role="timer" aria-label="Tempo restante da etapa">{formatTime(position.remaining)}</div>
        </div>
        <progress className="cardio-progress" aria-label="Progresso do circuito" max={position.totalMs} value={position.elapsedMs} />
        <p className="muted cardio-next">{position.complete ? "Você completou todos os exercícios e descansos." : next ? `A seguir: ${next.kind === "exercise" ? cardioExercises[next.exercise].name : next.kind === "round-rest" ? "descanso entre voltas" : "descanso"} · ${next.seconds}s` : "Último exercício do circuito"}</p>
        <div className="cardio-controls">
          {!position.complete && <button className="button primary" onClick={toggle}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? "Pausar" : started ? "Retomar" : "Iniciar circuito"}</button>}
          {started && <button className="button secondary" onClick={() => position.complete ? reset() : setResetting(true)}><RotateCcw size={18} />Reiniciar</button>}
        </div>
        <label className="cardio-rope">Tempo de corda
          <select aria-label="Tempo de corda" disabled={started} value={timer.ropeSeconds} onChange={event => setTimer(newCardioTimer(Number(event.target.value) as RopeSeconds))}>
            <option value={20}>20 segundos</option><option value={30}>30 segundos</option>
          </select>
        </label>
      </section>
      <div className="panel cardio-guidance">
        <h2>3 voltas</h2>
        <p>Descanse 20 segundos entre exercícios e 60 segundos entre voltas. O timer avança automaticamente e sinaliza cada troca com som e vibração, quando disponíveis.</p>
      </div>
      <ol className="cardio-exercises" aria-label="Exercícios do circuito">
        {cardioExercises.map((item, index) => (
          <li className={`panel cardio-exercise${started && phase?.kind === "exercise" && phase.exercise === index ? " cardio-exercise-active" : ""}`} key={item.name}>
            <img className="cardio-exercise-image" src={item.image} alt={item.name} loading="lazy" />
            <span className="exercise-number">{String(index + 1).padStart(2, "0")}</span>
            <div><h2>{item.name}</h2><p className="muted">{index === 3 ? timer.ropeSeconds : item.seconds} segundos</p></div>
          </li>
        ))}
      </ol>
      <div className="panel cardio-guidance">
        <h2>Frequência</h2>
        <p>3 vezes por semana, depois da musculação, ao chegar em casa.</p>
      </div>
      {resetting && <Modal title="Reiniciar circuito?" onClose={() => setResetting(false)}>
        <p>O timer voltará ao primeiro exercício da primeira volta.</p>
        <div className="cardio-controls"><button className="button secondary" onClick={() => setResetting(false)}>Continuar circuito</button><button className="button primary" onClick={reset}>Reiniciar circuito</button></div>
      </Modal>}
    </section>
  );
}
