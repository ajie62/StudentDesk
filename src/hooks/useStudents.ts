import { useCallback, useState } from "react";
import { Student } from "../types";

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);

  const refresh = useCallback(async () => {
    const list = await window.studentApi.listStudents();
    list.sort((a, b) => a.firstName.localeCompare(b.firstName));
    setStudents(list);
    return list;
  }, []);

  return { students, setStudents, refresh };
}
