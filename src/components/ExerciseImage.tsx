import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import supinoInicial from "../assets/Treino_A/supino_reto_inicial.png";
import supinoFinal from "../assets/Treino_A/supino_reto_final.png";
import desenvolvimentoInicial from "../assets/Treino_A/desenvolvimento_inicial.png";
import desenvolvimentoFinal from "../assets/Treino_A/desenvolvimento_final.png";
import elevacaoInicial from "../assets/Treino_A/elevacao_lateral_inicial.png";
import elevacaoFinal from "../assets/Treino_A/elevacao_lateral_final.png";
import tricepsInicial from "../assets/Treino_A/triceps_polia_inicial.png";
import tricepsFinal from "../assets/Treino_A/triceps_polia_final.png";
import puxadaInicial from "../assets/Treino_B/puxada_frontal_inicial.png";
import puxadaFinal from "../assets/Treino_B/puxada_frontal_final.png";
import roscaInicial from "../assets/Treino_B/rosca_direta_inicial.png";
import roscaFinal from "../assets/Treino_B/rosca_direta_final.png";
import legPressInicial from "../assets/Treino_C/leg_press_inicial.png";
import legPressFinal from "../assets/Treino_C/leg_press_final.png";
import extensoraInicial from "../assets/Treino_C/cadeira_extensora_inicial.png";
import extensoraFinal from "../assets/Treino_C/cadeira_extensora_final.png";
import flexoraInicial from "../assets/Treino_C/mesa_flexora_inicial.png";
import flexoraFinal from "../assets/Treino_C/mesa_flexora_final.png";

import supino_inclinadoInicial from "../assets/Treino_A/supino_inclinado_inicial.png";
import supino_inclinadoFinal from "../assets/Treino_A/supino_inclinado_final.png";
import crucifixoInicial from "../assets/Treino_A/crucifixo_inicial.png";
import crucifixoFinal from "../assets/Treino_A/crucifixo_final.png";
import triceps_francesInicial from "../assets/Treino_A/triceps_frances_inicial.png";
import triceps_francesFinal from "../assets/Treino_A/triceps_frances_final.png";
import remada_baixaInicial from "../assets/Treino_B/remada_baixa_inicial.png";
import remada_baixaFinal from "../assets/Treino_B/remada_baixa_final.png";
import remada_unilateralInicial from "../assets/Treino_B/remada_unilateral_inicial.png";
import remada_unilateralFinal from "../assets/Treino_B/remada_unilateral_final.png";
import pulldownInicial from "../assets/Treino_B/pulldown_inicial.png";
import pulldownFinal from "../assets/Treino_B/pulldown_final.png";
import agachamentoInicial from "../assets/Treino_C/agachamento_livre_inicial.png";
import agachamentoFinal from "../assets/Treino_C/agachamento_livre_final.png";
import elevacao_pelvicaInicial from "../assets/Treino_C/elevacao_pelvica_inicial.png";
import elevacao_pelvicaFinal from "../assets/Treino_C/elevacao_pelvica_final.png";
import panturrilha_em_peInicial from "../assets/Treino_C/panturrilha_em_pe_inicial.png";
import panturrilha_em_peFinal from "../assets/Treino_C/panturrilha_em_pe_final.png";
import abdominal_soloInicial from "../assets/Treino_C/abdominal_solo_inicial.png";
import abdominal_soloFinal from "../assets/Treino_C/abdominal_solo_final.png";
import marteloInicial from "../assets/Treino_B/rosca_martelo_inicial.png";
import marteloFinal from "../assets/Treino_B/rosca_martelo_final.png";

const supino = [supinoInicial, supinoFinal] as const;
const desenvolvimento = [desenvolvimentoInicial, desenvolvimentoFinal] as const;
const elevacao = [elevacaoInicial, elevacaoFinal] as const;
const triceps = [tricepsInicial, tricepsFinal] as const;
const puxada = [puxadaInicial, puxadaFinal] as const;
const rosca = [roscaInicial, roscaFinal] as const;
const legPress = [legPressInicial, legPressFinal] as const;
const extensora = [extensoraInicial, extensoraFinal] as const;
const flexora = [flexoraInicial, flexoraFinal] as const;
const supino_inclinado = [supino_inclinadoInicial, supino_inclinadoFinal] as const;
const crucifixo = [crucifixoInicial, crucifixoFinal] as const;
const triceps_frances = [triceps_francesInicial, triceps_francesFinal] as const;
const remada_baixa = [remada_baixaInicial, remada_baixaFinal] as const;
const remada_unilateral = [remada_unilateralInicial, remada_unilateralFinal] as const;
const pulldown = [pulldownInicial, pulldownFinal] as const;
const agachamento = [agachamentoInicial, agachamentoFinal] as const;
const elevacao_pelvica = [elevacao_pelvicaInicial, elevacao_pelvicaFinal] as const;
const panturrilha_em_pe = [panturrilha_em_peInicial, panturrilha_em_peFinal] as const;
const abdominal_solo = [abdominal_soloInicial, abdominal_soloFinal] as const;
const martelo = [marteloInicial, marteloFinal] as const;

// Match the current name, so a renamed exercise never keeps an unrelated image.
const images: Record<string, readonly [string, string]> = {
  "supino inclinado": supino_inclinado,
  "crucifixo": crucifixo,
  "triceps frances": triceps_frances,
  "remada baixa": remada_baixa,
  "remada unilateral": remada_unilateral,
  "pulldown": pulldown,
  "agachamento livre": agachamento,
  "elevacao pelvica": elevacao_pelvica,
  "panturrilha em pe": panturrilha_em_pe,
  "abdominal no solo": abdominal_solo,
  "rosca martelo": martelo,
  "supino reto": supino,
  "supino reto com barra": supino,
  "desenvolvimento": desenvolvimento,
  "desenvolvimento com halteres": desenvolvimento,
  "elevacao lateral": elevacao,
  "triceps na polia": triceps,
  "triceps polia": triceps,
  "puxada frontal": puxada,
  "puxada alta": puxada,
  "rosca direta": rosca,
  "leg press": legPress,
  "cadeira extensora": extensora,
  "mesa flexora": flexora,
};

export function ExerciseImage({ name, className = "", animate = false }: {
  name: string;
  className?: string;
  animate?: boolean;
}) {
  const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/\s+/g, " ");
  const frames = images[key];
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    setFrame(0);
    if (!animate || !frames) return;
    frames.forEach(src => { const image = new Image(); image.src = src; });
    const timer = window.setInterval(() => setFrame(value => 1 - value), 2000);
    return () => window.clearInterval(timer);
  }, [key, animate, frames]);
  const visual = frames ? <img src={frames[animate ? frame : 0]} alt="" decoding="async" /> : <Dumbbell size={23} />;
  if (animate && frames) return <span className={`exercise-visual ${className}`}>
    <button type="button" className="exercise-frame-toggle"
      aria-label={`Alternar posição do exercício ${name}`} onClick={() => setFrame(value => 1 - value)}
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault(); setFrame(value => 1 - value);
        }
      }}>{visual}</button>
    <span className="exercise-frame-controls" role="group" aria-label="Posições do movimento">
      <button type="button" aria-label="Posição anterior do movimento" onClick={() => setFrame(value => 1 - value)}><ChevronLeft size={18} /></button>
      <button type="button" aria-label="Próxima posição do movimento" onClick={() => setFrame(value => 1 - value)}><ChevronRight size={18} /></button>
    </span>
  </span>;
  return <span className={`exercise-visual ${className}`} aria-hidden="true">{visual}</span>;
}
