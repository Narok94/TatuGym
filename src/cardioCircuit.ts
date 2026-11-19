export const cardioExercises = [
  { name: "Joelho no cotovelo oposto", seconds: 40, image: "/cardio/joelho-cotovelo-oposto.webp" },
  { name: "Corrida parada", seconds: 40, image: "/cardio/corrida-parada.webp" },
  { name: "Abdominal reverso", seconds: 30, image: "/exercises/abdominal-inverso.webp" },
  { name: "Corda", seconds: 30, image: "/cardio/corda-cardio.webp" },
];

export type RopeSeconds = 20 | 30;
export interface CardioPhase {
  kind: "exercise" | "rest" | "round-rest";
  round: number;
  exercise: number;
  seconds: number;
}
export interface CardioTimer {
  ropeSeconds: RopeSeconds;
  elapsedMs: number;
  resumedAt: number | null;
  status: "idle" | "active" | "complete";
}
export const newCardioTimer = (ropeSeconds: RopeSeconds = 30): CardioTimer => ({
  ropeSeconds, elapsedMs: 0, resumedAt: null, status: "idle",
});

export function cardioPhases(ropeSeconds: RopeSeconds): CardioPhase[] {
  const phases: CardioPhase[] = [];
  for (let round = 1; round <= 3; round++) {
    cardioExercises.forEach((exercise, index) => {
      phases.push({ kind: "exercise", round, exercise: index, seconds: index === 3 ? ropeSeconds : exercise.seconds });
      if (index < 3) phases.push({ kind: "rest", round, exercise: index, seconds: 20 });
      else if (round < 3) phases.push({ kind: "round-rest", round, exercise: index, seconds: 60 });
    });
  }
  return phases;
}

// Wall-clock time avoids drift when a tab is throttled, reloaded or reopened.
export function cardioPosition(timer: CardioTimer, now: number) {
  const phases = cardioPhases(timer.ropeSeconds);
  const totalMs = phases.reduce((sum, phase) => sum + phase.seconds * 1000, 0);
  const elapsedMs = Math.min(totalMs, timer.elapsedMs + (timer.resumedAt === null ? 0 : Math.max(0, now - timer.resumedAt)));
  let offset = elapsedMs;
  let index = 0;
  while (index < phases.length && offset >= phases[index].seconds * 1000) {
    offset -= phases[index].seconds * 1000;
    index++;
  }
  return { phases, index, phase: phases[index] as CardioPhase | undefined,
    remaining: index < phases.length ? Math.ceil(phases[index].seconds - offset / 1000) : 0,
    elapsedMs, totalMs, complete: index === phases.length };
}

export function restoreCardioTimer(raw: string | null): CardioTimer {
  try {
    const value = JSON.parse(raw ?? "null");
    if (value && (value.ropeSeconds === 20 || value.ropeSeconds === 30) &&
      Number.isFinite(value.elapsedMs) && value.elapsedMs >= 0 &&
      (value.resumedAt === null || (Number.isFinite(value.resumedAt) && value.resumedAt > 0)) &&
      ["idle", "active", "complete"].includes(value.status) &&
      (value.status === "active" || value.resumedAt === null)) return value;
  } catch { /* Ignore an incomplete or obsolete local snapshot. */ }
  return newCardioTimer();
}
