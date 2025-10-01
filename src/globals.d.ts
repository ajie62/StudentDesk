import type { Student, Lesson } from "./types";

declare global {
  interface Window {
    studentApi: {
      // === Students ===
      listStudents: () => Promise<Student[]>;
      createStudent: (payload: Partial<Student> & { origin?: string }) => Promise<Student>;
      updateStudent: (id: string, patch: Partial<Student>) => Promise<Student>;
      deleteStudent: (id: string) => Promise<string>;
      getStudent: (id: string) => Promise<Student>;

      // === Origins ===
      listOrigins: () => Promise<string[]>;
      addOrigin: (name: string) => Promise<string[]>;

      // === Lessons ===
      addLesson: (studentId: string, payload: Partial<Lesson>) => Promise<Student>;
      updateLesson: (
        studentId: string,
        lessonId: string,
        patch: Partial<Lesson>
      ) => Promise<Lesson>;
      deleteLesson: (studentId: string, lessonId: string) => Promise<string>;

      exportTrackingReport: (payload: {
        studentId: string;
        goals?: string;
        progress?: number;
        cefr?: {
          oral?: import("./types").CEFR;
          ecrit?: import("./types").CEFR;
          interaction?: import("./types").CEFR;
          grammaire?: import("./types").CEFR;
          vocabulaire?: import("./types").CEFR;
        };
        tags?: string[];
      }) => Promise<void>;

      // === CSV Import ===
      importCSV: () => Promise<{ count: number }>;

      // === Events / IPC ===
      onAppFocus: (cb: () => void) => void;
      onStoreSaved?: (
        cb: (payload: { action: string; icloud: boolean; when: string }) => void
      ) => () => void;
      onUpdate?: (channel: string, cb: (event: unknown, payload?: unknown) => void) => () => void;

      // === Updates ===
      installUpdateNow: () => Promise<void>;
      getVersion: () => Promise<string>;

      // === History ===
      clearHistory: () => Promise<{ clearedAt: string }>;
      getHistoryClearedAt: () => Promise<string | null>;

      // === Settings ===
      getSettings: () => Promise<{
        theme: string;
        lessonDuration: number;
        currency: string;
      }>;
      saveSettings: (
        settings: Partial<{
          theme: string;
          lessonDuration: number;
          currency: string;
        }>
      ) => Promise<{
        theme: string;
        lessonDuration: number;
        currency: string;
      }>;
    };
  }
}

export {};
