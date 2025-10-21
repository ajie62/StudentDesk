import React, { useEffect, useMemo, useState, useRef } from "react";
import { BillingContract, LessonFormProps } from "../../types";
import { useTranslation } from "react-i18next";

export default function LessonForm({
  onClose,
  onSaved,
  initial,
  availableContracts = [],
}: LessonFormProps) {
  const { t } = useTranslation();

  const [comment, setComment] = useState(initial?.comment || "");
  const [homework, setHomework] = useState(initial?.homework || "");
  const [date, setDate] = useState(
    initial?.createdAt
      ? new Date(initial.createdAt).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10)
  );
  const [billingId, setBillingId] = useState<string | null>(initial?.billingId ?? null);
  const [associateContract, setAssociateContract] = useState(false);
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [unitPriceError, setUnitPriceError] = useState<string | null>(null);

  // Determine if initial.createdAt has a time component other than midnight
  const initialDate = initial?.createdAt ? new Date(initial.createdAt) : null;
  const hasTimeComponent =
    initialDate !== null && (initialDate.getHours() !== 0 || initialDate.getMinutes() !== 0);

  const [customTimeEnabled, setCustomTimeEnabled] = useState(hasTimeComponent);
  const [time, setTime] = useState(
    initialDate
      ? initialDate.getHours().toString().padStart(2, "0") +
          ":" +
          initialDate.getMinutes().toString().padStart(2, "0")
      : ""
  );

  const [loading, setLoading] = useState(false);

  const commentRef = useRef<HTMLTextAreaElement | null>(null);
  const homeworkRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (commentRef.current) {
      commentRef.current.style.height = "auto";
      commentRef.current.style.height = commentRef.current.scrollHeight + "px";
    }
  }, [comment]);

  useEffect(() => {
    if (homeworkRef.current) {
      homeworkRef.current.style.height = "auto";
      homeworkRef.current.style.height = homeworkRef.current.scrollHeight + "px";
    }
  }, [homework]);

  // Groupes triés (ASC) + numérotation
  const singlesSorted = useMemo(() => {
    return availableContracts
      .filter((c) => c.mode === "single")
      .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  }, [availableContracts]);

  const packGroups = useMemo(() => {
    const map = new Map<number, BillingContract[]>();
    for (const c of availableContracts) {
      if (c.mode !== "package") continue;
      const size = c.totalLessons || 0;
      if (!map.has(size)) map.set(size, []);
      map.get(size)!.push(c);
    }
    // trier chaque groupe (ASC)
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
    }
    // tailles croissantes pour un ordre stable
    const sizes = Array.from(map.keys()).sort((a, b) => a - b);
    return { map, sizes };
  }, [availableContracts]);

  // Liste à plat des packs dans l'ordre d'affichage
  const packsFlatSorted = useMemo(() => {
    return packGroups.sizes.flatMap((size) => packGroups.map.get(size) || []);
  }, [packGroups]);

  // Ne pré-sélectionne plus automatiquement de contrat
  useEffect(() => {
    if (initial) return;
    setBillingId(null);
  }, [initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Validation: unitPrice is required if not associated with a contract
    if (!associateContract && (unitPrice === null || isNaN(unitPrice))) {
      setUnitPriceError(t("lessonForm.unitPriceRequired", "Veuillez indiquer le prix de la leçon."));
      setLoading(false);
      return;
    } else {
      setUnitPriceError(null);
    }
    try {
      // on renvoie la date sélectionnée avec l'heure actuelle locale, sous forme ISO
      const now = new Date();
      const [year, month, day] = date.split("-");
      let hours = now.getHours();
      let minutes = now.getMinutes();
      if (customTimeEnabled && time) {
        const [h, m] = time.split(":");
        hours = Number(h);
        minutes = Number(m);
      }
      const combined = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes);
      const payload: any = {
        comment,
        homework,
        billingId,
        createdAt: combined.toISOString(),
      };
      if (!associateContract) {
        payload.price = unitPrice;
      }
      await onSaved(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{initial ? t("lessonForm.editTitle") : t("lessonForm.newTitle")}</h3>
        <form onSubmit={handleSubmit} className="form">
          {!associateContract && (
            <div className="field">
              <label className="label">{t("lessonForm.unitPrice", "Prix de la leçon (EUR)")}</label>
              <input
                type="number"
                className="input"
                min="0"
                step="0.01"
                value={unitPrice ?? ""}
                onChange={(e) => setUnitPrice(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder={t("lessonForm.unitPricePlaceholder", "Ex: 25")}
              />
              {unitPriceError && (
                <p style={{ color: "#e53935", fontSize: "13px", marginTop: "4px", fontWeight: 500 }}>{unitPriceError}</p>
              )}
            </div>
          )}

          <div className="field">
            <label className="label">{t("lessonForm.comment")}</label>
            <textarea
              ref={commentRef}
              className="textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("lessonForm.commentPlaceholder")}
              style={{ resize: "none", overflow: "hidden" }}
            />
          </div>

          <div className="field">
            <label className="label">{t("lessonForm.homework")}</label>
            <textarea
              ref={homeworkRef}
              className="textarea"
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder={t("lessonForm.homeworkPlaceholder")}
              style={{ resize: "none", overflow: "hidden" }}
            />
          </div>

          <div className="field">
            <label className="label">{t("lessonForm.date")}</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={customTimeEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCustomTimeEnabled(checked);
                  if (checked) {
                    const now = new Date();
                    const hh = now.getHours().toString().padStart(2, "0");
                    const mm = now.getMinutes().toString().padStart(2, "0");
                    setTime(`${hh}:${mm}`);
                  }
                }}
              />{" "}
              {t("lessonForm.addCustomTime")}
            </label>
          </div>

          {customTimeEnabled && (
            <div className="field">
              <label className="label">{t("lessonForm.time")}</label>
              <input
                type="time"
                className="input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          )}

          {availableContracts.length > 0 && (
            <div className="field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={associateContract}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAssociateContract(checked);
                    if (!checked) {
                      setBillingId(null);
                    }
                  }}
                />{" "}
                {t("lessonForm.associateContractOption", "Associer un contrat")}
              </label>
            </div>
          )}

          {associateContract && availableContracts.length > 0 && (
            <div className="field">
              <label className="label">{t("lessonForm.chooseContract", "Sélectionner un contrat")}</label>
              <select
                className="input"
                value={billingId ?? ""}
                onChange={(e) => setBillingId(e.target.value || null)}
              >
                {packsFlatSorted.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || `Pack de ${c.totalLessons ?? "?"} leçons`}
                    {c.createdAt ? ` — ${new Date(c.createdAt).toLocaleDateString("fr-FR")}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {initial ? t("common.save") : t("common.add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
