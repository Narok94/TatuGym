import { useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Dumbbell,
  Plus,
  Scale,
  TrendingUp,
  Trash2,
} from "lucide-react";
import type { AppData, WeightEntry } from "../types";
import { localDate, uid } from "../store";
import { EmptyState, Modal, PageHeader, SectionTitle } from "../components/UI";

export default function Progress({
  data,
  back,
  saveWeight,
  deleteWeight,
}: {
  data: AppData;
  back: () => void;
  saveWeight: (entry: WeightEntry) => void;
  deleteWeight: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(localDate());
  const [openRecord, setOpenRecord] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState("");
  const sorted = [...data.weights].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-14);
  const min = Math.min(...recent.map((w) => w.value)) - 1,
    max = Math.max(...recent.map((w) => w.value)) + 1;
  const points = recent.map((w) => ({
    x:
      45 +
      (recent.length === 1
        ? 0.5
        : (new Date(`${w.date}T12:00:00`).getTime() -
            new Date(`${recent[0].date}T12:00:00`).getTime()) /
          Math.max(
            1,
            new Date(`${recent.at(-1)!.date}T12:00:00`).getTime() -
              new Date(`${recent[0].date}T12:00:00`).getTime(),
          )) *
        600,
    y: 155 - ((w.value - min) / (max - min)) * 125,
    entry: w,
  }));
  const exercises = Array.from(
    new Map(
      data.history.flatMap((h) =>
        h.workout.exercises.map((e) => [e.id, e] as const),
      ),
    ).values(),
  );
  const selectedExercise = exerciseId || exercises[0]?.id;
  const loads = data.history.flatMap((h) => {
    const sets = h.sets.filter((s) => s.exerciseId === selectedExercise);
    return sets.length
      ? [
          {
            id: h.id,
            date: h.finishedAt,
            max: Math.max(...sets.map((s) => s.load)),
            sets: sets.length,
            name: h.workout.exercises.find((e) => e.id === selectedExercise)
              ?.name,
          },
        ]
      : [];
  });
  return (
    <>
      <PageHeader
        eyebrow="CADA CONQUISTA CONTA"
        title="Meu progresso"
        description="Pequenos passos. Resultados que ficam."
        back={back}
      />
      <div className="progress-summary">
        <div className="panel">
          <span className="tile-icon orange-tile">
            <Dumbbell size={23} />
          </span>
          <div>
            <strong>{data.history.length}</strong>
            <span>Treinos registrados</span>
          </div>
        </div>
        <div className="panel">
          <span className="tile-icon">
            <Scale size={23} />
          </span>
          <div>
            <strong>
              {sorted.at(-1)?.value.toLocaleString("pt-BR") || "—"}
              <small> kg</small>
            </strong>
            <span>Último peso registrado</span>
          </div>
        </div>
        <div className="panel">
          <span className="tile-icon">
            <Check size={23} />
          </span>
          <div>
            <strong>
              {data.history.reduce((n, h) => n + h.sets.length, 0)}
            </strong>
            <span>Séries concluídas</span>
          </div>
        </div>
      </div>
      <section className="panel weight-panel">
        <SectionTitle
          title="Evolução do peso"
          action="Registrar peso"
          onAction={() => setAdding(true)}
        />
        {recent.length ? (
          <>
            <div className="chart-caption">
              <strong>
                {recent.at(-1)!.value.toLocaleString("pt-BR")}
                <span> kg</span>
              </strong>
              <span className="muted">
                {recent.length > 1
                  ? `${(recent.at(-1)!.value - recent[0].value).toLocaleString("pt-BR", { signDisplay: "always", maximumFractionDigits: 1 })} kg no período`
                  : "Seu ponto de partida"}
              </span>
            </div>
            <svg
              className="weight-chart"
              viewBox="0 0 690 195"
              role="img"
              aria-label={`Evolução do peso: ${recent.map((w) => `${formatDate(w.date)}: ${w.value} kg`).join("; ")}`}
            >
              <defs>
                <linearGradient id="weight-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop stopColor="#ff7a24" stopOpacity=".2" />
                  <stop offset="1" stopColor="#ff7a24" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <line
                    x1="45"
                    y1={30 + i * 62.5}
                    x2="645"
                    y2={30 + i * 62.5}
                    className="chart-grid"
                  />
                  <text x="0" y={34 + i * 62.5}>
                    {(max - (i * (max - min)) / 2).toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}
                  </text>
                </g>
              ))}
              {points.length > 1 && (
                <>
                  <path
                    d={`M${points[0].x},165 ${points.map((p) => `L${p.x},${p.y}`).join(" ")} L${points.at(-1)!.x},165Z`}
                    fill="url(#weight-fill)"
                  />
                  <polyline
                    points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#ff7a24"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </>
              )}
              {points.map((p) => (
                <circle
                  key={p.entry.id}
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#ff7a24"
                >
                  <title>
                    {formatDate(p.entry.date)}: {p.entry.value} kg
                  </title>
                </circle>
              ))}
              <text x="45" y="190">
                {formatDate(recent[0].date)}
              </text>
              <text x="645" y="190" textAnchor="end">
                {formatDate(recent.at(-1)!.date)}
              </text>
            </svg>
            <details className="weight-details">
              <summary>Ver registros de peso ({sorted.length})</summary>
              <ul>
                {[...sorted].reverse().map((w) => (
                  <li key={w.id}>
                    <span>{formatDate(w.date, true)}</span>
                    <strong>{w.value.toLocaleString("pt-BR")} kg</strong>
                    <button
                      className="icon-button"
                      aria-label={`Excluir peso de ${formatDate(w.date)}`}
                      onClick={() => deleteWeight(w.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : (
          <EmptyState
            icon={<Scale size={28} />}
            title="Sua evolução começa aqui"
            description="Registre seu primeiro peso para acompanhar as mudanças ao longo do tempo."
          />
        )}
      </section>
      <div className="history-grid">
        <section>
          <SectionTitle title="Histórico de treinos" />
          <div className="history-list">
            {data.history.length ? (
              data.history.map((h) => (
                <article key={h.id} className="panel history-card">
                  <button
                    className="history-heading"
                    onClick={() =>
                      setOpenRecord(openRecord === h.id ? null : h.id)
                    }
                    aria-expanded={openRecord === h.id}
                  >
                    <span className="tile-icon">
                      <Dumbbell size={23} />
                    </span>
                    <span>
                      <strong>{h.workout.name}</strong>
                      <small>
                        {formatDate(h.finishedAt, true)} · {h.sets.length}{" "}
                        séries
                      </small>
                    </span>
                    <ChevronDown size={18} />
                  </button>
                  {openRecord === h.id && (
                    <div className="history-expanded">
                      <p className="muted">
                        {h.sets.length}/
                        {h.workout.exercises.reduce((n, e) => n + e.sets, 0)}{" "}
                        séries previstas registradas
                      </p>
                      {h.workout.exercises.map((e) => (
                        <div key={e.id}>
                          <h4>{e.name}</h4>
                          {h.sets
                            .filter((s) => s.exerciseId === e.id)
                            .map((s) => (
                              <p key={s.setIndex}>
                                Série {s.setIndex + 1}
                                <strong>
                                  {s.reps} rep · {s.load} kg
                                </strong>
                              </p>
                            ))}
                          {!h.sets.some((s) => s.exerciseId === e.id) && (
                            <p className="muted">Sem séries registradas</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="panel">
                <EmptyState
                  icon={<CalendarDays size={28} />}
                  title="O primeiro de muitos"
                  description="Seus treinos finalizados aparecerão aqui, com todas as séries e cargas."
                />
              </div>
            )}
          </div>
        </section>
        <section>
          <SectionTitle title="Histórico de cargas" />
          <div className="panel load-panel">
            {exercises.length ? (
              <>
                <label>
                  Exercício
                  <select
                    value={selectedExercise}
                    onChange={(e) => setExerciseId(e.target.value)}
                  >
                    {exercises.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </label>
                {loads.length ? (
                  <ul>
                    {loads.map((l) => (
                      <li key={l.id}>
                        <span>
                          {formatDate(l.date, true)}
                          <small>{l.sets} séries registradas</small>
                        </span>
                        <strong>
                          {l.max} <small>kg</small>
                        </strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="helper">
                    Nenhuma série registrada para este exercício.
                  </p>
                )}
                <p className="helper">Maior carga registrada em cada treino.</p>
              </>
            ) : (
              <EmptyState
                icon={<TrendingUp size={28} />}
                title="Mais forte a cada treino"
                description="As cargas das séries concluídas ficam salvas para você comparar."
              />
            )}
          </div>
        </section>
      </div>
      {adding && (
        <Modal title="Registrar peso" onClose={() => setAdding(false)}>
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              saveWeight({ id: uid(), date, value: Number(weight) });
              setAdding(false);
              setWeight("");
            }}
          >
            <label>
              Peso corporal (kg)
              <input
                required
                autoFocus
                type="number"
                min="20"
                max="400"
                step="0.1"
                placeholder="Ex.: 78,5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </label>
            <label>
              Data
              <input
                required
                type="date"
                max={localDate()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <p className="helper">
              Se já houver um registro nesta data, ele será atualizado.
            </p>
            <button className="button primary" type="submit">
              <Plus size={17} />
              Salvar registro
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
function formatDate(date: string, year = false) {
  return new Date(
    date.length === 10 ? `${date}T12:00:00` : date,
  ).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    ...(year ? { year: "numeric" } : {}),
  });
}
