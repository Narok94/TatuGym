import catalog from "../shared/exercise-catalog.json";

export const exerciseCatalog = catalog;
export const muscleGroups = [...new Set(catalog.map(exercise => exercise.muscleGroup))];
export const normalizeExerciseName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().trim().replace(/\s+/g, " ");
const images = new Map(catalog.flatMap(exercise => [exercise.name, ...exercise.aliases]
  .map(name => [normalizeExerciseName(name), exercise.imageUrl] as const)));
export const exerciseImageForName = (name: string) => images.get(normalizeExerciseName(name));
