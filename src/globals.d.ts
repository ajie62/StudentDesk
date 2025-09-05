import { Student } from './types'

declare global {
  interface Window {
    studentApi: {
      // Students
      listStudents: () => Promise<Student[]>
      createStudent: (payload: Partial<Student>) => Promise<Student>
      updateStudent: (id: string, patch: Partial<Student>) => Promise<Student>
      deleteStudent: (id: string) => Promise<string>
      getStudent: (id: string) => Promise<Student>

      // Lessons
      addLesson: (studentId: string, payload: any) => Promise<Student>
      deleteLesson: (studentId: string, lessonId: string) => Promise<string>

      // Events
      onAppFocus: (cb: (evt?: any) => void) => () => void
      onStoreSaved?: (cb: (payload: { action: string; icloud: boolean; when: string }) => void) => () => void
    }
  }
}

export {}