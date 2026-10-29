import {
  ChevronRight,
  Clock3,
  Dumbbell,
  Pencil,
} from "lucide-react";
import type { Exercise, Workout } from "../types";
import { Anatomy } from "../components/Anatomy";
import { ExerciseImage } from "../components/ExerciseImage";
import treinoA from "../assets/cards/treino_a.png";
import treinoB from "../assets/cards/treino_b.png";
import treinoC from "../assets/cards/treino_c.png";
import startButton from "../assets/interface/botao_laranja.png";
import { PageHeader, SectionTitle } from "../components/UI";

const workoutCards: Record<string, string> = { a: treinoA, b: treinoB, c: treinoC };

export function Workouts({
  workouts,
  navigate,
}: {
  workouts: Workout[];
  navigate: (page: string) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="SEU PLANO DE TREINO"
        title="Meus treinos"
        description="Cada treino, um passo mais perto da sua melhor versão."
      />
      <div className="workout-grid">
        {workouts.map((w) => (
          <button key={w.id} className="workout-card asset-workout-card"
            aria-label={`Abrir ${w.name}`} onClick={() => navigate(`workout/${w.id}`)}>
            {workoutCards[w.id] ? <img className="workout-card-image"
              src={workoutCards[w.id]} alt={`${w.name}: ${w.groups.join(", ")}`} decoding="async" />
              : <span>{w.name}</span>}
          </button>
        ))}
      </div>
    </>
  );
}
export function WorkoutDetails({
  workout,
  back,
  start,
  edit,
}: {
  workout: Workout;
  back: () => void;
  start: () => void;
  edit: (exercise: Exercise) => void;
}) {
  return (
    <>
      <PageHeader
        eyebrow="VAMOS AO PRÓXIMO PASSO"
        title={workout.name}
        description={workout.groups.join(" · ")}
        back={back}
      />
      <div className="details-grid">
        <section className="workout-overview">
          <div className="detail-art">
            <Anatomy group={workout.muscle} />
          </div>
          <div className="workout-facts">
            <div>
              <Dumbbell size={20} />
              <strong>{workout.exercises.length}</strong>
              <span>exercícios</span>
            </div>
            <div>
              <Clock3 size={20} />
              <strong>~{workout.duration}</strong>
              <span>minutos</span>
            </div>
          </div>
          <button className="asset-start-button" onClick={start} aria-label="Iniciar treino">
            <img src={startButton} alt="" width="270" height="63" />
          </button>
          <p className="helper">
            Mantenha a boa execução e respeite o descanso entre as séries.
          </p>
        </section>
        <section>
          <SectionTitle title="Seu roteiro de hoje" />
          <div className="exercise-list">
            {workout.exercises.map((e, i) => (
              <button
                className="exercise-card"
                key={e.id}
                onClick={() => edit(e)}
                aria-label={`Editar ${e.name}`}
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
                <Pencil size={16} className="edit-icon" />
                <ChevronRight className="mobile-chevron" size={18} />
              </button>
            ))}
          </div>
          <p className="demo-note">
            Toque em um exercício para editar séries, repetições, carga e
            descanso.
          </p>
        </section>
      </div>
    </>
  );
}
