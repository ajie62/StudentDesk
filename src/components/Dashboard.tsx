import React, { useState, useMemo } from 'react'
import { Student, ActivityItem } from '../types'
import { fullName } from '../utils'

type Stats = {
  total: number
  active: number
  inactive: number
  lessons: number
  lastStudent?: Student
  lastLesson?: { student: Student; createdAt: string }
  topStudent?: Student
}

type Props = {
  stats: Stats
  events: ActivityItem[]
  onOpenStudent: (id: string) => void
}

const PAGE_SIZE = 10
const MAX_EVENTS = 20

export default function Dashboard({ stats, events, onOpenStudent }: Props) {
  const [page, setPage] = useState(1)

  // garder uniquement les 20 derniers
  const recent = useMemo(() => {
    return [...events]
      .sort((a, b) => b.when.localeCompare(a.when))
      .slice(0, MAX_EVENTS)
  }, [events])

  const pageCount = Math.max(1, Math.ceil(recent.length / PAGE_SIZE))
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    return recent.slice(start, end)
  }, [recent, page])

  const prevDisabled = page <= 1
  const nextDisabled = page >= pageCount

  return (
    <div className="dashboard">
      <h2>Tableau de bord</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div>
            <div className="stat-label">Étudiants total</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon accent">✅</div>
          <div>
            <div className="stat-label">Actifs</div>
            <div className="stat-value">{stats.active}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏸️</div>
          <div>
            <div className="stat-label">Inactifs</div>
            <div className="stat-value">{stats.inactive}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📘</div>
          <div>
            <div className="stat-label">Leçons total</div>
            <div className="stat-value">{stats.lessons}</div>
          </div>
        </div>
      </div>

      {stats.lastStudent && (
        <div className="stat-card wide">
          <div className="stat-icon">🆕</div>
          <div>
            <div className="stat-label">Dernier étudiant ajouté</div>
            <div className="stat-value">
              {fullName(stats.lastStudent)} –{' '}
              {new Date(stats.lastStudent.sheet?.createdAt || '').toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {stats.lastLesson && (
        <div className="stat-card wide">
          <div className="stat-icon">⏰</div>
          <div>
            <div className="stat-label">Dernière leçon</div>
            <div className="stat-value">
              {fullName(stats.lastLesson.student)} –{' '}
              {new Date(stats.lastLesson.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      {stats.topStudent && (
        <div className="stat-card wide">
          <div className="stat-icon">⭐</div>
          <div>
            <div className="stat-label">Étudiant le plus actif</div>
            <div className="stat-value">
              {fullName(stats.topStudent)} ({stats.topStudent.lessons.length} leçons)
            </div>
          </div>
        </div>
      )}

      {/* Activité récente */}
      <h2>Activité récente</h2>
      <div className="activity-list">
        {paginated.map(ev => (
          <div
            key={ev.id}
            className="activity-item"
            onClick={() => onOpenStudent(ev.studentId)}
            role="button"
            tabIndex={0}
          >
            <span className="activity-icon">
              {ev.kind.startsWith('student') ? '👤' : '📘'}
            </span>
            <span className="activity-label">{ev.label}</span>
            <span className="activity-date">
              {new Date(ev.when).toLocaleDateString()}
            </span>
          </div>
        ))}
        {!paginated.length && <div className="empty">Aucune activité récente.</div>}
      </div>

      {pageCount > 1 && (
        <div className="pagination" style={{ marginTop: '12px' }}>
          <button
            className="btn ghost"
            disabled={prevDisabled}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Précédent
          </button>
          <span className="counter">Page {page} / {pageCount}</span>
          <button
            className="btn"
            disabled={nextDisabled}
            onClick={() => setPage(p => Math.min(pageCount, p + 1))}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
