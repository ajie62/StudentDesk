import { useRef, useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          {student.isActive ? t("studentHero.active") : t("studentHero.inactive")}
        </div>
        <div className="badge">
          {t("studentHero.sheetCreated", { date: formatDate(student.sheet.createdAt) })}
        </div>
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
                {t("studentHero.editStudent")}
              </button>
              <button
                className="btn"
                style={{ backgroundColor: "#121214", color: "#fff" }}
                onClick={async () => {
                  if (confirm(t("studentHero.confirmDeleteStudent"))) {
                    await window.studentApi.deleteStudent(student.id);
                    onDelete();
                  }
                }}
              >
                {t("studentHero.deleteStudent")}
              </button>
            </div>
          </div>

          <div
            ref={descRef}
            className={["hero-description", needClamp && !showFullDesc ? "limited" : ""].join(" ")}
          >
            {student.description || (
              <span style={{ color: "var(--muted)" }}>{t("studentHero.noDescription")}</span>
            )}
          </div>

          {needClamp && (
            <div className="hero-description-toggle" onClick={() => setShowFullDesc((v) => !v)}>
              {showFullDesc ? t("studentHero.seeLess") : t("studentHero.seeMore")}
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
              {t("studentHero.lastLesson")}
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
                title={t("studentHero.editLesson")}
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
                  if (confirm(t("studentHero.confirmDeleteLesson"))) {
                    await window.studentApi.deleteLesson(student.id, lastLesson.id);
                    await onLessonsUpdated();
                  }
                }}
                title={t("studentHero.deleteLesson")}
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
                {t("studentHero.comment")}
              </div>
              <div>
                {lastLesson.comment?.trim() || <span style={{ color: "var(--muted)" }}>—</span>}
              </div>
            </div>

            {/* Devoirs */}
            <div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>
                {t("studentHero.homework")}
              </div>
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
