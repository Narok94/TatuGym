import { useState } from "react";
import type { ReactNode } from "react";
import { Modal } from "../components/UI";
import { localDate } from "../store";
import { uid } from "../store";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Assessment, AssessmentInput, LibraryExercise, LibraryInput, PlanExercise, PlanInput, Student, StudentInput, TrainingPlan } from "./models";
import { ExercisePicker } from "./ExercisePicker";
import { ExerciseImage } from "../components/ExerciseImage";

export const value = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
export const optionalNumber = (form: FormData, name: string) => value(form, name) === "" ? null : Number(value(form, name));
export function Editor({ title, children, close, save }: { title: string; children: ReactNode; close: () => void | Promise<void>; save: (form: FormData) => void | Promise<void> }) {
  const [error, setError] = useState("");
  const [pending,setPending] = useState(false);
  return <Modal title={title} onClose={close}><form className="teacher-form form-stack" onSubmit={async event => { event.preventDefault();
    if(pending) return;setPending(true);
    try { await save(new FormData(event.currentTarget)); } catch (reason) { setError((reason as Error).message); } finally {setPending(false);}
  }}>{children}{error && <p className="teacher-error" role="alert">{error}</p>}<div className="teacher-form-actions"><button type="button" className="button secondary" onClick={close}>Cancelar</button><button className="button primary" type="submit" disabled={pending}>{pending?'Salvando…':'Salvar'}</button></div></form></Modal>;
}
export function StudentEditor({ student, close, save }: { student?: Student; close: () => void | Promise<void>; save: (input: StudentInput, id?: string) => void | Promise<void> }) {
  const [createAccess, setCreateAccess] = useState(!student?.access);
  const [resetPassword, setResetPassword] = useState(false);
  const [login, setLogin] = useState(student?.access?.login ?? '');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copyNotice, setCopyNotice] = useState('');
  const hasAccess = !!student?.access || createAccess;
  const needsPassword = hasAccess && (!student?.access || resetPassword);
  return <Editor title={student ? "Editar aluno" : "Cadastrar aluno"} close={close} save={form => save({
    name: value(form, "name"), email: value(form, "email"), phone: value(form, "phone"), birthDate: value(form, "birthDate"), goal: value(form, "goal"),
    status: value(form, "status") as StudentInput["status"], notes: value(form, "notes"),
    ...(hasAccess ? { access: { login, ...(needsPassword ? { temporaryPassword } : {}) } } : {}),
  }, student?.id)}>
    <p className="teacher-form-note">Cadastre o perfil e o acesso do aluno. O treino ficará vinculado à mesma conta.</p>
    <label>Nome completo<input name="name" required maxLength={100} defaultValue={student?.name} /></label>
    <label>E-mail do aluno<input name="email" type="email" required maxLength={200} defaultValue={student?.email} /></label>
    <div className="form-grid"><label>Telefone<input name="phone" type="tel" maxLength={30} defaultValue={student?.phone} /></label>
      <label>Data de nascimento<input name="birthDate" type="date" max={localDate()} defaultValue={student?.birthDate} /></label></div>
    <label>Objetivo<input name="goal" maxLength={200} defaultValue={student?.goal} /></label>
    <label>Situação<select name="status" defaultValue={student?.status ?? "ATIVO"}><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select></label>
    <label>Observações<textarea name="notes" rows={3} maxLength={3000} defaultValue={student?.notes} /></label>
    <fieldset className="teacher-student-access"><legend>Acesso ao aplicativo</legend>
      {!student?.access && <label className="teacher-check"><input type="checkbox" checked={createAccess} onChange={event => setCreateAccess(event.target.checked)} />Criar acesso para este aluno</label>}
      {hasAccess && <>
        <label>Login do aluno<input required minLength={3} maxLength={200} pattern="[a-zA-Z0-9][a-zA-Z0-9._@+\-]*" autoComplete="off" autoCapitalize="none" spellCheck={false} value={login} onChange={event => { setLogin(event.target.value); setCopyNotice(''); }} placeholder="Ex.: joao.silva" /></label>
        {student?.access && <>
          <p className="teacher-form-note">{student.access.mustChangePassword ? 'O aluno precisa trocar a senha temporária no próximo acesso.' : 'O aluno já definiu a própria senha.'}</p>
          <label className="teacher-check"><input type="checkbox" checked={resetPassword} onChange={event => setResetPassword(event.target.checked)} />Definir nova senha temporária</label>
        </>}
        {needsPassword && <>
          <label>Senha temporária<input required type={showPassword ? 'text' : 'password'} minLength={6} maxLength={128} autoComplete="new-password" value={temporaryPassword} onChange={event => { setTemporaryPassword(event.target.value); setCopyNotice(''); }} /></label>
          <div className="teacher-row-actions">
            <button type="button" className="button secondary" onClick={() => { setTemporaryPassword(Array.from(crypto.getRandomValues(new Uint8Array(12)), byte => byte.toString(16).padStart(2, '0')).join('')); setShowPassword(true); setCopyNotice(''); }}>Gerar senha temporária</button>
            <button type="button" className="button secondary" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Ocultar senha temporária' : 'Mostrar senha temporária'}</button>
            <button type="button" className="button secondary" disabled={!login || temporaryPassword.length < 6} onClick={async () => { try { await navigator.clipboard.writeText(`Login: ${login.trim().toLowerCase()}\nSenha temporária: ${temporaryPassword}`); setCopyNotice('Acesso copiado. Entregue ao aluno após salvar.'); } catch { setCopyNotice('Não foi possível copiar. Anote o login e a senha antes de salvar.'); } }}>Copiar acesso</button>
          </div>
          {copyNotice && <p className="teacher-form-note" role="status">{copyNotice}</p>}
          <p className="teacher-form-note">Use pelo menos 6 caracteres. Copie ou anote a senha antes de salvar; ela não poderá ser consultada depois. O aluno precisará escolher outra senha no primeiro acesso.{student?.access ? ' Ao salvar, as sessões anteriores serão encerradas.' : ''}</p>
        </>}
      </>}
    </fieldset>
  </Editor>;
}
const blankExercise = (): PlanExercise => ({ id: uid(), name: "", muscleGroup: "", sets: 3, reps: "8–12", load: 0, rest: 60, instructions: "" });
export function AssessmentEditor({ assessment, students, close, save }: { assessment?: Assessment; students: Student[]; close: () => void | Promise<void>; save: (input: AssessmentInput, id?: string) => void | Promise<void> }) {
  return <Editor title={assessment ? "Editar avaliação" : "Registrar avaliação"} close={close} save={form => save({ studentId: value(form, "studentId"), date: value(form, "date"), weight: Number(value(form, "weight")), height: Number(value(form, "height")), waist: optionalNumber(form, "waist"), hip: optionalNumber(form, "hip"), bodyFat: optionalNumber(form, "bodyFat"), notes: value(form, "notes") }, assessment?.id)}>
    <label>Aluno da avaliação<select required name="studentId" defaultValue={assessment?.studentId ?? students[0]?.id}><option value="">Selecione um aluno</option>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
    <label>Data da avaliação<input name="date" type="date" required max={localDate()} defaultValue={assessment?.date ?? localDate()} /></label>
    <div className="form-grid"><label>Peso (kg)<input name="weight" type="number" step="any" min="10" max="500" required defaultValue={assessment?.weight} /></label><label>Altura (cm)<input name="height" type="number" step="any" min="50" max="250" required defaultValue={assessment?.height} /></label></div>
    <div className="form-grid"><label>Cintura (cm)<input name="waist" type="number" step="any" min="0" max="300" defaultValue={assessment?.waist ?? ""} /></label><label>Quadril (cm)<input name="hip" type="number" step="any" min="0" max="300" defaultValue={assessment?.hip ?? ""} /></label></div>
    <label>Gordura corporal (%)<input name="bodyFat" type="number" step="any" min="0" max="100" defaultValue={assessment?.bodyFat ?? ""} /></label>
    <label>Observações da avaliação<textarea name="notes" rows={3} maxLength={3000} defaultValue={assessment?.notes} /></label>
    <p className="teacher-form-note">Medidas opcionais podem ficar em branco. Os gráficos usam apenas valores informados.</p>
  </Editor>;
}
export function PlanEditor({ plan, students, library, close, save }: { plan?: TrainingPlan; students: Student[]; library: LibraryExercise[]; close: () => void | Promise<void>; save: (input: PlanInput, id?: string) => void | Promise<void> }) {
  const [exercises, setExercises] = useState<PlanExercise[]>(() => plan ? structuredClone(plan.exercises) : [blankExercise()]);
  const patch = (id: string, change: Partial<PlanExercise>) => setExercises(items => items.map(item => item.id === id ? { ...item, ...change } : item));
  const move = (index: number, offset: number) => setExercises(items => { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next; });
  return <Editor title={plan ? "Editar treino" : "Criar treino"} close={close} save={form => save({ name: value(form, "name"), studentId: value(form, "studentId"), description: value(form, "description"), status: value(form, "status") as PlanInput["status"], duration: Number(value(form, "duration")), exercises }, plan?.id)}>
    <label>Nome do treino<input name="name" required maxLength={100} defaultValue={plan?.name} /></label>
    <div className="form-grid"><label>Aluno responsável<select name="studentId" defaultValue={plan?.studentId ?? ""}><option value="">Modelo sem aluno</option>{students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label>
      <label>Situação do treino<select name="status" defaultValue={plan?.status ?? "RASCUNHO"}><option value="RASCUNHO">Rascunho</option><option value="ATIVO">Ativo</option></select></label></div>
    <label>Duração estimada (min)<input name="duration" type="number" min="1" max="600" required defaultValue={plan?.duration ?? 45} /></label>
    <label>Orientações do treino<textarea name="description" rows={2} maxLength={3000} defaultValue={plan?.description} /></label>
    <div className="teacher-section-heading"><h3>Exercícios e ordem</h3><button type="button" className="button secondary" onClick={() => setExercises(items => [...items, blankExercise()])}><Plus size={15} />Adicionar exercício</button></div>
    {!exercises.length && <p className="teacher-form-note">Adicione pelo menos um exercício para salvar.</p>}
    {exercises.map((exercise, index) => <fieldset className="teacher-exercise-editor" key={exercise.id}><legend>Exercício {index + 1}</legend>
      <div className="teacher-exercise-tools"><button type="button" className="icon-button" aria-label={`Subir exercício ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={17} /></button><button type="button" className="icon-button" aria-label={`Descer exercício ${index + 1}`} disabled={index === exercises.length - 1} onClick={() => move(index, 1)}><ArrowDown size={17} /></button><button type="button" className="icon-button" aria-label={`Remover exercício ${index + 1}`} onClick={() => setExercises(items => items.filter(item => item.id !== exercise.id))}><Trash2 size={16} /></button></div>
      <ExercisePicker library={library} exercise={exercise} index={index} select={source => patch(exercise.id, source
        ? { libraryId: source.id, name: source.name, muscleGroup: source.muscleGroup, instructions: source.instructions, imageUrl: source.imageUrl, unit: source.unit ?? 'reps', reps: source.defaultReps ?? '8–12' }
        : { libraryId: undefined, imageUrl: undefined })} />
      <div className="form-grid"><label>Nome exercício {index + 1}<input required maxLength={100} value={exercise.name} onChange={event => patch(exercise.id, { name: event.target.value, libraryId: undefined, imageUrl: undefined })} /></label><label>Grupo muscular exercício {index + 1}<input maxLength={100} value={exercise.muscleGroup} onChange={event => patch(exercise.id, { muscleGroup: event.target.value })} /></label></div>
      <label>Medida exercício {index + 1}<select value={exercise.unit ?? 'reps'} onChange={event => patch(exercise.id, { unit: event.target.value as PlanExercise['unit'] })}><option value="reps">Repetições</option><option value="seconds">Segundos</option></select></label>
      <div className="teacher-exercise-fields"><label>Séries exercício {index + 1}<input type="number" min="1" max="30" required value={Number.isNaN(exercise.sets) ? "" : exercise.sets} onFocus={event => event.currentTarget.select()} onChange={event => patch(exercise.id, { sets: event.currentTarget.valueAsNumber })} /></label>
        <label>{exercise.unit === 'seconds' ? 'Segundos' : 'Repetições'} exercício {index + 1}<input required maxLength={30} value={exercise.reps} onChange={event => patch(exercise.id, { reps: event.target.value })} /></label>
        <label>Carga exercício {index + 1} (kg)<input type="number" min="0" max="2000" step="any" required value={Number.isNaN(exercise.load) ? "" : exercise.load} onFocus={event => event.currentTarget.select()} onChange={event => patch(exercise.id, { load: event.currentTarget.valueAsNumber })} /></label>
        <label>Descanso exercício {index + 1} (s)<input type="number" min="0" max="1800" required value={Number.isNaN(exercise.rest) ? "" : exercise.rest} onFocus={event => event.currentTarget.select()} onChange={event => patch(exercise.id, { rest: event.currentTarget.valueAsNumber })} /></label></div>
      <label>Instruções exercício {index + 1}<textarea rows={2} maxLength={3000} value={exercise.instructions} onChange={event => patch(exercise.id, { instructions: event.target.value })} /></label>
    </fieldset>)}
  </Editor>;
}
export function LibraryEditor({ exercise, close, save }: { exercise?: LibraryExercise; close: () => void | Promise<void>; save: (input: LibraryInput, id?: string) => void | Promise<void> }) {
  const [name, setName] = useState(exercise?.name ?? '');
  const [imageUrl, setImageUrl] = useState(exercise?.imageUrl ?? '');
  return <Editor title={exercise ? "Editar exercício da biblioteca" : "Cadastrar exercício"} close={close} save={form => save({ name: value(form, "name"), muscleGroup: value(form, "muscleGroup"), equipment: value(form, "equipment"), instructions: value(form, "instructions"), imageUrl: value(form, "imageUrl"), unit: value(form, 'unit') as LibraryInput['unit'], defaultReps: value(form, 'defaultReps') }, exercise?.id)}>
    <label>Nome do exercício<input name="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>
    <label>Grupo muscular<input name="muscleGroup" required maxLength={100} defaultValue={exercise?.muscleGroup} /></label>
    <label>Equipamento<input name="equipment" maxLength={200} defaultValue={exercise?.equipment} /></label>
    <label>Instruções do movimento<textarea name="instructions" rows={4} maxLength={5000} defaultValue={exercise?.instructions} /></label>
    <div className="form-grid"><label>Medida padrão<select name="unit" defaultValue={exercise?.unit ?? 'reps'}><option value="reps">Repetições</option><option value="seconds">Segundos</option></select></label><label>Alvo padrão<input name="defaultReps" maxLength={30} defaultValue={exercise?.defaultReps ?? '8–12'} /></label></div>
    <label>Imagem do exercício (opcional)<input name="imageUrl" maxLength={2000} placeholder="https:// ou /exercises/arquivo.webp" value={imageUrl} onChange={event => setImageUrl(event.target.value)} /></label>
    <ExerciseImage name={name} imageUrl={imageUrl} className="teacher-exercise-preview" />
    <p className="teacher-form-note">A imagem acompanha o exercício no treino do aluno. Ajustes na biblioteca são exclusivos da sua conta.</p>
  </Editor>;
}
