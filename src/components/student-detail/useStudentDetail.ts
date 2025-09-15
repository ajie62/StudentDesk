import { useState, useEffect } from "react";
import { Student, StudentDetailTab } from "../../types";

const defaultTab = "fiche";

export function useStudentDetail(studentId: string, onDeleted: () => void, onUpdated: () => void) {
  const [student, setStudent] = useState<Student | null>(null);
  const [tab, setTab] = useState<StudentDetailTab>(defaultTab);
  const [editing, setEditing] = useState(false);

  async function refresh(resetPage = false) {
    const s = await window.studentApi.getStudent(studentId);
    if (!Array.isArray(s.billingHistory)) (s as Student).billingHistory = [];
    setStudent(s);

    if (resetPage) {
      setTab(defaultTab); // reset tab quand on change d’étudiant
    }
  }

  useEffect(() => {
    refresh(true);
  }, [studentId]);

  // remonter tout en haut immédiatement au changement d’étudiant
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [studentId]);

  async function handleListUpdated() {
    await refresh(false);
    onUpdated();
  }

  return {
    student,
    tab,
    setTab,
    editing,
    setEditing,
    refresh,
    handleListUpdated,
  };
}
