import type { MuscleGroup } from "../types";
import push from "../assets/anatomia/peito_ombros_triceps.png";
import pull from "../assets/anatomia/costas_biceps.png";
import legs from "../assets/anatomia/pernas.png";

const anatomy = {
  push: { src: push, label: "Peito, ombros e tríceps" },
  pull: { src: pull, label: "Costas e bíceps" },
  legs: { src: legs, label: "Musculatura das pernas" },
};

export function Anatomy({ group, className = "" }: {
  group: MuscleGroup;
  className?: string;
}) {
  const image = anatomy[group];
  return <img className={`anatomy ${className}`} src={image.src}
    alt={image.label} decoding="async" />;
}
