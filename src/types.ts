// Data contracts for the renderer side.
export type Lesson = {
  id: string
  createdAt: string
  comment: string
  homework: string
}

export type StudentSheet = {
  createdAt: string
}

export type Student = {
  id: string
  firstName: string
  lastName: string
  description: string
  isActive: boolean
  // Optional photo stored as data URL (png/jpg). Keep null/undefined if none.
  photo?: string | null
  sheet: { createdAt: string }
  lessons: Lesson[]
}
