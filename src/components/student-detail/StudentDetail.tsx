import React, { useState } from "react";
import { Student, Lesson, StudentDetailProps } from "../../types";
import StudentForm from "../student/StudentForm";
import LessonForm from "../dashboard/LessonForm";
import StudentHero from "./StudentHero";
import StudentLessons from "./StudentLessons";
import StudentTrackingSection from "./StudentTrackingSection";
import StudentBillingSection from "./StudentBillingSection";
import { useStudentDetail } from "./useStudentDetail";

export default function StudentDetail({ studentId, onDeleted, onUpdated }: StudentDetailProps) {
  const { student, tab, setTab, editing, setEditing, handleListUpdated } = useStudentDetail(
    studentId,
    onDeleted,
    onUpdated
  );

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  if (!student) return null;

  return (
    <div style={{ display: "grid", gap: 4 }}>
      {/* Hero avec avatar, dernière leçon, onglets */}
      <StudentHero
        student={student}
        tab={tab}
        setTab={setTab}
        onEdit={() => setEditing(true)}
        onDelete={onDeleted}
        onLessonsUpdated={handleListUpdated}
        onEditLesson={(lesson) => setEditingLesson(lesson)}
      />

      <div className="sep" />
      <div
        className="tabs"
        style={{
          display: "flex",
          gap: 14,
          marginTop: 4,
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
      </div>

      {/* Contenu par onglet */}
      {tab === "fiche" && (
        <StudentLessons student={student} onUpdated={handleListUpdated} setTab={setTab} />
      )}
      {tab === "suivi" && (
        <StudentTrackingSection student={student} onUpdated={handleListUpdated} />
      )}
      {tab === "billing" && (
        <StudentBillingSection student={student} onUpdated={handleListUpdated} />
      )}

      {/* Modale : édition de l'étudiant */}
      {editing && (
        <StudentForm
          initial={student}
          onClose={() => setEditing(false)}
          onSaved={async (patch: Partial<Student>) => {
            await window.studentApi.updateStudent(student.id, patch as Partial<Student>);
            setEditing(false);
            await handleListUpdated();
          }}
        />
      )}

      {/* Modale : édition de la leçon */}
      {editingLesson && (
        <LessonForm
          initial={editingLesson}
          availableContracts={student.billingHistory ?? []}
          onClose={() => setEditingLesson(null)}
          onSaved={async (patch: Partial<Lesson>) => {
            await window.studentApi.updateLesson(student.id, editingLesson.id, patch);
            setEditingLesson(null);
            await handleListUpdated();
          }}
        />
      )}
    </div>
  );
}
