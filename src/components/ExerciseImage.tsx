import { Dumbbell } from "lucide-react";
import supino from "../assets/exercicios/supino_barra.png";
import desenvolvimento from "../assets/exercicios/desenvolvimento.png";
import elevacao from "../assets/exercicios/elevacao_lateral.png";
import triceps from "../assets/exercicios/triceps_polia.png";
import puxada from "../assets/exercicios/puxada_alta.png";
import rosca from "../assets/exercicios/rosca_direta.png";
import legPress from "../assets/exercicios/leg_press.png";
import extensora from "../assets/exercicios/cadeira_extensora.png";
import flexora from "../assets/exercicios/mesa_flexora.png";

// Match the current name, so a renamed exercise never keeps an unrelated image.
const images: Record<string, string> = {
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
