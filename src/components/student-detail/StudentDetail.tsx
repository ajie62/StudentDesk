import React from "react";
import { Student } from "../../types";
import StudentForm from "../StudentForm";
import StudentHero from "./StudentHero";
import StudentLessons from "./StudentLessons";
import StudentTrackingSection from "./StudentTrackingSection";
import StudentBillingSection from "./StudentBillingSection";
import { useStudentDetail } from "./useStudentDetail";

type Props = {
  studentId: string;
  onDeleted: () => void;
  onUpdated: () => void;
};

export default function StudentDetail({ studentId, onDeleted, onUpdated }: Props) {
  const { student, tab, setTab, editing, setEditing, handleListUpdated } = useStudentDetail(
    studentId,
    onDeleted,
    onUpdated
  );

  if (!student) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Hero avec avatar, onglets, actions globales */}
      <StudentHero
        student={student}
        tab={tab}
        setTab={setTab}
        onEdit={() => setEditing(true)}
        onDelete={onDeleted}
      />

      {/* Contenu conditionnel selon l’onglet actif */}
      {tab === "fiche" && <StudentLessons student={student} onUpdated={handleListUpdated} />}
      {tab === "suivi" && (
        <StudentTrackingSection student={student} onUpdated={handleListUpdated} />
      )}
      {tab === "billing" && (
        <StudentBillingSection student={student} onUpdated={handleListUpdated} />
      )}

      {/* Modal édition étudiant */}
      {editing && (
        <StudentForm
          initial={student}
          onClose={() => setEditing(false)}
          onSaved={async (patch) => {
            await window.studentApi.updateStudent(student.id, patch as Partial<Student>);
            setEditing(false);
            await handleListUpdated();
          }}
        />
      )}
    </div>
  );
}
