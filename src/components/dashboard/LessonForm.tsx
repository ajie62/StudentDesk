import React, { useEffect, useMemo, useState, useRef } from "react";
import { BillingContract, LessonFormProps } from "../../types";

export default function LessonForm({ onClose, onSaved, initial, availableContracts = [] }: LessonFormProps) {
  const [comment, setComment] = useState(initial?.comment || "");
  const [homework, setHomework] = useState(initial?.homework || "");
  const [date, setDate] = useState(
    initial?.createdAt
      ? new Date(initial.createdAt).toISOString().substring(0, 10)
      : new Date().toISOString().substring(0, 10)
  );
  const [billingId, setBillingId] = useState<string | null>(initial?.billingId ?? null);
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

  // Pré-sélection par défaut :
  // - s'il n'y a qu'un seul contrat, on le choisit
  // - s'il y en a plusieurs et rien de pré-choisi, on prend le 1er "Cours unitaire" si dispo, sinon le 1er pack
  useEffect(() => {
    if (initial) return;
    if (availableContracts.length === 1) {
      setBillingId(availableContracts[0].id);
      return;
    }
    if (!billingId && availableContracts.length > 1) {
      const first = singlesSorted[0] ?? packsFlatSorted[0] ?? null;
      if (first) setBillingId(first.id);
    }
  }, [initial, availableContracts, billingId, singlesSorted, packsFlatSorted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
        // on renvoie la date sélectionnée, sous forme ISO
        await onSaved({
        comment,
        homework,
        billingId,
        createdAt: new Date(date).toISOString(),
        });
        onClose();
    } finally {
        setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{initial ? "Modifier la leçon" : "Nouvelle leçon"}</h3>
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label className="label">Commentaire</label>
            <textarea
              ref={commentRef}
              className="textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Notes sur la leçon..."
              style={{ resize: "none", overflow: "hidden" }}
            />
          </div>

          <div className="field">
            <label className="label">Devoirs</label>
            <textarea
              ref={homeworkRef}
              className="textarea"
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="Travail à faire..."
              style={{ resize: "none", overflow: "hidden" }}
            />
          </div>

          <div className="field">
            <label className="label">Date de la leçon</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Contrat associé :
              - 1 seul contrat => affichage statique (pas de select)
              - >1 contrats   => select avec groupes : Cours unitaires puis Packs */}
          {availableContracts.length === 1 && (
            <div className="field">
              <label className="label">Contrat associé</label>
              <div className="input" style={{ opacity: 0.9 }}>
                {availableContracts[0].mode === "package"
                  ? `Pack ${availableContracts[0].totalLessons} leçons`
                  : "Cours unitaire"}
              </div>
            </div>
          )}

          {availableContracts.length > 1 && (
            <div className="field">
              <label className="label">Associer à un contrat</label>
              <select
                className="input"
                value={billingId ?? ""}
                onChange={(e) => setBillingId(e.target.value || null)}
              >
                {singlesSorted.length > 0 && (
                  <optgroup label="Cours unitaires">
                    {singlesSorted.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.displayName}
                      </option>
                    ))}
                  </optgroup>
                )}

                {packsFlatSorted.length > 0 && (
                  <optgroup label="Packs">
                    {packGroups.sizes.map((size) => {
                      const arr = packGroups.map.get(size) || [];
                      return arr.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.displayName}
                        </option>
                      ));
                    })}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          <div className="actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {initial ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
