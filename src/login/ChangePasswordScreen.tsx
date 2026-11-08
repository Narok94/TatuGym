import { useId, useState } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import logo from '../assets/logo_forja_transparente.png';
import './login.css';

export default function ChangePasswordScreen({ change, logout }: {
  change: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}) {
  const id = useId();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const fields = [
    { name: 'Senha temporária', value: currentPassword, set: setCurrentPassword, complete: 'current-password', min: 1 },
    { name: 'Nova senha', value: newPassword, set: setNewPassword, complete: 'new-password', min: 15 },
    { name: 'Confirmar nova senha', value: confirmation, set: setConfirmation, complete: 'new-password', min: 15 },
  ];
  return <div className="forja-login forja-change-password"><main className="forja-login-main">
    <img className="forja-login-logo" src={logo} alt="FORJA — Sua evolução é construída." />
    <section className="forja-login-panel" aria-labelledby={`${id}-title`}>
      <h1 id={`${id}-title`}>Defina sua senha</h1>
      <p className="forja-password-intro">Seu professor criou uma senha temporária. Escolha uma nova senha para acessar seus treinos.</p>
      <form className="forja-login-form" onSubmit={async event => {
        event.preventDefault(); if (pending) return; setError('');
        if (newPassword !== confirmation) { setError('As novas senhas não conferem.'); return; }
        if (newPassword === currentPassword) { setError('Escolha uma senha diferente da temporária.'); return; }
        setPending(true);
        try { await change(currentPassword, newPassword); } catch (reason) { setError((reason as Error).message); } finally { setPending(false); }
      }}>
        {fields.map((field, index) => <div key={field.name}>
          <label className="forja-password-label" htmlFor={`${id}-${index}`}>{field.name}</label>
          <div className="forja-input"><LockKeyhole size={23} aria-hidden="true" /><input id={`${id}-${index}`} type={visible ? 'text' : 'password'} required minLength={field.min} maxLength={128} autoComplete={field.complete} disabled={pending} value={field.value} onChange={event => field.set(event.target.value)} /></div>
        </div>)}
        <button type="button" className="forja-show-password" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}{visible ? 'Ocultar senhas' : 'Mostrar senhas'}</button>
        <p className="forja-login-message">Use pelo menos 15 caracteres. Você pode usar uma frase com espaços.</p>
        {error && <p className="forja-login-error" role="alert">{error}</p>}
        <button type="submit" className="forja-enter" disabled={pending}>{pending ? 'Salvando…' : 'Salvar senha e entrar'}</button>
        <button type="button" className="forja-recovery" disabled={pending} onClick={async () => { setPending(true); try { await logout(); } catch (reason) { setError((reason as Error).message); } finally { setPending(false); } }}>Sair da conta</button>
      </form>
    </section>
  </main><footer className="forja-login-footer">FORJA · Sua evolução é construída.</footer></div>;
}
