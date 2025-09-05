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
}
