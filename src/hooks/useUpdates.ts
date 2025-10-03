import { useEffect, useState } from "react";
import { pushToast } from "../helpers/toastHelpers";
import { Toast } from "../types";
import i18n from "i18next";

export function useUpdates(setToasts: React.Dispatch<React.SetStateAction<Toast[]>>) {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    window.studentApi.onUpdate?.("update:checking", () => {
      pushToast(setToasts, i18n.t("updates.checking"));
      setUpdateReady(false);
    });
    window.studentApi.onUpdate?.("update:available", () => {
      pushToast(setToasts, i18n.t("updates.available"));
      setUpdateReady(false);
    });
    window.studentApi.onUpdate?.("update:none", () => {
      pushToast(setToasts, i18n.t("updates.none"));
      setUpdateReady(false);
    });
    window.studentApi.onUpdate?.("update:downloaded", () => {
      pushToast(setToasts, i18n.t("updates.downloaded"));
      setUpdateReady(true);
    });
    window.studentApi.onUpdate?.("update:error", (_evt, err) => {
      pushToast(setToasts, i18n.t("updates.error", { err }));
      setUpdateReady(false);
    });
  }, [setToasts]);

  return updateReady;
}
