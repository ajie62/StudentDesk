// =========================================================
// 🎯 Core / Shared types
// =========================================================
export type LessonDuration = 30 | 45 | 60 | 90 | number;
export type CEFR = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type FilterKind = "all" | "active" | "inactive" | "contracts";
export type SettingsTab = "app" | "lessons" | "data";
export type StudentDetailTab = "fiche" | "suivi" | "billing";

// =========================================================
// ⚙️ Settings
// =========================================================
export type AppSettings = {
  theme: string;
  lessonDuration: number;
  currency: string;
  defaultStudentFilter?: FilterKind;
};

// =========================================================
// 📚 Lessons
// =========================================================
export interface Lesson {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  comment: string;
  homework: string;
  tags: string[];
  /** Identifiant du contrat (Cours & facturation) auquel cette leçon est rattachée */
  billingId?: string | null;
}

// =========================================================
// 👨‍🎓 Students
// =========================================================
export type StudentSheet = {
  createdAt: string;
};

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  description: string;
  email: string;
  isActive: boolean;
  photo: string | null;
  sheet: {
    createdAt: string;
  };
  lessons: Lesson[];

  // suivi (facultatif)
  goals?: string;
  progress?: number;
  cefr?: {
    oral?: CEFR;
    ecrit?: CEFR;
    interaction?: CEFR;
    grammaire?: CEFR;
    vocabulaire?: CEFR;
  };
  tags?: string[];

  // facturation
  billingHistory: BillingContract[];
  billingActiveCount?: number;

  updatedAt: string | null;
  deletedAt: string | null;
}

export type TrackingDraft = {
  goals?: string;
  progress?: number;
  cefr?: {
    oral?: CEFR;
    ecrit?: CEFR;
    interaction?: CEFR;
    grammaire?: CEFR;
    vocabulaire?: CEFR;
  };
  tags?: string[];
};

export type StudentLessonsProps = StudentWithUpdateProps & {
    setTab: (tab: StudentDetailTab) => void;
};

// =========================================================
// 💰 Billing
// =========================================================
/** Contrat de cours & facturation */
export interface BillingContract {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  mode: "single" | "package";
  totalLessons: number;
  durationMinutes: LessonDuration;
  customDuration: boolean;
  pricePerLesson: number | null;
  currency: string | null;
  paid: boolean;
  notes: string;
  startDate: string | null;
  endDate: string | null;

  consumedLessons?: number;
  completed?: boolean;
  completedAt?: string | null;

  /** Nom unique pour différencier plusieurs contrats similaires */
  displayName: string;
}

// =========================================================
// 📊 Stats & Activity
// =========================================================
export type ActivityKind =
  | "student:create"
  | "student:update"
  | "student:delete"
  | "lesson:add"
  | "lesson:update"
  | "lesson:delete";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  label: string;
  when: string;
  studentId: string;
}

export interface Stats {
  total: number;
  active: number;
  inactive: number;
  lessons: number;
  lastStudent?: Student;
  lastLesson?: { student: Student; createdAt: string };
  topStudent?: Student;
}

// =========================================================
// 🔔 Toasts
// =========================================================
export interface Toast {
  id: string;
  text: string;
}

export type ToastContainerProps = {
  toasts: Toast[];
};

// =========================================================
// 🧩 Component Props
// =========================================================

// Generic pattern
export type StudentWithUpdateProps = {
  student: Student;
  onUpdated: () => void;
};

// Student Detail
export type StudentHeroProps = {
  student: Student;
  tab: StudentDetailTab;
  setTab: (tab: StudentDetailTab) => void;
  onEdit: () => void;
  onDelete: () => void;
  onLessonsUpdated: () => void;
  onEditLesson: (lesson: Lesson) => void;
};

export type StudentDetailProps = {
  studentId: string;
  onDeleted: () => void;
  onUpdated: () => void;
};

// Student Billing
export type StudentBillingViewModel = {
  firstName: string;
  lastName: string;
  lessons: Lesson[];
  billing: BillingContract;
};

export type StudentBillingProps = {
  viewModel: StudentBillingViewModel;
  onChange: (patch: Partial<BillingContract>) => void;
};

// Forms
export type StudentFormProps = {
  initial?: Student;
  onClose: () => void;
  onSaved: (payload: Partial<Student>) => Promise<void> | void;
};

export type LessonFormProps = {
  onClose: () => void;
  onSaved: (payload: Partial<Lesson>) => Promise<void>;
  initial?: Lesson; // si présent, mode édition
  availableContracts?: BillingContract[]; // contrats ouverts passés par le parent
};

export type LessonCardProps = {
  studentId: string;
  lesson: Lesson;
  allContracts: BillingContract[];
  onUpdated: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
};

// Dashboard
export type DashboardProps = {
  stats: Stats;
  students: Student[];
  events: ActivityItem[];
  onOpenStudent: (id: string) => void;
};

// =========================================================
// 📦 Changelog
// =========================================================
export type Release = {
  version: string;
  date: string;
  notes: string;
  url: string;
};

export type GitHubRelease = {
  tag_name?: string;
  name?: string;
  published_at?: string;
  created_at?: string;
  body?: string;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
};
