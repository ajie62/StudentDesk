// Data contracts for the renderer side.
export type LessonDuration = 30 | 45 | 60 | 90 | number;
export type CEFR = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type FilterKind = "all" | "active" | "inactive" | "contracts";
export type SettingsTab = "app" | "lessons" | "data";
export type StudentDetailTab = "fiche" | "suivi" | "billing";

export type AppSettings = {
  theme: string;
  lessonDuration: number;
  currency: string;
  defaultStudentFilter?: FilterKind;
};

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

export type StudentWithUpdateProps = {
    student: Student;
    onUpdated: () => void;
};

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

export type StudentSheet = {
  createdAt: string;
};

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

export interface Stats {
  total: number;
  active: number;
  inactive: number;
  lessons: number;
  lastStudent?: Student;
  lastLesson?: { student: Student; createdAt: string };
  topStudent?: Student;
};

export interface Toast {
  id: string;
  text: string;
};

export type ToastContainerProps = {
    toasts: Toast[];
};

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

export type DashboardProps = {
  stats: Stats;
  students: Student[];
  events: ActivityItem[];
  onOpenStudent: (id: string) => void;
};

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
