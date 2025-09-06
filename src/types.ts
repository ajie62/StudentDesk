// Data contracts for the renderer side.
export interface Lesson {
  id: string
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
  comment: string
  homework: string
  tags: string[]
}

export type StudentSheet = {
  createdAt: string
}

export type ActivityKind =
  | 'student:create'
  | 'student:update'
  | 'student:delete'
  | 'lesson:add'
  | 'lesson:update'
  | 'lesson:delete'

export interface ActivityItem {
  id: string
  kind: ActivityKind
  label: string
  when: string
  studentId: string
}

/** CECRL */
export type CEFR = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface Student {
  id: string
  firstName: string
  lastName: string
  description: string
  email: string
  isActive: boolean
  photo: string | null
  sheet: {
    createdAt: string
  }
  lessons: Lesson[]
  updatedAt: string | null
  deletedAt: string | null

  /** ----- Suivi pédagogique (facultatif / rétrocompatible) ----- */
  goals?: string                // Objectifs libres
  progress?: number             // 0..100
  cefr?: {
    oral?: CEFR
    ecrit?: CEFR
    interaction?: CEFR
    grammaire?: CEFR
    vocabulaire?: CEFR
  }
  tags?: string[]               // ex: ["DELF B1", "grammaire"]
}
