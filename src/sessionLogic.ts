import type { Session } from "./types";

export const emptyRest = () => ({ remaining: 0, endsAt: null });
export function nextSet(session: Session, exerciseIndex = session.currentExercise) {
  const exercise = session.workout.exercises[exerciseIndex];
  return Array.from({ length: exercise.sets }, (_, i) => i).find((i) =>
    !session.sets.some((s) => s.exerciseId === exercise.id && s.setIndex === i));
}
export function isComplete(session: Session) {
  return session.workout.exercises.every((_, index) => nextSet(session, index) === undefined);
}
export function selectExercise(session: Session, index: number): Session {
  if (index < 0 || index >= session.workout.exercises.length || index === session.currentExercise) return session;
  return { ...session, currentExercise: index, rest: emptyRest() };
}
export function completeSet(session: Session, exerciseId: string, setIndex: number, load: number, reps: number, now = Date.now()): Session {
  const exercise = session.workout.exercises[session.currentExercise];
  if (exercise.id !== exerciseId || nextSet(session) !== setIndex ||
      !Number.isFinite(load) || !Number.isInteger(reps) || reps < 1 || reps > 999 || load < 0 || load > 1000) return session;
  const updated: Session = { ...session, sets: [...session.sets, {
    exerciseId, setIndex, load, reps, completedAt: new Date(now).toISOString(),
  }], rest: emptyRest() };
  if (nextSet(updated) !== undefined) {
    updated.rest = { remaining: exercise.rest, endsAt: exercise.rest > 0 ? now + exercise.rest * 1000 : null };
  } else {
    // Wrap to unfinished exercises when the user chose a different order.
    const count = session.workout.exercises.length;
    for (let offset = 1; offset < count; offset++) {
      const index = (session.currentExercise + offset) % count;
      if (nextSet(updated, index) !== undefined) { updated.currentExercise = index; break; }
    }
  }
  return updated;
}

let audioContext: AudioContext | undefined;
export function unlockRestAudio() {
  try {
    const Audio = globalThis.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Audio) return;
    audioContext ??= new Audio();
    void audioContext.resume().catch(() => {});
  } catch { /* Vibration and the visual alert remain available. */ }
}
export function signalRestEnd() {
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* Unsupported device. */ }
  try {
    if (!audioContext || audioContext.state !== "running") return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
    oscillator.start(); oscillator.stop(audioContext.currentTime + 0.6);
  } catch { /* The visual alert always works without permissions. */ }
}
