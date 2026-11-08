import { useState } from "react";
import { ExerciseImage } from "../components/ExerciseImage";
import { normalizeExerciseName } from "../exerciseCatalog";
import type { LibraryExercise, PlanExercise } from "./models";

export function ExercisePicker({ library, exercise, index, select }: {
  library: LibraryExercise[];
  exercise: PlanExercise;
  index: number;
  select: (source?: LibraryExercise) => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const groups = [...new Set(library.map(item => item.muscleGroup))];
  const filtered = library.filter(item => (!group || item.muscleGroup === group) &&
    normalizeExerciseName(`${item.name} ${item.equipment}`).includes(normalizeExerciseName(query)));
  const selected = library.find(item => item.id === exercise.libraryId);
  return <div className="teacher-library-picker">
    <div className="form-grid">
      <label>Buscar na biblioteca, exercício {index + 1}<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nome ou equipamento" /></label>
      <label>Filtrar grupo, exercício {index + 1}<select value={group} onChange={event => setGroup(event.target.value)}>
        <option value="">Todos os grupos</option>{groups.map(name => <option key={name}>{name}</option>)}
      </select></label>
    </div>
    <label>Biblioteca para exercício {index + 1}<select value={exercise.libraryId ?? ""} onChange={event => select(library.find(item => item.id === event.target.value))}>
      <option value="">Cadastro manual</option>
      {selected && !filtered.includes(selected) && <optgroup label="Selecionado"><option value={selected.id}>{selected.name}</option></optgroup>}
      {groups.map(name => {
        const entries = filtered.filter(item => item.muscleGroup === name);
        return entries.length ? <optgroup key={name} label={name}>{entries.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup> : null;
      })}
    </select></label>
    <small className="teacher-form-note">{filtered.length} exercícios encontrados</small>
    {exercise.name && <div className="teacher-selected-exercise">
      <ExerciseImage name={exercise.name} imageUrl={exercise.imageUrl} className="teacher-exercise-preview" />
      <div><strong>{exercise.name}</strong><span>{exercise.muscleGroup}</span>{selected && <small>{selected.equipment}</small>}</div>
    </div>}
  </div>;
}
