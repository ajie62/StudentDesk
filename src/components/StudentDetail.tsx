import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Student, CEFR } from '../types'
import { formatDate, fullName } from '../utils'
import StudentForm from './StudentForm'
import LessonForm from './LessonForm'
import LessonCard from './LessonCard'
import StudentTracking from './StudentTracking'

const PAGE_SIZE = 10

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

function makeDraftFromStudent(s: Student): TrackingDraft {
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

function isDraftEqualToStudent(d: TrackingDraft, s: Student): boolean {
  const eq = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b)
  return (
    (d.goals ?? '') === (s.goals ?? '') &&
    (d.progress ?? 0) === (s.progress ?? 0) &&
    eq(d.cefr ?? {}, s.cefr ?? {}) &&
    eq(d.tags ?? [], s.tags ?? [])
  )
}

export default function StudentDetail({ studentId, onDeleted, onUpdated }: Props) {
  const [student, setStudent] = useState<Student | null>(null)
  const [editing, setEditing] = useState(false)
  const [addingLesson, setAddingLesson] = useState(false)
  const [page, setPage] = useState(1)
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [tab, setTab] = useState<'fiche' | 'suivi'>('fiche')

  const [draft, setDraft] = useState<TrackingDraft>({
    goals: '',
    progress: 0,
    cefr: {},
    tags: []
  })
  const [dirty, setDirty] = useState(false)

  // ref pour mesurer la hauteur du texte description
  const descRef = useRef<HTMLDivElement | null>(null)
  const [needClamp, setNeedClamp] = useState(false)

  async function load(resetPage = false) {
    const s = await window.studentApi.getStudent(studentId)
    setStudent(s)
    if (resetPage) setPage(1)
    setDraft(makeDraftFromStudent(s))
    setDirty(false)
    setShowFullDesc(false)
  }

  useEffect(() => { load(true) }, [studentId])

  // Quand la fiche monte, forcer le scroll en haut
  useEffect(() => {
    setShowFullDesc(false)
    window.scrollTo({ top: 0 }) // 👈 scroll immédiat, uniquement à l’affichage
  }, [])

  const latest = useMemo(() => {
    if (!student?.lessons?.length) return null
    return student.lessons[0]
  }, [student])

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil((student?.lessons?.length ?? 0) / PAGE_SIZE))
  }, [student])

  useEffect(() => {
    setPage(p => Math.min(p, pageCount))
  }, [pageCount])

  const currentLessons = useMemo(() => {
    const list = student?.lessons ?? []
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return list.slice(start, end)
  }, [student, page])

  // mesure si le texte dépasse le clamp (≈3 lignes)
  useEffect(() => {
    if (!descRef.current) return
    const el = descRef.current
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '20')
    const maxHeight = lineHeight * 3
    setNeedClamp(el.scrollHeight > maxHeight + 2) // tolérance
  }, [student, showFullDesc])

  if (!student) return null

  const prevDisabled = page <= 1
  const nextDisabled = page >= pageCount

  async function handleListUpdated() {
    await load(true)
    onUpdated()
  }

  function updateDraft(patch: Partial<TrackingDraft>) {
    setDraft(prev => {
      const next: TrackingDraft = {
        goals: patch.goals ?? prev.goals,
        progress: patch.progress ?? prev.progress,
        cefr: patch.cefr ? { ...(prev.cefr ?? {}), ...patch.cefr } : prev.cefr,
        tags: patch.tags ?? prev.tags
      }
      setDirty(!isDraftEqualToStudent(next, student!))
      return next
    })
  }

  async function saveDraft() {
    await window.studentApi.updateStudent(student!.id, {
      goals: draft.goals,
      progress: draft.progress,
      cefr: draft.cefr,
      tags: draft.tags
    } as any)
    await load(false)
    onUpdated()
  }

  function resetDraft() {
    setDraft(makeDraftFromStudent(student!))
    setDirty(false)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="hero">
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div className={student!.isActive ? 'badge badge--active' : 'badge'}>
            {student!.isActive ? 'Actif' : 'Inactif'}
          </div>
          <div className="badge">Fiche créée {formatDate(student!.sheet.createdAt)}</div>
        </div>

        {/* Avatar + name/desc row */}
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

        {/* Onglets */}
        <div className="sep" />
        <div className="tabs" style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <button
            className={`btn ghost ${tab === 'fiche' ? 'active' : ''}`}
            onClick={() => setTab('fiche')}
          >
            Fiche
          </button>
          <button
            className={`btn ghost ${tab === 'suivi' ? 'active' : ''}`}
            onClick={() => setTab('suivi')}
          >
            Suivi
          </button>
        </div>

        {tab === 'fiche' ? (
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

            <div style={{ height: 12 }} />
            <div className="actions">
              <button className="btn" onClick={() => setEditing(true)}>Modifier l’étudiant</button>
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
          </>
        ) : (
          <div style={{ marginTop: 8 }}>
            <StudentTracking
              viewModel={{
                firstName: student!.firstName,
                lastName: student!.lastName,
                lessons: student!.lessons,
                goals: draft.goals ?? '',
                progress: draft.progress ?? 0,
                cefr: draft.cefr ?? {},
                tags: draft.tags ?? []
              }}
              onChange={updateDraft}
            />

            <div className="actions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button className="btn" disabled={!dirty} onClick={saveDraft}>
                💾 Enregistrer
              </button>
              <button className="btn ghost" disabled={!dirty} onClick={resetDraft}>
                Annuler
              </button>
              {!dirty && (
                <span style={{ alignSelf: 'center', color: 'var(--muted)' }}>
                  Aucune modification
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toolbar: Leçons */}
      <div className="lesson-toolbar">
        <div className="lesson-toolbar__title">Leçons</div>
        <div className="lesson-toolbar__actions">
          <div className="pagination">
            <span className="counter">Page {page} / {pageCount}</span>
            <button
              className="btn ghost"
              disabled={prevDisabled}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Précédent
            </button>
            <button
              className="btn"
              disabled={nextDisabled}
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
            >
              Suivant
            </button>
          </div>
          <button className="btn" onClick={() => setAddingLesson(true)}>
            Ajouter une leçon
          </button>
        </div>
      </div>

      {student!.lessons.length === 0 && (
        <div className="empty">Aucune leçon pour cet étudiant.</div>
      )}

      <div className="list">
        {currentLessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            studentId={student!.id}
            lesson={lesson}
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

      {editing && (
        <StudentForm
          initial={student!}
          onClose={() => setEditing(false)}
          onSaved={async (patch) => {
            await window.studentApi.updateStudent(student!.id, patch as any)
            setEditing(false)
            await handleListUpdated()
          }}
        />
      )}

      {addingLesson && (
        <LessonForm
          studentId={student!.id}
          onClose={() => setAddingLesson(false)}
          onSaved={async (payload) => {
            await window.studentApi.addLesson(student!.id, payload)
            setAddingLesson(false)
            await handleListUpdated()
          }}
        />
      )}
    </div>
  )
}