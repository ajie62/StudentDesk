import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Student, CEFR, BillingContract } from '../types'
import { formatDate, fullName } from '../utils'
import StudentForm from './StudentForm'
import LessonForm from './LessonForm'
import LessonCard from './LessonCard'
import StudentTracking from './StudentTracking'
import StudentBilling from './StudentBilling'
import { v4 as uuidv4 } from 'uuid'

const PAGE_SIZE_LESSONS = 10
const PAGE_SIZE_BILLING = 10

type Props = {
  studentId: string
  onDeleted: () => void
  onUpdated: () => void
}

/** Draft pour l’onglet Suivi */
type TrackingDraft = {
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
}

function initials(s: Student) {
  const a = (s.firstName || '').trim()[0] || ''
  const b = (s.lastName || '').trim()[0] || ''
  return (a + b).toUpperCase() || '•'
}

function makeTrackingDraft(s: Student): TrackingDraft {
  return {
    goals: s.goals ?? '',
    progress: s.progress ?? 0,
    cefr: {
      oral: s.cefr?.oral,
      ecrit: s.cefr?.ecrit,
      interaction: s.cefr?.interaction,
      grammaire: s.cefr?.grammaire,
      vocabulaire: s.cefr?.vocabulaire
    },
    tags: [...(s.tags ?? [])]
  }
}

function isTrackingEqual(d: TrackingDraft, s: Student): boolean {
  const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  return (
    (d.goals ?? '') === (s.goals ?? '') &&
    (d.progress ?? 0) === (s.progress ?? 0) &&
    eq(d.cefr ?? {}, s.cefr ?? {}) &&
    eq(d.tags ?? [], s.tags ?? [])
  )
}

function isContractEqual(a: BillingContract | null, b: BillingContract | null) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
}

/** Génération d’un nom unique pour chaque contrat */
function generateDisplayName(
  mode: 'single' | 'package',
  totalLessons: number,
  existing: BillingContract[]
): string {
  if (mode === 'single') {
    const base = 'Cours unitaire'
    const sameType = existing.filter(c => c.mode === 'single')
    return `${base} (${sameType.length + 1})`
  }

  if (mode === 'package') {
    const base = `Pack de ${totalLessons} leçons`
    const sameType = existing.filter(
      c => c.mode === 'package' && c.totalLessons === totalLessons
    )
    return `${base} (${sameType.length + 1})`
  }

  return 'Contrat'
}

