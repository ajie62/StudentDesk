import type { Student } from "./types"

declare global {
  interface Window {
    studentApi: {
      listStudents: () => Promise<Student[]>
      createStudent: (payload: Partial<Student>) => Promise<Student>
      updateStudent: (id: string, patch: Partial<Student>) => Promise<Student>
      deleteStudent: (id: string) => Promise<string>
      getStudent: (id: string) => Promise<Student>
      addLesson: (studentId: string, payload: any) => Promise<Student>
      updateLesson: (studentId: string, lessonId: string, patch: any) => Promise<any>
      deleteLesson: (studentId: string, lessonId: string) => Promise<string>
      importCSV: () => Promise<{ count: number }>
      onAppFocus: (cb: () => void) => void
      onStoreSaved?: (cb: (payload: { action: string; icloud: boolean; when: string }) => void) => () => void
      onUpdate?: (channel: string, cb: (event: any, payload?: any) => void) => () => void
      installUpdateNow: () => Promise<void>
      getVersion: () => Promise<string>
    }
  }
}

export {}