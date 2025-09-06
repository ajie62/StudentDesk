// Data contracts for the renderer side.

export type LessonDuration = 30 | 45 | 60 | 90 | number

// Niveaux CECRL
export type CEFR = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface Lesson {
  id: string
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
  comment: string
  homework: string
  tags: string[]
  /** Identifiant du contrat (Cours & facturation) auquel cette leçon est rattachée */
  billingId?: string | null   // ← optionnel, règle ton erreur
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

/** Contrat de cours & facturation */
export interface BillingContract {
  id: string
  createdAt: string
  updatedAt: string | null
  mode: 'single' | 'package'
  totalLessons: number
  durationMinutes: LessonDuration
  customDuration: boolean
  pricePerLesson: number | null
  currency: string | null
  paid: boolean
  notes: string
  startDate: string | null
  endDate: string | null

  consumedLessons?: number
  completed?: boolean
  completedAt?: string | null

  /** Nom unique pour différencier plusieurs contrats similaires */
  displayName: string
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

  // suivi (facultatif)
  goals?: string
  progress?: number
  cefr?: {
    oral?: CEFR
    ecrit?: CEFR
    interaction?: CEFR
    grammaire?: CEFR
    vocabulaire?: CEFR
  }
  tags?: string[]

  // facturation
  billingHistory: BillingContract[]

  updatedAt: string | null
  deletedAt: string | null
}