export default function StudentDetail({ studentId, onDeleted, onUpdated }: Props) {
  const [student, setStudent] = useState<Student | null>(null)
  const [editing, setEditing] = useState(false)
  const [addingLesson, setAddingLesson] = useState(false)

  // pagination leçons
  const [page, setPage] = useState(1)

  // pagination contrats
  const [billingPage, setBillingPage] = useState(1)

  const [showFullDesc, setShowFullDesc] = useState(false)
  const [tab, setTab] = useState<'fiche' | 'suivi' | 'billing'>('fiche')

  // ---- Drafts Suivi
  const [trackDraft, setTrackDraft] = useState<TrackingDraft>({ goals: '', progress: 0, cefr: {}, tags: [] })
  const [trackDirty, setTrackDirty] = useState(false)

  // ---- Billing (historique)
  const [editingContract, setEditingContract] = useState<BillingContract | null>(null)
  const [billingDraft, setBillingDraft] = useState<BillingContract | null>(null)
  const [billingDirty, setBillingDirty] = useState(false)

  // clamp “voir plus”
  const descRef = useRef<HTMLDivElement | null>(null)
  const [needClamp, setNeedClamp] = useState(false)

  async function load(resetPage = false) {
    const s = await window.studentApi.getStudent(studentId)
    if (!Array.isArray(s.billingHistory)) (s as Student).billingHistory = []
    setStudent(s)

    if (resetPage) {
      setPage(1)
      setBillingPage(1)
      setTab('fiche') // reset tab quand on change d’étudiant
    }

    setTrackDraft(makeTrackingDraft(s))
    setTrackDirty(false)

    setEditingContract(null)
    setBillingDraft(null)
    setBillingDirty(false)

    setShowFullDesc(false)
  }

  useEffect(() => { load(true) }, [studentId])

  // remonter tout en haut immédiatement au changement d’étudiant
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [studentId])

  const latest = useMemo(() => {
    if (!student?.lessons?.length) return null
    return student.lessons[0]
  }, [student])

  const pageCountLessons = useMemo(() => {
    return Math.max(1, Math.ceil(((student?.lessons?.length) ?? 0) / PAGE_SIZE_LESSONS))
  }, [student])

  useEffect(() => {
    setPage(p => Math.min(p, pageCountLessons))
  }, [pageCountLessons])

  const currentLessons = useMemo(() => {
    const list = student?.lessons ?? []
    const start = (page - 1) * PAGE_SIZE_LESSONS
    const end = start + PAGE_SIZE_LESSONS
    return list.slice(start, end)
  }, [student, page])

  // --- Historique des contrats : tri + pagination
  const sortedContracts = useMemo(() => {
    const history = student?.billingHistory ?? []
    // du plus récent au plus ancien
    return [...history].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  }, [student])

  const billingPageCount = useMemo(() => {
    return Math.max(1, Math.ceil(sortedContracts.length / PAGE_SIZE_BILLING))
  }, [sortedContracts.length])

  useEffect(() => {
    setBillingPage(p => Math.min(p, billingPageCount))
  }, [billingPageCount])

  const currentContracts = useMemo(() => {
    const start = (billingPage - 1) * PAGE_SIZE_BILLING
    const end = start + PAGE_SIZE_BILLING
    return sortedContracts.slice(start, end)
  }, [sortedContracts, billingPage])

  // clamp 3 lignes
  useEffect(() => {
    if (!descRef.current) return
    const el = descRef.current
    const lh = parseFloat(getComputedStyle(el).lineHeight || '20')
    const maxH = lh * 3
    setNeedClamp(el.scrollHeight > maxH + 2)
  }, [student, showFullDesc])

  if (!student) return null

  const prevDisabled = page <= 1
  const nextDisabled = page >= pageCountLessons

  const billingPrevDisabled = billingPage <= 1
  const billingNextDisabled = billingPage >= billingPageCount

  async function handleListUpdated() {
    await load(true)
    onUpdated()
  }

  // ---- Tracking draft
  function updateTracking(patch: Partial<TrackingDraft>) {
    setTrackDraft(prev => {
      const next: TrackingDraft = {
        goals: patch.goals ?? prev.goals,
        progress: patch.progress ?? prev.progress,
        cefr: patch.cefr ? { ...(prev.cefr ?? {}), ...patch.cefr } : prev.cefr,
        tags: patch.tags ?? prev.tags
      }
      setTrackDirty(!isTrackingEqual(next, student!))
      return next
    })
  }

  async function saveTracking() {
    await window.studentApi.updateStudent(student!.id, {
      goals: trackDraft.goals,
      progress: trackDraft.progress,
      cefr: trackDraft.cefr,
      tags: trackDraft.tags
    } as Partial<Student>)
    await load(false)
    onUpdated()
  }

  function resetTracking() {
    setTrackDraft(makeTrackingDraft(student!))
    setTrackDirty(false)
  }

  // ---- Billing (historique)
  async function ensureDraftDefaults(prev: BillingContract | null): Promise<BillingContract> {
    const history = student?.billingHistory ?? []
    const mode = prev?.mode ?? 'single'
    const lessons = prev?.totalLessons ?? 1

    let prefs: { lessonDuration: number; currency: string } | null = null
    try {
      prefs = await window.studentApi.getSettings?.()
    } catch (e) {
      console.error("Impossible de charger les réglages", e)
    }

    return prev ?? {
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
      notes: '',
      startDate: null,
      endDate: null,
      displayName: generateDisplayName(mode, lessons, history)
    }
  }

  async function updateBilling(patch: Partial<BillingContract>) {
    const base = await ensureDraftDefaults(billingDraft) // ⚡ attendre les prefs par défaut
    let next: BillingContract = { ...base, ...patch }

    // Si le mode ou le total de leçons change → recalculer un displayName unique
    if (patch.mode || patch.totalLessons) {
        const history = student?.billingHistory ?? []
        const mode = patch.mode ?? base.mode
        const lessons = patch.totalLessons ?? base.totalLessons
        next.displayName = generateDisplayName(mode, lessons, history)
    }

    setBillingDraft(next)
    setBillingDirty(!isContractEqual(next, editingContract))
  }

  async function saveBilling() {
    if (!billingDraft) return

    // Validation obligatoire : durée et prix
    const durationOk = typeof billingDraft.durationMinutes === 'number' && billingDraft.durationMinutes > 0
    const priceOk = typeof billingDraft.pricePerLesson === 'number' && billingDraft.pricePerLesson > 0

    if (!durationOk || !priceOk) {
      alert('Veuillez renseigner une durée valide et un prix par leçon.')
      return
    }

    const history = [...(student!.billingHistory ?? [])]

    if (editingContract) {
      const idx = history.findIndex(c => c.id === editingContract.id)
      if (idx !== -1) {
        history[idx] = { ...editingContract, ...billingDraft, updatedAt: new Date().toISOString() }
      }
    } else {
      history.unshift({ ...billingDraft })
    }

    await window.studentApi.updateStudent(student!.id, { billingHistory: history } as Partial<Student>)
    await load(false)
    onUpdated()
  }

  async function deleteBilling(id: string) {
    if (!confirm('Supprimer ce contrat ? Cette action est irréversible.')) return
    const history = (student!.billingHistory ?? []).filter(c => c.id !== id)
    await window.studentApi.updateStudent(student!.id, { billingHistory: history } as Partial<Student>)
    await load(false)
    onUpdated()
  }

  /** ---- Helpers UI progression ---- */
  function totalFor(c: BillingContract) {
    return c.mode === 'package' ? (c.totalLessons || 0) : 1
  }
  function consumedFor(c: BillingContract) {
    if (typeof c.consumedLessons === 'number') return c.consumedLessons
    return (student?.lessons ?? []).filter(l => l.billingId === c.id).length
  }
  function percentFor(c: BillingContract) {
    const total = totalFor(c)
    if (!total) return 0
    const used = consumedFor(c)
    return Math.min(100, Math.round((used / total) * 100))
  }

  const openContracts = (student!.billingHistory ?? []).filter(c => !c.completed)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* === HERO === */}
      <div className="hero">
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div className={student!.isActive ? 'badge badge--active' : 'badge'}>
            {student!.isActive ? 'Actif' : 'Inactif'}
          </div>
          <div className="badge">Fiche créée {formatDate(student!.sheet.createdAt)}</div>
        </div>

        {/* Avatar + nom + desc */}
        <div className="hero-row" style={{ marginBottom: 12 }}>
          <div className="avatar avatar--lg hero-avatar" style={{ marginBottom: 8 }}>
            {student!.photo ? (
              <img src={student!.photo} alt={`Photo de ${fullName(student!)}`} />
            ) : (
              <div className="avatar__placeholder">{initials(student!)}</div>
            )}
          </div>

          <div className="hero-main">
            <h2 style={{ margin: '0 0 2px 0' }}>{fullName(student!)}</h2>

            <div
              ref={descRef}
              className={['hero-description', needClamp && !showFullDesc ? 'limited' : ''].join(' ')}
            >
              {student!.description || <span style={{ color: 'var(--muted)' }}>Aucune description.</span>}
            </div>

            {needClamp && (
              <div
                className="hero-description-toggle"
                onClick={() => setShowFullDesc(v => !v)}
              >
                {showFullDesc ? 'Voir moins' : 'Voir plus'}
              </div>
            )}
          </div>
        </div>

        {/* Onglets + actions globales */}
        <div className="sep" />
        <div className="tabs" style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className={`btn ghost ${tab === 'fiche' ? 'active' : ''}`} onClick={() => setTab('fiche')}>Fiche</button>
          <button className={`btn ghost ${tab === 'suivi' ? 'active' : ''}`} onClick={() => setTab('suivi')}>Suivi</button>
          <button className={`btn ghost ${tab === 'billing' ? 'active' : ''}`} onClick={() => setTab('billing')}>Cours & facturation</button>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={() => setEditing(true)}>Modifier l’étudiant</button>
            <button
              className="btn"
              onClick={async () => {
                if (confirm('Supprimer cet étudiant ?')) {
                  await window.studentApi.deleteStudent(student!.id)
                  onDeleted()
                }
              }}
            >
              Supprimer l’étudiant
            </button>
          </div>
        </div>

        {/* Contenu des onglets */}
        {tab === 'fiche' && (
          <>
            <div>
              <div className="hero-title">Dernière leçon</div>
              {latest ? (
                <div className="lesson-columns" style={{ marginTop: 12 }}>
                  <div>
                    <h4>Commentaire</h4>
                    <p>{latest.comment || <span style={{ color: 'var(--muted)' }}>—</span>}</p>
                  </div>
                  <div>
                    <h4>Devoirs</h4>
                    <p>{latest.homework || <span style={{ color: 'var(--muted)' }}>—</span>}</p>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', marginTop: 8 }}>Aucune leçon pour l’instant.</p>
              )}
            </div>
          </>
        )}

        {tab === 'suivi' && (
          <div style={{ marginTop: 8 }}>
            <StudentTracking
              viewModel={{
                firstName: student!.firstName,
                lastName: student!.lastName,
                lessons: student!.lessons ?? [],
                goals: trackDraft.goals ?? '',
                progress: trackDraft.progress ?? 0,
                cefr: trackDraft.cefr ?? {},
                tags: trackDraft.tags ?? []
              }}
              onChange={updateTracking}
            />
            <div className="actions" style={{ marginTop: 12, display: 'flex', alignItems: 'center' }}>
              {!trackDirty && (
                <span style={{ color: 'var(--muted)' }}>
                Aucune modification
                </span>
              )}

              {/* pousse les boutons complètement à droite */}
              <div style={{ flex: 1 }} />

              <div className="buttons" style={{ display: 'flex', gap: 8 }}>
                <button className="btn ghost" disabled={!trackDirty} onClick={resetTracking}>
                  Annuler
                </button>
                <button className="btn" disabled={!trackDirty} onClick={saveTracking}>
                  💾 Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'billing' && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Historique des contrats</h3>
              <button
                className="btn"
                onClick={async () => {
                    setEditingContract(null)
                    const draft = await ensureDraftDefaults(null) // ⚡ on attend les réglages
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
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '16px',
                    marginTop: '12px'
                  }}
                >
                  {currentContracts.map(c => {
                    const total = totalFor(c)
                    const consumed = consumedFor(c)
                    const pct = percentFor(c)
                    const done = c.completed || pct === 100

                    return (
                      <div
                        key={c.id}
                        className="card"
                        style={{
                          position: 'relative',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '16px',
                          borderRadius: 'var(--r-lg)',
                          minHeight: 230
                        }}
                      >
                        {done && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              padding: '4px 8px',
                              fontSize: 12,
                              fontWeight: 800,
                              border: '2px solid #22c55e',
                              color: '#22c55e',
                              borderRadius: 6,
                              transform: 'rotate(6deg)',
                              background: 'rgba(34,197,94,0.08)'
                            }}
                          >
                            TERMINÉ
                          </div>
                        )}

                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>
                            {c.displayName ?? (c.mode === 'package'
                              ? `Pack de ${c.totalLessons ?? '?'} leçons`
                              : 'Cours unitaire')}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                            Durée&nbsp;: {c.durationMinutes ?? '—'} min
                            {c.pricePerLesson != null && (
                              <> • Prix/Leçon&nbsp;: {c.pricePerLesson} {c.currency ?? ''}</>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                            Progression&nbsp;: {consumed}/{total} ({pct}%)
                          </div>
                          <div
                            style={{
                              height: 8,
                              borderRadius: 999,
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              overflow: 'hidden'
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: done
                                  ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                                  : 'linear-gradient(90deg,rgba(229,9,20,0.7),rgba(229,9,20,0.35))'
                              }}
                            />
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8
                          }}
                        >
                          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                            {formatDate(c.createdAt)}
                          </div>

                          {c.paid ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#d8ffe0'
                              }}
                              title="Payé"
                            >
                              <span
                                aria-hidden
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  background: '#22c55e',
                                  color: 'white',
                                  display: 'inline-grid',
                                  placeItems: 'center',
                                  fontSize: 12,
                                  lineHeight: 1
                                }}
                              >
                                ✓
                              </span>
                              Payé
                            </span>
                          ) : (
                            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Non payé</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
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
                          <button className="btn ghost" onClick={() => deleteBilling(c.id)}>
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {billingPageCount > 1 && (
                  <div className="pagination" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
                    <span className="counter">Page {billingPage} / {billingPageCount}</span>
                    <button
                      className="btn ghost"
                      disabled={billingPrevDisabled}
                      onClick={() => setBillingPage(p => Math.max(1, p - 1))}
                    >
                      Précédent
                    </button>
                    <button
                      className="btn"
                      disabled={billingNextDisabled}
                      onClick={() => setBillingPage(p => Math.min(billingPageCount, p + 1))}
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
                    firstName: student!.firstName,
                    lastName: student!.lastName,
                    lessons: student!.lessons ?? [],
                    billing: billingDraft
                  }}
                  onChange={(patch) => updateBilling(patch)}
                />
                <div className="actions">
                  <button
                    className="btn ghost"
                    onClick={() => { setBillingDraft(null); setEditingContract(null); setBillingDirty(false) }}
                  >
                    Annuler
                  </button>
                  <button className="btn" disabled={!billingDirty} onClick={saveBilling}>💾 Enregistrer</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* === Leçons visibles UNIQUEMENT dans "fiche" === */}
      {tab === 'fiche' && (
        <>
          <div className="lesson-toolbar">
            <div className="lesson-toolbar__title">Leçons</div>
            <div className="lesson-toolbar__actions">
              <div className="pagination">
                <span className="counter">Page {page} / {pageCountLessons}</span>
                <button className="btn ghost" disabled={prevDisabled} onClick={() => setPage(p => Math.max(1, p - 1))}>Précédent</button>
                <button className="btn" disabled={nextDisabled} onClick={() => setPage(p => Math.min(pageCountLessons, p + 1))}>Suivant</button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className={`btn ${openContracts.length === 0 ? 'disabled' : ''}`}
                  disabled={openContracts.length === 0}
                  onClick={() => setAddingLesson(true)}
                  title={openContracts.length === 0 ? 'Crée d’abord un contrat' : 'Ajouter une leçon'}
                >
                  Ajouter une leçon
                </button>
                <button
                  className="btn ghost"
                  onClick={() => setTab('billing')}
                  title="Créer un contrat"
                >
                  + Contrat
                </button>
              </div>
            </div>
          </div>

          {(student!.lessons?.length ?? 0) === 0 && <div className="empty">Aucune leçon pour cet étudiant.</div>}

          <div className="list">
            {currentLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                studentId={student!.id}
                lesson={lesson}
                allContracts={student!.billingHistory ?? []}   // 👈 correction
                onUpdated={handleListUpdated}
                onDelete={async () => {
                    if (confirm('Supprimer cette carte de leçon ?')) {
                    await window.studentApi.deleteLesson(student!.id, lesson.id)
                    await handleListUpdated()
                    }
                }}
              />
            ))}
          </div>

          {addingLesson && (
            <LessonForm
              studentId={student!.id}
              availableContracts={openContracts}
              onClose={() => setAddingLesson(false)}
              onSaved={async (payload) => {
                await window.studentApi.addLesson(student!.id, payload)
                setAddingLesson(false)
                await handleListUpdated()
              }}
            />
          )}
        </>
      )}

      {editing && (
        <StudentForm
          initial={student!}
          onClose={() => setEditing(false)}
          onSaved={async (patch) => {
            await window.studentApi.updateStudent(student!.id, patch as Partial<Student>)
            setEditing(false)
            await handleListUpdated()
          }}
        />
      )}
    </div>
  )
}