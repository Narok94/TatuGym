import { useEffect, useRef, useState } from "react";
import { createInitialData } from "./data";
import type { AppData } from "./types";

// Namespace por usuário e versão; a identidade local poderá vir de uma conta no futuro.
export const STORAGE_KEY = "meu-treino:v1:henrique-local";
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
function readSavedData(): {
  data: AppData;
  error: string;
  recovery: string | null;
} {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: createInitialData(), error: "", recovery: null };
    const saved = JSON.parse(raw);
    if (
      saved.version !== 1 ||
      !saved.user?.id ||
      !saved.mealLogs ||
      !Array.isArray(saved.workouts) ||
      !saved.workouts.length ||
      !saved.workouts.every(
        (w: AppData["workouts"][number]) =>
          w.id && Array.isArray(w.exercises) && w.exercises.length,
      ) ||
      !Array.isArray(saved.history) ||
      !Array.isArray(saved.meals) ||
      !saved.meals.length ||
      !Array.isArray(saved.weights)
    )
      throw new Error("Formato inválido");
    return { data: saved, error: "", recovery: null };
  } catch {
    return {
      data: createInitialData(),
      error:
        "Não foi possível ler os dados locais. O conteúdo original será preservado em uma chave de recuperação antes de salvar alterações.",
      recovery: raw,
    };
  }
}
export function useAppData() {
  const [initial] = useState(readSavedData);
  const [storageError, setStorageError] = useState(initial.error);
  const [data, setData] = useState<AppData>(initial.data);
  const recovery = useRef(initial.recovery);
  useEffect(() => {
    // Não substituir conteúdo ilegível durante a inicialização.
    if (initial.error && data === initial.data) return;
    try {
      if (recovery.current !== null) {
        localStorage.setItem(`${STORAGE_KEY}:recovery`, recovery.current);
        recovery.current = null;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStorageError("");
    } catch {
      setStorageError(
        "Não foi possível salvar. Verifique o espaço ou as permissões do navegador. Mantenha esta página aberta e exporte seus dados no Perfil.",
      );
    }
  }, [data, initial]);
  return { data, setData, storageError };
}
