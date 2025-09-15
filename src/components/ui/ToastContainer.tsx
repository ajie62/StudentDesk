import React from "react";
import { ToastContainerProps } from "../../types";

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.text}
        </div>
      ))}
    </div>
  );
}
