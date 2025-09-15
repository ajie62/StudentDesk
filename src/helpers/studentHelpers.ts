import { Student, Stats, ActivityItem } from "../types";
import { fullName } from "../utils";

export function computeStats(students: Student[]): Stats {
  const total = students.length;
  const active = students.filter((s) => s.isActive).length;
  const inactive = total - active;

  let lessons = 0;
  let lastLesson: Stats["lastLesson"];
  let topStudent: Student | undefined;

  students.forEach((s) => {
    lessons += s.lessons.length;
    if (s.lessons.length) {
      const recent = [...s.lessons].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      if (!lastLesson || recent.createdAt > lastLesson.createdAt) {
        lastLesson = { student: s, createdAt: recent.createdAt };
      }
    }
    if (!topStudent || s.lessons.length > topStudent.lessons.length) {
      topStudent = s;
    }
  });

  const lastStudent = [...students].sort((a, b) =>
    b.sheet.createdAt.localeCompare(a.sheet.createdAt)
  )[0];

  return { total, active, inactive, lessons, lastStudent, lastLesson, topStudent };
}

export function computeEvents(students: Student[]): ActivityItem[] {
  const evts: ActivityItem[] = [];
  students.forEach((s) => {
    evts.push({
      id: `stu-${s.id}-created`,
      kind: "student:create",
      label: `${fullName(s)} ajouté`,
      when: s.sheet.createdAt,
      studentId: s.id,
    });
    if (s.updatedAt) {
      evts.push({
        id: `stu-${s.id}-updated`,
        kind: "student:update",
        label: `${fullName(s)} modifié`,
        when: s.updatedAt,
        studentId: s.id,
      });
    }
    if (s.deletedAt) {
      evts.push({
        id: `stu-${s.id}-deleted`,
        kind: "student:delete",
        label: `${fullName(s)} supprimé`,
        when: s.deletedAt,
        studentId: s.id,
      });
    }
    s.lessons.forEach((l) => {
      evts.push({
        id: `les-${s.id}-${l.id}-created`,
        kind: "lesson:add",
        label: `Leçon pour ${fullName(s)}`,
        when: l.createdAt,
        studentId: s.id,
      });
      if (l.updatedAt) {
        evts.push({
          id: `les-${s.id}-${l.id}-updated`,
          kind: "lesson:update",
          label: `Leçon modifiée pour ${fullName(s)}`,
          when: l.updatedAt,
          studentId: s.id,
        });
      }
      if (l.deletedAt) {
        evts.push({
          id: `les-${s.id}-${l.id}-deleted`,
          kind: "lesson:delete",
          label: `Leçon supprimée pour ${fullName(s)}`,
          when: l.deletedAt,
          studentId: s.id,
        });
      }
    });
  });

  return evts.sort((a, b) => b.when.localeCompare(a.when));
}
