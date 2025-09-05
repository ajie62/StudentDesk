import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Student } from '../types'
import { formatDate, fullName } from '../utils'
import StudentForm from './StudentForm'
import LessonForm from './LessonForm'
import LessonCard from './LessonCard'

const PAGE_SIZE = 10

type Props = {
  studentId: string
  onDeleted: () => void
  onUpdated: () => void
}

function initials(s: Student) {
  const a = (s.firstName || '').trim()[0] || ''
  const b = (s.lastName || '').trim()[0] || ''
  return (a + b).toUpperCase() || '•'
}

export default function StudentDetail({ studentId, onDeleted, onUpdated }: Props) {
  const [student, setStudent] = useState<Student | null>(null)
  const [editing, setEditing] = useState(false)
  const [addingLesson, setAddingLesson] = useState(false)
  const [page, setPage] = useState(1)

  // Description toggle
  const [descExpanded, setDescExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)
  const descRef = useRef<HTMLDivElement>(null)

  async function load(resetPage = false) {
    const s = await window.studentApi.getStudent(studentId)
    setStudent(s)
    if (resetPage) setPage(1)
  }

  useEffect(() => { load(true) }, [studentId])

  // Vérifie si description dépasse la limite
  useEffect(() => {
    if (descRef.current) {
      setCanExpand(descRef.current.scrollHeight > 140)
    }
  }, [student?.description])

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

  if (!student) return null

  const prevDisabled = page <= 1
  const nextDisabled = page >= pageCount

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="hero">
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div className={student.isActive ? 'badge badge--active' : 'badge'}>
            {student.isActive ? 'Actif' : 'Inactif'}
          </div>
          <div className="badge">Fiche créée {formatDate(student.sheet.createdAt)}</div>
        </div>

        {/* Avatar + name/desc row */}
        <div className="hero-row">
          <div className="avatar avatar--lg">
            {student.photo ? (
              <img src={student.photo} alt={`Photo de ${fullName(student)}`} />
            ) : (
              <div className="avatar__placeholder">{initials(student)}</div>
            )}
          </div>

          <div className="hero-main">
            <h2 style={{ margin: '0 0 6px 0' }}>{fullName(student)}</h2>
            <div
              ref={descRef}
              className={`hero-description ${!descExpanded && canExpand ? 'limited' : ''}`}
            >
              {student.description || 'Aucune description.'}
            </div>
            {canExpand && (
              <span
                className="hero-description-toggle"
                onClick={() => setDescExpanded(x => !x)}
              >
                {descExpanded ? 'Voir moins' : 'Voir plus'}
              </span>
            )}
          </div>
        </div>

        <div className="sep" />

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
                await window.studentApi.deleteStudent(student.id)
                onDeleted()
              }
            }}
          >
            Supprimer l’étudiant
          </button>
        </div>
      </div>

      {/* Toolbar: Leçons + pagination + bouton ajouter */}
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

      {student.lessons.length === 0 && (
        <div className="empty">Aucune leçon pour cet étudiant.</div>
      )}

      <div className="list">
        {currentLessons.map(lesson => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onDelete={async () => {
              if (confirm('Supprimer cette carte de leçon ?')) {
                await window.studentApi.deleteLesson(student.id, lesson.id)
                await load()
                onUpdated()
              }
            }}
          />
        ))}
      </div>

      {editing && (
        <StudentForm
          initial={student}
          onClose={() => setEditing(false)}
          onSaved={async (patch) => {
            await window.studentApi.updateStudent(student.id, patch as any)
            setEditing(false)
            await load()
            onUpdated()
          }}
        />
      )}

      {addingLesson && (
        <LessonForm
          onClose={() => setAddingLesson(false)}
          onSaved={async (payload) => {
            await window.studentApi.addLesson(student.id, payload)
            setAddingLesson(false)
            await load(true)
            onUpdated()
          }}
        />
      )}
    </div>
  )
}