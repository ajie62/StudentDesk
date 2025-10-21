import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StudentLessonsProps } from "../../types";
import LessonCard from "../dashboard/LessonCard";
import LessonForm from "../dashboard/LessonForm";

const PAGE_SIZE_LESSONS = 10;

export default function StudentLessons({ student, onUpdated, setTab }: StudentLessonsProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [addingLesson, setAddingLesson] = useState(false);

  const lastLessonId = useMemo(() => {
    const lessons = (student.lessons ?? []).filter((l) => !l.deletedAt);
    if (lessons.length === 0) return null;
    return lessons.reduce((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b)).id;
  }, [student.lessons]);

  // pagination leçons
  const pageCount = useMemo(() => {
    const total = (student.lessons?.length ?? 0) - (lastLessonId ? 1 : 0);
    return Math.max(1, Math.ceil(total / PAGE_SIZE_LESSONS));
  }, [student, lastLessonId]);

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const currentLessons = useMemo(() => {
    const list = (student.lessons ?? []).filter((l) => l.id !== lastLessonId);
    const start = (page - 1) * PAGE_SIZE_LESSONS;
    const end = start + PAGE_SIZE_LESSONS;
    return list.slice(start, end);
  }, [student, page]);

  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  const openContracts = (student.billingHistory ?? []).filter((c) => !c.completed);

  async function handleListUpdated() {
    await onUpdated();
  }

  return (
    <>
      <div className="lesson-toolbar" style={{ marginBottom: 16 }}>
        <div className="lesson-toolbar__title">{t("studentLessons.title")}</div>
        <div className="lesson-toolbar__actions">
          <div className="pagination">
            <span className="counter">{t("pagination.pageOf", { page, pageCount })}</span>
            <button
              className="btn ghost"
              disabled={prevDisabled}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("pagination.previous")}
            </button>
            <button
              className="btn"
              disabled={nextDisabled}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              {t("pagination.next")}
            </button>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn"
              onClick={() => setAddingLesson(true)}
              title={t("studentLessons.addLesson")}
            >
              {t("studentLessons.addLesson")}
            </button>
            <button
              className="btn ghost"
              onClick={() => setTab("billing")}
              title={t("studentLessons.createContract")}
            >
              {t("studentLessons.createContract")}
            </button>
          </div>
        </div>
      </div>

      {(student.lessons?.length ?? 0) === 0 && (
        <div className="empty">{t("studentLessons.empty")}</div>
      )}

      <div className="list">
        {currentLessons.map((lesson) => (
          <div
            key={lesson.id}
            style={{
              position: "relative",
              borderLeft: !lesson.billingId ? "4px solid #22c55e" : "none",
              borderRadius: "var(--r-md)",
              overflow: "hidden",
              transition: "border-color 0.3s ease",
            }}
          >
            <LessonCard
              studentId={student.id}
              lesson={lesson}
              allContracts={student.billingHistory ?? []}
              onUpdated={handleListUpdated}
              onDelete={async () => {
                if (confirm(t("studentLessons.deleteConfirm"))) {
                  await window.studentApi.deleteLesson(student.id, lesson.id);
                  await handleListUpdated();
                }
              }}
            />
          </div>
        ))}
      </div>

      {addingLesson && (
        <LessonForm
          availableContracts={student.billingHistory ?? []}
          onClose={() => setAddingLesson(false)}
          onSaved={async (payload) => {
            // on ne reconstruit pas l'objet, on le passe tel quel (contient createdAt)
            await window.studentApi.addLesson(student.id, payload);
            setAddingLesson(false);
            await handleListUpdated();
          }}
        />
      )}
    </>
  );
}
