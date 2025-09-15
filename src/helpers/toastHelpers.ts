import { Toast } from "../types";

export function pushToast(
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>,
  text: string,
  duration: number = 3000
) {
  const id = Math.random().toString(36).slice(2);

  setToasts((prev) => [...prev, { id, text }]);

  window.setTimeout(() => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, duration);
}

/**
 * Crée un toast basé sur une action de sauvegarde (students, lessons, settings…)
 */
export function toastSave(
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>,
  action: string,
  where: string
) {
  const labels: Record<string, string> = {
    "students:create": "Étudiant enregistré",
    "students:update": "Étudiant enregistré",
    "students:delete": "Étudiant supprimé",
    "lessons:add": "Leçon enregistrée",
    "lessons:update": "Leçon modifiée",
    "lessons:delete": "Leçon supprimée",
    settings: "Réglages sauvegardés",
  };

  let label = labels[action];
  if (!label) {
    if (action.startsWith("students")) label = "Étudiant enregistré";
    else if (action.startsWith("lessons")) label = "Leçon enregistrée";
    else label = "Sauvegarde effectuée";
  }

  pushToast(setToasts, `${label} • ${where}`);
}
