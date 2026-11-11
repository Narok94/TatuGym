import catalog from '../shared/exercise-catalog.json' with { type: 'json' };

export function teacherLibrary(teacherId, stored) {
  const changed = new Set(stored.map(row => row.data.id));
  return [
    ...catalog.filter(item => !changed.has(item.id)).map(({ aliases, ...item }) => ({ ...item, teacherId })),
    ...stored.filter(row => !row.archived).map(row => row.data),
  ];
}
export function workoutMuscle(groups) {
  const names = groups.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/quadriceps|posteriores de coxa|gluteos|panturrilhas|adutores|pernas|abdomen|core/.test(names)) return 'legs';
  if (/costas|biceps/.test(names)) return 'pull';
  return 'push';
}
