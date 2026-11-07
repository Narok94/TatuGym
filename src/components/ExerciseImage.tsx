import { Dumbbell } from "lucide-react";
import supino from "../assets/exercicios/execucao/supino_referencia.webp";
import desenvolvimento from "../assets/exercicios/execucao/desenvolvimento_exec.webp";
import elevacao from "../assets/exercicios/execucao/elevacao_lateral_exec.webp";
import triceps from "../assets/exercicios/execucao/triceps_polia_exec.webp";
import puxada from "../assets/exercicios/execucao/puxada_alta_exec.webp";
import rosca from "../assets/exercicios/execucao/rosca_direta_exec.webp";
import legPress from "../assets/exercicios/execucao/leg_press_exec.webp";
import extensora from "../assets/exercicios/execucao/cadeira_extensora_exec.webp";
import flexora from "../assets/exercicios/execucao/mesa_flexora_exec.webp";

import supino_inclinado from "../assets/exercicios/execucao/supino_inclinado.webp";
import crucifixo from "../assets/exercicios/execucao/crucifixo.webp";
import triceps_frances from "../assets/exercicios/execucao/triceps_frances.webp";
import remada_baixa from "../assets/exercicios/execucao/remada_baixa.webp";
import remada_unilateral from "../assets/exercicios/execucao/remada_unilateral.webp";
import pulldown from "../assets/exercicios/execucao/pulldown.webp";
import agachamento from "../assets/exercicios/execucao/agachamento.webp";
import elevacao_pelvica from "../assets/exercicios/execucao/elevacao_pelvica.webp";
import panturrilha_em_pe from "../assets/exercicios/execucao/panturrilha_em_pe.webp";
import abdominal_solo from "../assets/exercicios/execucao/abdominal_solo.webp";
import martelo from "../assets/exercicios/execucao/rosca_martelo_exec.webp";

// Match the current name, so a renamed exercise never keeps an unrelated image.
const images: Record<string, string> = {
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

export function ExerciseImage({ name, className = "" }: {
  name: string;
  className?: string;
}) {
  const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/\s+/g, " ");
  const src = images[key];
  return <span className={`exercise-visual ${className}`} aria-hidden="true">
    {src ? <img src={src} alt="" decoding="async" /> : <Dumbbell size={23} />}
  </span>;
}
