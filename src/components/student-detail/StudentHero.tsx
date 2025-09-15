import React, { useRef, useState, useEffect, useMemo } from "react";
import { Student, StudentHeroProps } from "../../types";
import { formatDate, fullName } from "../../utils";
import { Edit3, Trash2 } from "lucide-react";

function initials(s: Student) {
  const a = (s.firstName || "").trim()[0] || "";
  const b = (s.lastName || "").trim()[0] || "";
  return (a + b).toUpperCase() || "•";
}

export default function StudentHero({
  student,
  tab,
  setTab,
  onEdit,
  onDelete,
  onLessonsUpdated,
  onEditLesson,
}: StudentHeroProps) {
  const descRef = useRef<HTMLDivElement | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [needClamp, setNeedClamp] = useState(false);

  const lastLesson = useMemo(() => {
    const lessons = (student.lessons ?? []).filter((l) => !l.deletedAt);
    if (lessons.length === 0) return null;
    return lessons.reduce((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b));
  }, [student.lessons]);

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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <h2 style={{ margin: 0 }}>{fullName(student)}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn ghost"
                style={{ backgroundColor: "#121214", color: "#fff" }}
                onClick={onEdit}
              >
                Modifier l’étudiant
              </button>
              <button
                className="btn"
                style={{ backgroundColor: "#121214", color: "#fff" }}
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

      {/* DERNIÈRE LEÇON */}
      {lastLesson && (
        <div
          className="card"
          style={{ marginTop: 12, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            {/* Titre */}
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1,
                fontWeight: 800,
                color: "var(--muted)",
                opacity: 0.9,
              }}
            >
              DERNIÈRE LEÇON
            </div>

            {/* Date + actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  opacity: 0.8,
                }}
              >
                {formatDate(lastLesson.createdAt)}
              </div>

              <button
                className="btn ghost small"
                onClick={() => onEditLesson(lastLesson)}
                title="Modifier la leçon"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 8px", // zone cliquable plus grande
                  fontSize: 14, // taille du symbole
                  lineHeight: 1,
                }}
              >
                <Edit3 size={16} strokeWidth={1.5} />
              </button>

              <button
                className="btn ghost small danger"
                onClick={async () => {
                  if (confirm("Supprimer cette leçon ?")) {
                    await window.studentApi.deleteLesson(student.id, lastLesson.id);
                    await onLessonsUpdated();
                  }
                }}
                title="Supprimer la leçon"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 8px",
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                <Trash2 size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 25 }}>
            {/* Commentaire */}
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>
                Commentaire
              </div>
              <div>
                {lastLesson.comment?.trim() || <span style={{ color: "var(--muted)" }}>—</span>}
              </div>
            </div>

            {/* Devoirs */}
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>Devoirs</div>
              <div>
                {lastLesson.homework?.trim() || <span style={{ color: "var(--muted)" }}>—</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
