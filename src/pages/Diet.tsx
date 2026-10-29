import { useState } from "react";
import {
  Apple,
  Check,
  ChevronDown,
  Coffee,
  Moon,
  Pencil,
  Sun,
  Utensils,
} from "lucide-react";
import type { Meal } from "../types";
import { PageHeader } from "../components/UI";

export default function Diet({
  meals,
  completed,
  toggle,
  edit,
}: {
  meals: Meal[];
  completed: string[];
  toggle: (id: string) => void;
  edit: (meal: Meal) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <>
      <PageHeader
        eyebrow="NUTRA SUA MELHOR VERSÃO"
        title="Minha dieta"
        description="Equilíbrio e constância também fazem parte do treino."
      />
      <div className="diet-intro panel">
        <span className="tile-icon orange-tile">
          <Utensils size={25} />
        </span>
        <div>
          <h2>Seu plano alimentar</h2>
          <p className="muted">
            {completed.length} de {meals.length} refeições realizadas hoje
          </p>
        </div>
        <span className="diet-counter">
          {completed.length}
          <small>/{meals.length}</small>
        </span>
        <div className="progress-track">
          <span
            style={{ width: `${(completed.length / meals.length) * 100}%` }}
          />
        </div>
      </div>
      <p className="optional-note">
        Registrar as refeições é opcional. Use o plano do seu jeito.
      </p>
      <div className="meals-list">
        {[...meals]
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((meal, i) => {
            const done = completed.includes(meal.id),
              open = expanded === meal.id;
            const Icon = [Coffee, Apple, Sun, Apple, Moon][i % 5];
            return (
              <section
                className={`meal-card panel ${done ? "meal-done" : ""}`}
                key={meal.id}
              >
                <div className="meal-card-row">
                  <span className="meal-hour">
                    {meal.time}
                    <span className="timeline-dot" />
                  </span>
                  <button
                    className="meal-expand"
                    aria-expanded={open}
                    aria-controls={`foods-${meal.id}`}
                    onClick={() => setExpanded(open ? null : meal.id)}
                  >
                    <span className="tile-icon">
                      <Icon size={24} />
                    </span>
                    <span className="meal-card-info">
                      <strong>{meal.name}</strong>
                      <span>{meal.foods.map((f) => f.name).join(" · ")}</span>
                    </span>
                    <ChevronDown size={19} className={open ? "rotated" : ""} />
                  </button>
                  <button
                    className={`meal-check ${done ? "checked" : ""}`}
                    aria-label={`${done ? "Desmarcar" : "Marcar como realizada"}: ${meal.name}`}
                    aria-pressed={done}
                    onClick={() => toggle(meal.id)}
                  >
                    {done ? <Check size={19} /> : <span />}
                  </button>
                </div>
                {open && (
                  <div className="meal-expanded" id={`foods-${meal.id}`}>
                    <ul>
                      {meal.foods.map((food, j) => (
                        <li key={j}>
                          <span>{food.name}</span>
                          <strong>{food.quantity}</strong>
                        </li>
                      ))}
                    </ul>
                    <button className="text-button" onClick={() => edit(meal)}>
                      <Pencil size={15} />
                      Editar refeição
                    </button>
                  </div>
                )}
              </section>
            );
          })}
      </div>
      <div className="info-strip">
        <Utensils size={20} />
        <p>
          <strong>Alimentação que acompanha sua rotina.</strong> Este é um plano
          demonstrativo, pronto para ser substituído pela sua dieta.
        </p>
      </div>
    </>
  );
}
