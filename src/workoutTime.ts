export function workoutElapsedSeconds(workout: { startedAt: string; finishedAt?: string }, now = Date.now()) {
  const start = Date.parse(workout.startedAt);
  const end = workout.finishedAt === undefined ? now : Date.parse(workout.finishedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 1000));
}

export function formatWorkoutDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const remaining = seconds % 60;
  return [hours, minutes, remaining].map(value => String(value).padStart(2, "0")).join(":");
}
