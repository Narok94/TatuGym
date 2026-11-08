import type { MuscleGroup } from "../types";
import push from "../assets/anatomia/peito_ombros_triceps.webp";
import pull from "../assets/anatomia/costas_biceps.webp";
import legs from "../assets/anatomia/pernas.webp";

const anatomy = {
  push: { src: push, label: "Peito, ombros e tríceps" },
  pull: { src: pull, label: "Costas e bíceps, vistas posterior e anterior" },
  legs: { src: legs, label: "Pernas, glúteos e abdômen, vistas anterior e posterior" },
};

export function Anatomy({ group, className = "" }: {
  group: MuscleGroup;
  className?: string;
}) {
  const image = anatomy[group];
  return <img className={`anatomy ${className}`} src={image.src}
    alt={image.label} decoding="async" />;
}
