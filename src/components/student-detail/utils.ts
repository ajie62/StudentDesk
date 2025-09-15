import { Student, CEFR, BillingContract, TrackingDraft } from "../../types";

export function makeTrackingDraft(s: Student): TrackingDraft {
  return {
    goals: s.goals ?? "",
    progress: s.progress ?? 0,
    cefr: {
      oral: s.cefr?.oral,
      ecrit: s.cefr?.ecrit,
      interaction: s.cefr?.interaction,
      grammaire: s.cefr?.grammaire,
      vocabulaire: s.cefr?.vocabulaire,
    },
    tags: [...(s.tags ?? [])],
  };
}

export function isTrackingEqual(d: TrackingDraft, s: Student): boolean {
  const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  return (
    (d.goals ?? "") === (s.goals ?? "") &&
    (d.progress ?? 0) === (s.progress ?? 0) &&
    eq(d.cefr ?? {}, s.cefr ?? {}) &&
    eq(d.tags ?? [], s.tags ?? [])
  );
}

// === Billing ===
export function isContractEqual(a: BillingContract | null, b: BillingContract | null) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Génération d’un nom unique pour chaque contrat */
export function generateDisplayName(
  mode: "single" | "package",
  totalLessons: number,
  existing: BillingContract[]
): string {
  if (mode === "single") {
    const base = "Cours unitaire";
    const sameType = existing.filter((c) => c.mode === "single");
    return `${base} (${sameType.length + 1})`;
  }

  if (mode === "package") {
    const base = `Pack de ${totalLessons} leçons`;
    const sameType = existing.filter(
      (c) => c.mode === "package" && c.totalLessons === totalLessons
    );
    return `${base} (${sameType.length + 1})`;
  }

  return "Contrat";
}

// Helpers UI progression
export function totalFor(c: BillingContract) {
  return c.mode === "package" ? c.totalLessons || 0 : 1;
}

export function consumedFor(c: BillingContract, student: Student) {
  if (typeof c.consumedLessons === "number") return c.consumedLessons;
  return (student.lessons ?? []).filter((l) => l.billingId === c.id).length;
}

export function percentFor(c: BillingContract, student: Student) {
  const total = totalFor(c);
  if (!total) return 0;
  const used = consumedFor(c, student);
  return Math.min(100, Math.round((used / total) * 100));
}
