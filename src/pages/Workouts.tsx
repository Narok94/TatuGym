import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Play,
} from "lucide-react";
import type { Workout } from "../types";
import { ExerciseImage } from "../components/ExerciseImage";
import treinoA from "../assets/cards/treino_a.webp";
import treinoB from "../assets/cards/treino_b.webp";
import treinoC from "../assets/cards/treino_c.webp";
import { PageHeader, SectionTitle } from "../components/UI";

const workoutCards: Record<string, string> = { a: treinoA, b: treinoB, c: treinoC };
const cardDescriptions: Record<string, string> = {
  a: "Peito, ombros e tríceps", b: "Costas, bíceps e posterior de ombro", c: "Pernas e abdômen",
};

export function Workouts({
  workouts,
  navigate,
  activeWorkoutName,
}: {
  workouts: Workout[];
  navigate: (page: string) => void;
  activeWorkoutName?: string;
}) {
  return (
    <section className="workouts-index">
      <PageHeader
        title="Meus treinos"
      >
        {activeWorkoutName && (
          <button className="resume-banner" onClick={() => navigate("session")}
            aria-label={`Continuar ${activeWorkoutName} em andamento`}>
            <span><strong>{activeWorkoutName}</strong><br />em andamento</span>
            <Play size={14} fill="currentColor" />
          </button>
        )}
      </PageHeader>
      <div className="workout-grid">
        {workouts.map((w) => (
          <button key={w.id} className="workout-card asset-workout-card"
            aria-label={`Abrir ${w.name}`} onClick={() => navigate(`workout/${w.id}`)}>
            {workoutCards[w.id] ? <img className="workout-card-image"
              src={workoutCards[w.id]} alt={`${w.name}: ${cardDescriptions[w.id] ?? w.groups.join(", ")}`} decoding="async" />
              : <span>{w.name}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
export function WorkoutDetails({
  workout,
  back,
  start,
  execute,
}: {
  workout: Workout;
  back: () => void;
  start: () => void;
  execute: (exerciseId: string) => void;
}) {
  return (
    <div className="details-grid simplified-details">
      <h1 className="sr-only">{workout.name}</h1>
      <section className="workout-summary" aria-label="Resumo do treino">
        <div className="workout-summary-row">
          <button className="icon-button back-button" onClick={back} aria-label="Voltar"><ArrowLeft size={21} /></button>
          <div className="workout-summary-stats">
            <span><Dumbbell size={16} />{workout.exercises.length} exercícios</span>
            <span><Clock3 size={16} />~{workout.duration} min</span>
          </div>
          <button className="button primary" onClick={start} aria-label="Iniciar treino"><Play size={16} fill="currentColor" />Iniciar treino</button>
        </div>
      </section>
      <section>
        <SectionTitle title="Seu roteiro de hoje" />
        <div className="exercise-list">
          {workout.exercises.map((e, i) => (
            <button
              className="exercise-card"
              key={e.id}
              onClick={() => execute(e.id)}
              aria-label={`Executar ${e.name}`}
            >
              <span className="exercise-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <ExerciseImage name={e.name} className="exercise-symbol" />
              <span className="exercise-info">
                <strong>{e.name}</strong>
                <span>
                  {e.sets} séries <i /> {e.reps} repetições
                </span>
                <small>
                  {e.load} kg <span>·</span> {e.rest}s de descanso
                </small>
              </span>
              <ChevronRight className="mobile-chevron" size={18} />
            </button>
          ))}
        </div>
        <p className="demo-note">
          Toque em um exercício para iniciar ou continuar sua execução.
        </p>
      </section>
    </div>
  );
}
