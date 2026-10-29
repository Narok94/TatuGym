import type { AppData, Exercise, Workout } from "./types";

const exercise = (
  id: string,
  name: string,
  sets: number,
  reps: string,
  load: number,
  rest = 90,
): Exercise => ({ id, name, sets, reps, load, rest });
export const demoWorkouts: Workout[] = [
  {
    id: "a",
    name: "Treino A",
    subtitle: "Força que vem de dentro.",
    groups: ["Peito", "Tríceps", "Ombros"],
    duration: 50,
    muscle: "push",
    exercises: [
      exercise("supino-reto", "Supino reto", 4, "8–12", 40),
      exercise("supino-inclinado", "Supino inclinado", 3, "8–12", 28),
      exercise("crucifixo", "Crucifixo", 3, "12–15", 12, 60),
      exercise("desenvolvimento", "Desenvolvimento", 3, "8–12", 16),
      exercise("elevacao-lateral", "Elevação lateral", 3, "10–12", 8, 60),
      exercise("triceps-polia", "Tríceps na polia", 3, "10–12", 25, 60),
      exercise("triceps-frances", "Tríceps francês", 3, "10–12", 10, 60),
    ],
  },
  {
    id: "b",
    name: "Treino B",
    subtitle: "Construa sua melhor versão.",
    groups: ["Costas", "Bíceps"],
    duration: 45,
    muscle: "pull",
    exercises: [
      exercise("puxada", "Puxada frontal", 4, "8–12", 40),
      exercise("remada-baixa", "Remada baixa", 3, "10–12", 35),
      exercise("remada-unilateral", "Remada unilateral", 3, "10–12", 18),
      exercise("pulldown", "Pulldown", 3, "12–15", 20, 60),
      exercise("rosca-direta", "Rosca direta", 3, "10–12", 16, 60),
      exercise("rosca-martelo", "Rosca martelo", 3, "10–12", 10, 60),
    ],
  },
  {
    id: "c",
    name: "Treino C",
    subtitle: "Uma base forte para ir além.",
    groups: ["Pernas", "Glúteos", "Core"],
    duration: 55,
    muscle: "legs",
    exercises: [
      exercise("agachamento", "Agachamento livre", 4, "8–12", 40, 120),
      exercise("leg-press", "Leg press", 3, "10–12", 100),
      exercise("extensora", "Cadeira extensora", 3, "12–15", 30, 60),
      exercise("flexora", "Mesa flexora", 3, "12–15", 25, 60),
      exercise("hip-thrust", "Elevação pélvica", 3, "10–12", 40),
      exercise("panturrilha", "Panturrilha em pé", 3, "15–20", 20, 60),
      exercise("prancha", "Abdominal no solo", 3, "15–20", 0, 60),
    ],
  },
];
export const createInitialData = (): AppData => ({
  version: 1,
  user: { id: "henrique-local", name: "Henrique" },
  welcomed: false,
  theme: "system",
  workouts: structuredClone(demoWorkouts),
  meals: [
    {
      id: "cafe",
      name: "Café da manhã",
      time: "07:00",
      foods: [
        { name: "Ovos mexidos", quantity: "2 unidades" },
        { name: "Pão integral", quantity: "2 fatias" },
        { name: "Banana", quantity: "1 unidade" },
      ],
    },
    {
      id: "lanche-manha",
      name: "Lanche da manhã",
      time: "10:00",
      foods: [
        { name: "Iogurte natural", quantity: "170 g" },
        { name: "Aveia", quantity: "30 g" },
      ],
    },
    {
      id: "almoco",
      name: "Almoço",
      time: "12:30",
      foods: [
        { name: "Arroz integral", quantity: "120 g" },
        { name: "Feijão", quantity: "80 g" },
        { name: "Frango grelhado", quantity: "150 g" },
        { name: "Salada variada", quantity: "1 porção" },
      ],
    },
    {
      id: "lanche-tarde",
      name: "Lanche da tarde",
      time: "16:00",
      foods: [
        { name: "Pão integral", quantity: "2 fatias" },
        { name: "Queijo branco", quantity: "40 g" },
        { name: "Maçã", quantity: "1 unidade" },
      ],
    },
    {
      id: "jantar",
      name: "Jantar",
      time: "19:30",
      foods: [
        { name: "Batata-doce", quantity: "150 g" },
        { name: "Peixe grelhado", quantity: "150 g" },
        { name: "Legumes", quantity: "100 g" },
      ],
    },
  ],
  mealLogs: {},
  activeSession: null,
  history: [],
  weights: [],
});
