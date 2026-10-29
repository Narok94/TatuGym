export type Theme = "light" | "dark" | "system";
export type MuscleGroup = "push" | "pull" | "legs";
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  load: number;
  rest: number;
}
export interface Workout {
  id: string;
  name: string;
  subtitle: string;
  groups: string[];
  duration: number;
  muscle: MuscleGroup;
  exercises: Exercise[];
}
export interface Meal {
  id: string;
  name: string;
  time: string;
  foods: { name: string; quantity: string }[];
}
export interface SetLog {
  exerciseId: string;
  setIndex: number;
  load: number;
  reps: number;
  completedAt: string;
}
export interface Session {
  id: string;
  workout: Workout;
  startedAt: string;
  currentExercise: number;
  sets: SetLog[];
  drafts?: Record<string, { load: number; reps: number }>;
  rest: { remaining: number; endsAt: number | null };
}
export interface WorkoutRecord extends Session {
  finishedAt: string;
}
export interface WeightEntry {
  id: string;
  date: string;
  value: number;
}
export interface AppData {
  version: 1;
  user: { id: string; name: string };
  welcomed: boolean;
  theme: Theme;
  workouts: Workout[];
  meals: Meal[];
  mealLogs: Record<string, string[]>;
  activeSession: Session | null;
  history: WorkoutRecord[];
  weights: WeightEntry[];
}
