import { Toast } from "../types";
import i18n from "i18next";

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
    "students:create": i18n.t("toast.students.create"),
    "students:update": i18n.t("toast.students.update"),
    "students:delete": i18n.t("toast.students.delete"),
    "lessons:add": i18n.t("toast.lessons.add"),
    "lessons:update": i18n.t("toast.lessons.update"),
    "lessons:delete": i18n.t("toast.lessons.delete"),
    settings: i18n.t("toast.settings.saved"),
  };

  let label = labels[action];
  if (!label) {
    if (action.startsWith("students")) label = i18n.t("toast.students.default");
    else if (action.startsWith("lessons")) label = i18n.t("toast.lessons.default");
    else label = i18n.t("toast.default");
  }

  pushToast(setToasts, `${label} • ${where}`);
}
