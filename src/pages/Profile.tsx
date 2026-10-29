import { useState } from "react";
import {
  Bell,
  Check,
  Download,
  HardDrive,
  Monitor,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { AppData, Theme } from "../types";
import { Modal, PageHeader, RowLink, SectionTitle } from "../components/UI";

export default function Profile({
  data,
  setTheme,
  navigate,
  reset,
  install,
}: {
  data: AppData;
  setTheme: (theme: Theme) => void;
  navigate: (page: string) => void;
  reset: () => void;
  install?: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);
  function exportData() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `meu-treino-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <PageHeader
        eyebrow="SEU ESPAÇO"
        title="Meu perfil"
        description="Uma rotina com a sua identidade."
      />
      <div className="profile-grid">
        <div>
          <section className="panel profile-card">
            <div className="avatar">
              H<span />
            </div>
            <h2>{data.user.name}</h2>
            <span className="profile-tag">Um pouco melhor a cada dia.</span>
            <div className="profile-totals">
              <div>
                <strong>{data.history.length}</strong>
                <span>treinos registrados</span>
              </div>
              <div>
                <strong>{data.weights.length}</strong>
                <span>registros de peso</span>
              </div>
            </div>
            <button
              className="button secondary full-width"
              onClick={() => navigate("progress")}
            >
              <TrendingUp size={17} />
              Acompanhar meu progresso
            </button>
          </section>
          <div className="privacy-note">
            <ShieldCheck size={20} />
            <p>
              Seu espaço é pessoal.
              <br />
              <span>Os dados ficam apenas neste navegador.</span>
            </p>
          </div>
        </div>
        <div>
          <SectionTitle title="Aparência" />
          <section className="panel theme-panel">
            <p className="muted">Escolha o tema que combina com seu momento.</p>
            <div className="theme-options">
              {(
                [
                  { id: "light", name: "Claro", icon: Sun },
                  { id: "dark", name: "Escuro", icon: Moon },
                  { id: "system", name: "Automático", icon: Monitor },
                ] as const
              ).map(({ id, name, icon: Icon }) => (
                <button
                  className={data.theme === id ? "selected" : ""}
                  key={id}
                  aria-pressed={data.theme === id}
                  onClick={() => setTheme(id)}
                >
                  <Icon size={22} />
                  <span>{name}</span>
                  {data.theme === id && (
                    <Check size={12} className="theme-check" />
                  )}
                </button>
              ))}
            </div>
          </section>
          <SectionTitle title="Preferências" />
          <div className="panel settings-list">
            <RowLink
              icon={<Smartphone size={21} />}
              title="Instalar aplicativo"
              description="Seu treino na tela inicial"
              onClick={install || (() => setInstallHelp(true))}
            />
            <div className="setting-static">
              <span className="tile-icon">
                <Bell size={21} />
              </span>
              <span>
                <strong>Notificações</strong>
                <small>Um incentivo na hora certa</small>
              </span>
              <span className="soon-tag">Em breve</span>
            </div>
          </div>
          <SectionTitle title="Dados locais" />
          <div className="panel settings-list">
            <RowLink
              icon={<Download size={21} />}
              title="Exportar meus dados"
              description="Baixe uma cópia em JSON"
              onClick={exportData}
            />
            <RowLink
              icon={<Trash2 size={21} />}
              title="Redefinir dados"
              description="Restaurar o plano demonstrativo"
              onClick={() => setConfirmReset(true)}
            />
          </div>
          <p className="helper storage-note">
            <HardDrive size={15} />
            Sem sincronização nesta versão. Limpar os dados do navegador remove
            seus registros. Exporte uma cópia para guardá-los.
          </p>
        </div>
      </div>
      <p className="app-version">
        MEU TREINO <span>·</span> VERSÃO 1.0 <span>·</span> FEITO PARA EVOLUIR
      </p>
      {confirmReset && (
        <Modal
          title="Redefinir os dados locais?"
          onClose={() => setConfirmReset(false)}
        >
          <p className="muted">
            Isso apaga o histórico de treinos, pesos, refeições realizadas e o
            treino em andamento, e restaura os dados demonstrativos. Esta ação
            não pode ser desfeita.
          </p>
          <div className="modal-actions">
            <button className="button secondary" onClick={exportData}>
              <Download size={17} />
              Exportar antes
            </button>
            <button
              className="button danger"
              onClick={() => {
                reset();
                setConfirmReset(false);
              }}
            >
              Apagar e redefinir
            </button>
            <button
              className="text-button"
              onClick={() => setConfirmReset(false)}
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
      {installHelp && (
        <Modal
          title="Seu treino na tela inicial"
          onClose={() => setInstallHelp(false)}
        >
          <div className="install-instructions">
            <Smartphone size={38} />
            <p>
              No <strong>iPhone, abra no Safari</strong>, toque em Compartilhar
              e escolha <strong>Adicionar à Tela de Início</strong>.
            </p>
            <p className="muted">
              No Android ou desktop, procure a opção “Instalar aplicativo” no
              menu do navegador. Se já estiver instalado, abra pelo ícone na
              tela inicial.
            </p>
            <p className="helper">
              Após o primeiro acesso completo, as funções locais também
              funcionam offline.
            </p>
          </div>
          <button
            className="button primary full-width"
            onClick={() => setInstallHelp(false)}
          >
            Entendi
          </button>
        </Modal>
      )}
    </>
  );
}
