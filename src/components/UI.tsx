import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Dumbbell,
  Home,
  UserRound,
  Utensils,
  X,
} from "lucide-react";

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Dumbbell size={22} />
      </span>
      <span>
        meu<span className="brand-light">treino</span>
        <i />
      </span>
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  back,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  back?: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="header-title">
        {back && (
          <button
            className="icon-button back-button"
            onClick={back}
            aria-label="Voltar"
          >
            <ArrowLeft size={21} />
          </button>
        )}
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {description && (
            <p className="muted page-description">{description}</p>
          )}
        </div>
      </div>
      {children}
    </header>
  );
}
export function BottomNav({
  page,
  navigate,
}: {
  page: string;
  navigate: (page: string) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {[
        { id: "home", label: "Início", icon: Home },
        { id: "workouts", label: "Treinos", icon: Dumbbell },
        { id: "diet", label: "Dieta", icon: Utensils },
        { id: "profile", label: "Perfil", icon: UserRound },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          className={
            page === id ||
            (id === "workouts" &&
              (page.startsWith("workout/") || page === "session")) ||
            (id === "profile" && page === "progress")
              ? "active"
              : ""
          }
          onClick={() => navigate(id)}
        >
          <Icon size={21} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action && (
        <button className="text-button" onClick={onAction}>
          {action}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" aria-label="Fechar" onClick={onClose}>
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function ProgressRing({
  value,
  total,
  label,
  icon,
}: {
  value: number;
  total: number;
  label: string;
  icon: ReactNode;
}) {
  const percent = total ? Math.min(1, value / total) : 0;
  return (
    <div className="progress-stat">
      <div className="mini-ring">
        <svg viewBox="0 0 90 90" aria-hidden="true">
          <circle cx="45" cy="45" r="37" className="ring-track" />
          <circle
            cx="45"
            cy="45"
            r="37"
            className="ring-value"
            strokeDasharray={`${percent * 232.48} 232.48`}
          />
        </svg>
        <span>{icon}</span>
      </div>
      <div>
        <strong>
          {value}
          <span> / {total}</span>
        </strong>
        <p>{label}</p>
      </div>
      {percent === 1 && <Check size={18} className="success" />}
    </div>
  );
}
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
    </div>
  );
}
export function RowLink({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button className="row-link" onClick={onClick}>
      <span className="tile-icon">{icon}</span>
      <span className="row-label">
        <strong>{title}</strong>
        {description && <small>{description}</small>}
      </span>
      <ChevronRight size={19} />
    </button>
  );
}
