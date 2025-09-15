import { useEffect, useState } from "react";
import { pushToast } from "../helpers/toastHelpers";
import { Toast } from "../types";

export function useUpdates(setToasts: React.Dispatch<React.SetStateAction<Toast[]>>) {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    window.studentApi.onUpdate?.("update:checking", () => {
      pushToast(setToasts, "🔄 Vérification des mises à jour...");
      setUpdateReady(false);
    });
    window.studentApi.onUpdate?.("update:available", () => {
      pushToast(setToasts, "⬇️ Mise à jour disponible, téléchargement...");
      setUpdateReady(false);
    });
    window.studentApi.onUpdate?.("update:none", () => {
      pushToast(setToasts, "✅ Aucune mise à jour disponible");
      setUpdateReady(false);
    });
    window.studentApi.onUpdate?.("update:downloaded", () => {
      pushToast(setToasts, "📦 Mise à jour prête à installer");
      setUpdateReady(true);
    });
    window.studentApi.onUpdate?.("update:error", (_evt, err) => {
      pushToast(setToasts, "❌ Erreur de mise à jour: " + err);
      setUpdateReady(false);
    });
  }, [setToasts]);

  return updateReady;
}
