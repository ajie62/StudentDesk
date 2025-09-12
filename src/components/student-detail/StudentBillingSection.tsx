import React, { useMemo, useState, useEffect } from "react"
import { Student, BillingContract } from "../../types"
import StudentBilling from "../StudentBilling"
import { getCurrencyLabel } from "../../constants"
import { formatDate } from "../../utils"
import { v4 as uuidv4 } from "uuid"

// Helpers
function isContractEqual(a: BillingContract | null, b: BillingContract | null) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/** Génération d’un nom unique pour chaque contrat */
function generateDisplayName(
  mode: "single" | "package",
  totalLessons: number,
  existing: BillingContract[]
): string {
  if (mode === "single") {
    const base = "Cours unitaire"
    const sameType = existing.filter((c) => c.mode === "single")
    return `${base} (${sameType.length + 1})`
  }

  if (mode === "package") {
    const base = `Pack de ${totalLessons} leçons`
    const sameType = existing.filter(
      (c) => c.mode === "package" && c.totalLessons === totalLessons
    )
    return `${base} (${sameType.length + 1})`
  }

  return "Contrat"
}

// UI Helpers
function totalFor(c: BillingContract) {
  return c.mode === "package" ? c.totalLessons || 0 : 1
}
function consumedFor(c: BillingContract, student: Student) {
  if (typeof c.consumedLessons === "number") return c.consumedLessons
  return (student.lessons ?? []).filter((l) => l.billingId === c.id).length
}
function percentFor(c: BillingContract, student: Student) {
  const total = totalFor(c)
  if (!total) return 0
  const used = consumedFor(c, student)
  return Math.min(100, Math.round((used / total) * 100))
}

const PAGE_SIZE_BILLING = 10

type Props = {
  student: Student
  onUpdated: () => void
}

