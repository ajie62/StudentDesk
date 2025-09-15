import React, { useState } from "react";
import { Student, CEFR, TrackingDraft, StudentWithUpdateProps } from "../../types";
import { makeTrackingDraft, isTrackingEqual } from "./utils";

const CEFR_LEVELS: CEFR[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function StudentTrackingSection({ student, onUpdated }: StudentWithUpdateProps) {
  const [trackDraft, setTrackDraft] = useState<TrackingDraft>(makeTrackingDraft(student));
  const [trackDirty, setTrackDirty] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

  function updateTracking(patch: Partial<TrackingDraft>) {
    setTrackDraft((prev) => {
      const next: TrackingDraft = {
        goals: patch.goals ?? prev.goals,
        progress: patch.progress ?? prev.progress,
        cefr: patch.cefr ? { ...(prev.cefr ?? {}), ...patch.cefr } : prev.cefr,
      };
      setTrackDirty(!isTrackingEqual(next, student));
      return next;
    });
  }

  async function saveTracking() {
    await window.studentApi.updateStudent(student.id, {
      goals: trackDraft.goals,
      progress: trackDraft.progress,
      cefr: trackDraft.cefr,
    } as Partial<Student>);
    setTrackDirty(false);
    await onUpdated();
  }

  function resetTracking() {
    setTrackDraft(makeTrackingDraft(student));
    setTrackDirty(false);
  }

  async function downloadPDF() {
    if (loadingPDF) return;
    try {
      setLoadingPDF(true);
      await window.studentApi.exportTrackingReport({
        studentId: student.id,
        goals: trackDraft.goals,
        progress: trackDraft.progress,
        cefr: trackDraft.cefr,
      });
    } catch (err) {
      console.error("Erreur PDF", err);
      alert("Impossible de générer le PDF du bilan.");
    } finally {
      setLoadingPDF(false);
    }
  }

  return (
    <div className="card" style={{ marginTop: 8 }}>
      {/* progression */}
      <div className="stat-card wide" style={{ marginBottom: 16 }}>
        <div className="stat-icon">📈</div>
        <div>
          <div className="stat-label">Progression estimée</div>
          <div className="stat-value">{trackDraft.progress ?? 0}%</div>
          <input
            type="range"
            min={0}
            max={100}
            value={trackDraft.progress ?? 0}
            onChange={(e) => updateTracking({ progress: Number(e.target.value) })}
            aria-label="Progression"
            style={{ width: 240, marginTop: 8 }}
          />
        </div>
      </div>

      {/* objectifs */}
      <div className="stat-card wide" style={{ marginBottom: 16 }}>
        <div className="stat-icon">🎯</div>
        <div style={{ width: "100%" }}>
          <div className="stat-label">Objectifs</div>
          <textarea
            className="input"
            placeholder="Ex: Atteindre B1 en compréhension orale d’ici juin…"
            value={trackDraft.goals}
            onChange={(e) => updateTracking({ goals: e.target.value })}
            rows={4}
            style={{ width: "100%", marginTop: 8 }}
          />
        </div>
      </div>

      {/* CECRL */}
      <div className="stat-card wide" style={{ marginBottom: 16 }}>
        <div className="stat-icon">🧭</div>
        <div style={{ width: "100%" }}>
          <div className="stat-label">Niveaux CECRL</div>
          <div
            className="grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 12,
              marginTop: 8,
            }}
          >
            {[
              ["oral", "Compréhension orale"],
              ["ecrit", "Production écrite"],
              ["interaction", "Interaction"],
              ["grammaire", "Grammaire"],
              ["vocabulaire", "Vocabulaire"],
            ].map(([key, label]) => {
              type CEFRKey = keyof NonNullable<TrackingDraft["cefr"]>;
              const current = trackDraft.cefr?.[key as CEFRKey];
              return (
                <label key={key} className="input-row">
                  <span style={{ display: "block", fontSize: 12, color: "#999" }}>{label}</span>
                  <select
                    className="input"
                    value={current ?? ""}
                    onChange={(e) => {
                      const value = e.target.value as string;
                      let valid: CEFR | undefined = undefined;
                      if (CEFR_LEVELS.includes(value as CEFR)) valid = value as CEFR;
                      updateTracking({
                        cefr: {
                          ...(trackDraft.cefr || {}),
                          [key]: valid,
                        },
                      });
                    }}
                  >
                    <option value="">—</option>
                    {CEFR_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="actions" style={{ marginTop: 12, display: "flex", alignItems: "center" }}>
        {!trackDirty && <span style={{ color: "var(--muted)" }}>Aucune modification</span>}

        <div style={{ flex: 1 }} />

        <div className="buttons" style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" disabled={!trackDirty} onClick={resetTracking}>
            Annuler
          </button>
          <button className="btn" disabled={!trackDirty} onClick={saveTracking}>
            💾 Enregistrer
          </button>
          <button
            className="btn"
            onClick={downloadPDF}
            disabled={loadingPDF}
            title="Exporter les données actuelles en PDF"
          >
            {loadingPDF ? "Génération…" : "📄 Télécharger le bilan (PDF)"}
          </button>
        </div>
      </div>
    </div>
  );
}
