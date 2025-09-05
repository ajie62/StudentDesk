import { Student } from './types'

type Lesson = {
  id: string
  createdAt: string
  comment: string
  homework: string
  tags: string[]
}

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
      addLesson: (studentId: string, payload: Partial<Lesson>) => Promise<Student>
      deleteLesson: (studentId: string, lessonId: string) => Promise<string>
      updateLesson: (
        studentId: string,
        lessonId: string,
        patch: Partial<Lesson>
      ) => Promise<Lesson>

      // CSV Import
      importCSV: () => Promise<{ count: number }>

      // App events
      onAppFocus: (cb: () => void) => () => void

      // Store saved event
      onStoreSaved?: (
        cb: (payload: { action: string; icloud: boolean; when: string }) => void
      ) => () => void
    }
  }
}

export {}