export default function StudentBillingSection({ student, onUpdated }: Props) {
  const [billingPage, setBillingPage] = useState(1)
  const [editingContract, setEditingContract] = useState<BillingContract | null>(
    null
  )
  const [billingDraft, setBillingDraft] = useState<BillingContract | null>(null)
  const [billingDirty, setBillingDirty] = useState(false)

  // Historique trié
  const sortedContracts = useMemo(() => {
    const history = student.billingHistory ?? []
    return [...history].sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    )
  }, [student])

  const billingPageCount = useMemo(() => {
    return Math.max(1, Math.ceil(sortedContracts.length / PAGE_SIZE_BILLING))
  }, [sortedContracts.length])

  useEffect(() => {
    setBillingPage((p) => Math.min(p, billingPageCount))
  }, [billingPageCount])

  const currentContracts = useMemo(() => {
    const start = (billingPage - 1) * PAGE_SIZE_BILLING
    const end = start + PAGE_SIZE_BILLING
    return sortedContracts.slice(start, end)
  }, [sortedContracts, billingPage])

  const billingPrevDisabled = billingPage <= 1
  const billingNextDisabled = billingPage >= billingPageCount

  async function ensureDraftDefaults(
    prev: BillingContract | null
  ): Promise<BillingContract> {
    const history = student.billingHistory ?? []
    const mode = prev?.mode ?? "single"
    const lessons = prev?.totalLessons ?? 1

    let prefs: { lessonDuration: number; currency: string } | null = null
    try {
      prefs = await window.studentApi.getSettings?.()
    } catch (e) {
      console.error("Impossible de charger les réglages", e)
    }

    return (
      prev ?? {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: null,
        mode,
        totalLessons: lessons,
        durationMinutes: prefs?.lessonDuration ?? 60,
        customDuration: false,
        pricePerLesson: null,
        currency: prefs?.currency ?? "EUR",
        paid: false,
        notes: "",
        startDate: null,
        endDate: null,
        displayName: generateDisplayName(mode, lessons, history),
      }
    )
  }

  async function updateBilling(patch: Partial<BillingContract>) {
    const base = await ensureDraftDefaults(billingDraft)
    let next: BillingContract = { ...base, ...patch }

    if (patch.mode || patch.totalLessons) {
      const history = student.billingHistory ?? []
      const mode = patch.mode ?? base.mode
      const lessons = patch.totalLessons ?? base.totalLessons
      next.displayName = generateDisplayName(mode, lessons, history)
    }

    setBillingDraft(next)
    setBillingDirty(!isContractEqual(next, editingContract))
  }

  async function saveBilling() {
    if (!billingDraft) return

    const durationOk =
      typeof billingDraft.durationMinutes === "number" &&
      billingDraft.durationMinutes > 0
    const priceOk =
      typeof billingDraft.pricePerLesson === "number" &&
      billingDraft.pricePerLesson > 0

    if (!durationOk || !priceOk) {
      alert("Veuillez renseigner une durée valide et un prix par leçon.")
      return
    }

    const history = [...(student.billingHistory ?? [])]

    if (editingContract) {
      const idx = history.findIndex((c) => c.id === editingContract.id)
      if (idx !== -1) {
        history[idx] = {
          ...editingContract,
          ...billingDraft,
          updatedAt: new Date().toISOString(),
        }
      }
    } else {
      history.unshift({ ...billingDraft })
    }

    await window.studentApi.updateStudent(student.id, {
      billingHistory: history,
    } as Partial<Student>)
    setBillingDraft(null)
    setEditingContract(null)
    setBillingDirty(false)
    await onUpdated()
  }

  async function deleteBilling(id: string) {
    if (!confirm("Supprimer ce contrat ? Cette action est irréversible.")) return
    const history = (student.billingHistory ?? []).filter((c) => c.id !== id)
    await window.studentApi.updateStudent(student.id, {
      billingHistory: history,
    } as Partial<Student>)
    await onUpdated()
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>Historique des contrats</h3>
        <button
          className="btn"
          onClick={async () => {
            setEditingContract(null)
            const draft = await ensureDraftDefaults(null)
            setBillingDraft(draft)
            setBillingDirty(true)
          }}
        >
          + Ajouter
        </button>
      </div>

      {sortedContracts.length === 0 && (
        <div className="empty">Aucun contrat pour l’instant.</div>
      )}

      {sortedContracts.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "16px",
              marginTop: "12px",
            }}
          >
            {currentContracts.map((c) => {
              const total = totalFor(c)
              const consumed = consumedFor(c, student)
              const pct = percentFor(c, student)
              const done = c.completed || pct === 100

              return (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    padding: "16px",
                    borderRadius: "var(--r-lg)",
                    minHeight: 230,
                  }}
                >
                  {done && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        padding: "4px 8px",
                        fontSize: 12,
                        fontWeight: 800,
                        border: "2px solid #22c55e",
                        color: "#22c55e",
                        borderRadius: 6,
                        transform: "rotate(6deg)",
                        background: "rgba(34,197,94,0.08)",
                      }}
                    >
                      TERMINÉ
                    </div>
                  )}

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      {c.displayName ??
                        (c.mode === "package"
                          ? `Pack de ${c.totalLessons ?? "?"} leçons`
                          : "Cours unitaire")}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      Durée&nbsp;: {c.durationMinutes ?? "—"} min
                      {c.pricePerLesson != null && (
                        <>
                          {" "}
                          • Prix/Leçon : {c.pricePerLesson} {getCurrencyLabel(c.currency)}
                          {c.currency ?? ""}
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        marginBottom: 6,
                      }}
                    >
                      Progression&nbsp;: {consumed}/{total} ({pct}%)
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: done
                            ? "linear-gradient(90deg,#22c55e,#16a34a)"
                            : "linear-gradient(90deg,rgba(229,9,20,0.7),rgba(229,9,20,0.35))",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>
                      {formatDate(c.createdAt)}
                    </div>

                    {c.paid ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#d8ffe0",
                        }}
                        title="Payé"
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 4,
                            background: "#22c55e",
                            color: "white",
                            display: "inline-grid",
                            placeItems: "center",
                            fontSize: 12,
                            lineHeight: 1,
                          }}
                        >
                          ✓
                        </span>
                        Payé
                      </span>
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>
                        Non payé
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      className="btn ghost"
                      onClick={() => {
                        setEditingContract(c)
                        setBillingDraft({ ...c })
                        setBillingDirty(false)
                      }}
                    >
                      Modifier
                    </button>
                    <button
                      className="btn ghost"
                      onClick={() => deleteBilling(c.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {billingPageCount > 1 && (
            <div
              className="pagination"
              style={{ marginTop: 12, justifyContent: "flex-end" }}
            >
              <span className="counter">
                Page {billingPage} / {billingPageCount}
              </span>
              <button
                className="btn ghost"
                disabled={billingPrevDisabled}
                onClick={() => setBillingPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </button>
              <button
                className="btn"
                disabled={billingNextDisabled}
                onClick={() => setBillingPage((p) => Math.min(billingPageCount, p + 1))}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {billingDraft && (
        <div className="modal-card" style={{ marginTop: 20 }}>
          <StudentBilling
            viewModel={{
              firstName: student.firstName,
              lastName: student.lastName,
              lessons: student.lessons ?? [],
              billing: billingDraft,
            }}
            onChange={(patch) => updateBilling(patch)}
          />
          <div className="actions">
            <button
              className="btn ghost"
              onClick={() => {
                setBillingDraft(null)
                setEditingContract(null)
                setBillingDirty(false)
              }}
            >
              Annuler
            </button>
            <button
              className="btn"
              disabled={!billingDirty}
              onClick={saveBilling}
            >
              💾 Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
