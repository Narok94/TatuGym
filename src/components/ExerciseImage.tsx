import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { exerciseImageForName } from "../exerciseCatalog";

export function ExerciseImage({ name, imageUrl, className = "" }: {
  name: string;
  imageUrl?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState<string>();
  const src = imageUrl || exerciseImageForName(name);
  return <span className={`exercise-visual ${className}`} aria-hidden="true">
    {src && failed !== src
      ? <img src={src} alt="" decoding="async" loading="lazy" onError={() => setFailed(src)} />
      : <Dumbbell size={23} />}
  </span>;
}
