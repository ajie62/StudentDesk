import React, { useRef, useState, useEffect } from "react";
import { Student } from "../../types";
import { formatDate, fullName } from "../../utils";

type Props = {
  student: Student;
  tab: "fiche" | "suivi" | "billing";
  setTab: (tab: "fiche" | "suivi" | "billing") => void;
  onEdit: () => void;
  onDelete: () => void;
};

function initials(s: Student) {
  const a = (s.firstName || "").trim()[0] || "";
  const b = (s.lastName || "").trim()[0] || "";
  return (a + b).toUpperCase() || "•";
}

export default function StudentHero({ student, tab, setTab, onEdit, onDelete }: Props) {
  const descRef = useRef<HTMLDivElement | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [needClamp, setNeedClamp] = useState(false);

  // clamp description sur 3 lignes
  useEffect(() => {
    if (!descRef.current) return;
    const el = descRef.current;
    const lh = parseFloat(getComputedStyle(el).lineHeight || "20");
    const maxH = lh * 3;
    setNeedClamp(el.scrollHeight > maxH + 2);
  }, [student, showFullDesc]);

  return (
    <div className="hero">
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div className={student.isActive ? "badge badge--active" : "badge"}>
          {student.isActive ? "Actif" : "Inactif"}
        </div>
        <div className="badge">Fiche créée {formatDate(student.sheet.createdAt)}</div>
      </div>

      {/* Avatar + nom + desc */}
      <div className="hero-row" style={{ marginBottom: 12 }}>
        <div className="avatar avatar--lg hero-avatar" style={{ marginBottom: 8 }}>
          {student.photo ? (
            <img src={student.photo} alt={`Photo de ${fullName(student)}`} />
          ) : (
            <div className="avatar__placeholder">{initials(student)}</div>
          )}
        </div>

        <div className="hero-main">
          <h2 style={{ margin: "0 0 2px 0" }}>{fullName(student)}</h2>

          <div
            ref={descRef}
            className={["hero-description", needClamp && !showFullDesc ? "limited" : ""].join(" ")}
          >
            {student.description || (
              <span style={{ color: "var(--muted)" }}>Aucune description.</span>
            )}
          </div>

          {needClamp && (
            <div className="hero-description-toggle" onClick={() => setShowFullDesc((v) => !v)}>
              {showFullDesc ? "Voir moins" : "Voir plus"}
            </div>
          )}
        </div>
      </div>

      {/* Onglets + actions globales */}
      <div className="sep" />
      <div
        className="tabs"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 4,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <button
          className={`btn ghost ${tab === "fiche" ? "active" : ""}`}
          onClick={() => setTab("fiche")}
        >
          Fiche
        </button>
        <button
          className={`btn ghost ${tab === "suivi" ? "active" : ""}`}
          onClick={() => setTab("suivi")}
        >
          Suivi
        </button>
        <button
          className={`btn ghost ${tab === "billing" ? "active" : ""}`}
          onClick={() => setTab("billing")}
        >
          Cours & facturation
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="btn ghost" onClick={onEdit}>
            Modifier l’étudiant
          </button>
          <button
            className="btn"
            onClick={async () => {
              if (confirm("Supprimer cet étudiant ?")) {
                await window.studentApi.deleteStudent(student.id);
                onDelete();
              }
            }}
          >
            Supprimer l’étudiant
          </button>
        </div>
      </div>
    </div>
  );
}
