import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Dumbbell,
  Play,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { AppData, Workout } from "../types";
import { localDate } from "../store";
import { Anatomy } from "../components/Anatomy";
import {
  PageHeader,
  SectionTitle,
} from "../components/UI";

export function suggestedWorkout(data: AppData) {
  const last = data.history[0];
  const index = last
    ? data.workouts.findIndex((w) => w.id === last.workout.id)
    : -1;
  return data.workouts[(index + 1) % data.workouts.length];
}
export default function Home({
  data,
  navigate,
  start,
}: {
  data: AppData;
  navigate: (page: string) => void;
  start: (workout: Workout) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const
    hour = now.getHours(),
    today = localDate();
  const workout = data.activeSession?.workout || suggestedWorkout(data);
  const logs = data.mealLogs[today] || [];
  const meals = [...data.meals].sort((a, b) => a.time.localeCompare(b.time));
  const time = `${String(hour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const pending = meals.filter((m) => !logs.includes(m.id));
  const nextMeal = pending.find((m) => m.time >= time) || pending[0];
  return (
    <>
      <PageHeader
        eyebrow={now.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={`${hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite"}, ${data.user.name}!`}
        description="Um passo de cada vez. Todos os dias."
      />
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="hero-workout">
            <Anatomy group={workout.muscle} />
            <div className="hero-content">
              <span className="pill">
                <span className="pulse-dot" />
                {data.activeSession
                  ? "Treino em andamento"
                  : "SEU PRÓXIMO TREINO"}
              </span>
              <p className="hero-kicker">Hoje é dia de superar.</p>
              <h2>{workout.name}</h2>
              <p className="hero-groups">{workout.groups.join(" · ")}</p>
              <div className="hero-meta">
                <span>
                  <Dumbbell size={14} />
                  {workout.exercises.length} exercícios
                </span>
                <span>
                  <Clock3 size={14} />~{workout.duration} min
                </span>
              </div>
              <button className="button primary" onClick={() => start(workout)}>
                <Play size={17} fill="currentColor" />
                {data.activeSession ? "Continuar treino" : "Iniciar treino"}
                <ArrowRight size={18} />
              </button>
            </div>
            <span className="hero-number">
              0{workout.id === "a" ? "1" : workout.id === "b" ? "2" : "3"}
            </span>
          </section>
        </div>
        <aside className="dashboard-aside">
          <SectionTitle title="No seu ritmo" />
          <button className="next-meal panel" onClick={() => navigate("diet")}>
            <div className="next-meal-top">
              <span className="tile-icon">
                <Utensils size={25} />
              </span>
              <ArrowUpRight size={20} />
            </div>
            <p className="eyebrow">
              {nextMeal ? "PRÓXIMA REFEIÇÃO" : "TUDO CERTO POR HOJE"}
            </p>
            <h3>{nextMeal?.name || "Refeições concluídas"}</h3>
            <p className="meal-time">
              {nextMeal ? (
                <>
                  <Clock3 size={15} />
                  {nextMeal.time}
                </>
              ) : (
                <>
                  <Check size={15} />
                  Bom trabalho!
                </>
              )}
            </p>
            <span className="meal-summary">
              {nextMeal
                ? nextMeal.foods
                    .map((f) => f.name)
                    .slice(0, 3)
                    .join(" · ")
                : "Consulte seu plano alimentar."}
            </span>
            <span className="inline-action">
              Ver minha dieta
              <ChevronRight size={16} />
            </span>
          </button>
          <div className="small-note">
            <Sparkles size={16} />
            <p>
              Feito para você.
              <br />
              <span>Seu treino. Seu ritmo.</span>
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
