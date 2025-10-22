import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Student } from "../types";

type StudentsContextType = {
  students: Student[];
  refresh: () => Promise<void>;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
};

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export const StudentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);

  const refresh = useCallback(async () => {
    const list = await window.studentApi.listStudents();
    list.sort((a, b) => a.firstName.localeCompare(b.firstName));
    setStudents(list);
  }, []);

  // Chargement initial
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <StudentsContext.Provider value={{ students, refresh, setStudents }}>
      {children}
    </StudentsContext.Provider>
  );
};

export const useStudentsContext = () => {
  const ctx = useContext(StudentsContext);
  if (!ctx) throw new Error("useStudentsContext must be used within a StudentsProvider");
  return ctx;
};
