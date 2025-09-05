import type { Student } from './types'

declare global {
  interface Window {
    studentApi: {
      listStudents: () => Promise<Student[]>
      createStudent: (payload: Partial<Student>) => Promise<Student>
      updateStudent: (id: string, patch: Partial<Student>) => Promise<Student>
      deleteStudent: (id: string) => Promise<void>

      listLessons: (studentId: string) => Promise<any[]>
      createLesson: (studentId: string, payload: Partial<any>) => Promise<any>
      updateLesson: (studentId: string, lessonId: string, patch: Partial<any>) => Promise<any>
      deleteLesson: (studentId: string, lessonId: string) => Promise<void>

      onAppFocus: (cb: (evt: any) => void) => void

      /** Event déclenché après chaque sauvegarde (locale + iCloud) */
      onStoreSaved?: (
        cb: (payload: { action: string; icloud: boolean }) => void
      ) => () => void
    }
  }
}

export {}
