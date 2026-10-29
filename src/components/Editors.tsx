import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Exercise, Meal } from "../types";
import { Modal } from "./UI";

export function ExerciseEditor({
  exercise,
  onSave,
  onClose,
}: {
  exercise: Exercise;
  onSave: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(exercise);
  return (
    <Modal title="Editar exercício" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
        className="form-stack"
      >
        <label>
          Nome do exercício
          <input
            required
            maxLength={80}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Séries
            <input
              required
              type="number"
              min="1"
              max="20"
              value={draft.sets}
              onChange={(e) =>
                setDraft({ ...draft, sets: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Repetições
            <input
              required
              maxLength={20}
              value={draft.reps}
              onChange={(e) => setDraft({ ...draft, reps: e.target.value })}
            />
          </label>
          <label>
            Carga (kg)
            <input
              required
              type="number"
              step="0.5"
              min="0"
              max="1000"
              value={draft.load}
              onChange={(e) =>
                setDraft({ ...draft, load: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Descanso (segundos)
            <input
              required
              type="number"
              min="5"
              max="600"
              value={draft.rest}
              onChange={(e) =>
                setDraft({ ...draft, rest: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <p className="helper">
          As alterações serão usadas nos próximos treinos. Os registros
          anteriores são preservados.
        </p>
        <button className="button primary" type="submit">
          Salvar alterações
        </button>
      </form>
    </Modal>
  );
}
export function MealEditor({
  meal,
  onSave,
  onClose,
}: {
  meal: Meal;
  onSave: (meal: Meal) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(structuredClone(meal));
  return (
    <Modal title="Editar refeição" onClose={onClose}>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(draft);
        }}
      >
        <div className="form-grid">
          <label>
            Nome
            <input
              required
              maxLength={60}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label>
            Horário
            <input
              required
              type="time"
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
            />
          </label>
        </div>
        <p className="field-title">Alimentos e quantidades</p>
        {draft.foods.map((food, i) => (
          <div className="food-edit-row" key={i}>
            <label className="sr-only" htmlFor={`food-${i}`}>
              Alimento {i + 1}
            </label>
            <input
              id={`food-${i}`}
              placeholder="Alimento"
              required
              maxLength={80}
              value={food.name}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  foods: draft.foods.map((f, j) =>
                    j === i ? { ...f, name: e.target.value } : f,
                  ),
                })
              }
            />
            <label className="sr-only" htmlFor={`quantity-${i}`}>
              Quantidade {i + 1}
            </label>
            <input
              id={`quantity-${i}`}
              placeholder="Quantidade"
              required
              maxLength={40}
              value={food.quantity}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  foods: draft.foods.map((f, j) =>
                    j === i ? { ...f, quantity: e.target.value } : f,
                  ),
                })
              }
            />
            <button
              type="button"
              className="icon-button"
              aria-label={`Remover ${food.name || "alimento"}`}
              disabled={draft.foods.length <= 1}
              onClick={() =>
                setDraft({
                  ...draft,
                  foods: draft.foods.filter((_, j) => j !== i),
                })
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        <button
          className="button secondary"
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              foods: [...draft.foods, { name: "", quantity: "" }],
            })
          }
        >
          <Plus size={17} />
          Adicionar alimento
        </button>
        <button className="button primary" type="submit">
          Salvar refeição
        </button>
      </form>
    </Modal>
  );
}
