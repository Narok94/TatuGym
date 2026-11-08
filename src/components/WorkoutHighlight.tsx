import { ArrowRight, Clock3, Dumbbell, Play } from "lucide-react";
import type { Session, Workout } from "../types";
import { formatWorkoutDuration, workoutElapsedSeconds } from "../workoutTime";
import { Anatomy } from "./Anatomy";
import "./workoutHighlight.css";

export function WorkoutHighlight({ workout, session, now, start }: {
  workout: Workout;
  session: Session | null;
  now: number;
  start: (workout: Workout) => void;
}) {
  const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const completedSets = workout.exercises.reduce((sum, exercise) => sum +
    Array.from({ length: exercise.sets }, (_, index) => index).filter(index =>
      session?.sets.some(set => set.exerciseId === exercise.id && set.setIndex === index)).length, 0);
  return (
    <section className="workout-highlight" aria-label={`Destaque ${workout.name}`}>
      <header className="workout-highlight-heading">
        <span className="workout-highlight-status">
          <span className="pulse-dot" />
          {session ? "Treino em andamento" : "Seu próximo treino"}
        </span>
        <h2>{workout.name}</h2>
      </header>
      <div className="workout-highlight-stage">
        <div className="workout-highlight-muscles" aria-label="Músculos trabalhados">
          <p>FOCO DO TREINO</p>
          <ul>{workout.groups.map(group => <li key={group}>{group}</li>)}</ul>
        </div>
        <Anatomy group={workout.muscle} className="workout-highlight-art" />
      </div>
      <div className="workout-highlight-footer">
        <div className="workout-highlight-metrics">
          <div><Dumbbell size={18} /><span><small>Seu roteiro</small><strong>{workout.exercises.length} exercícios</strong></span></div>
          <div><Clock3 size={18} /><span><small>{session ? "Tempo de treino" : "Duração prevista"}</small>
            <strong aria-label={session ? "Tempo de treino decorrido" : undefined}>
              {session ? formatWorkoutDuration(workoutElapsedSeconds(session, now)) : `~${workout.duration} min`}
            </strong>
          </span></div>
        </div>
        <div className="workout-highlight-progress">
          <div><span>{session ? "Seu progresso" : "Séries no roteiro"}</span><strong>{session ? `${completedSets} de ${totalSets}` : totalSets} séries</strong></div>
          <progress aria-label="Séries concluídas" value={completedSets} max={Math.max(1, totalSets)} />
        </div>
        <button className="button primary" onClick={() => start(workout)}>
          <Play size={17} fill="currentColor" />
          {session ? "Continuar treino" : "Iniciar treino"}
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}
