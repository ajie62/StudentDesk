import React, { useEffect, useMemo, useState } from 'react'
import { Student, ActivityItem } from './types'
import { fullName } from './utils'
import StudentForm from './components/StudentForm'
import StudentDetail from './components/StudentDetail'
import Dashboard from './components/Dashboard'
import Fuse from 'fuse.js'
import './styles.css'

function initialsOf(s: Pick<Student, 'firstName' | 'lastName'>) {
  const a = (s.firstName || '').trim()[0] || ''
  const b = (s.lastName || '').trim()[0] || ''
  return (a + b).toUpperCase() || '•'
}

type Stats = {
  total: number
  active: number
  inactive: number
  lessons: number
  lastStudent?: Student
  lastLesson?: { student: Student; createdAt: string }
  topStudent?: Student
}

type Toast = { id: string; text: string }

export default function App() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDashboard, setShowDashboard] = useState(true)

  const [q, setQ] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const [showNew, setShowNew] = useState(false)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [closingMenu, setClosingMenu] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 900)

  // Toasts discrets
  const [toasts, setToasts] = useState<Toast[]>([])
  function pushToast(text: string) {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, text }])
    window.setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, 2200)
  }

  async function refresh() {
    const list = await window.studentApi.listStudents()
    list.sort((a, b) => a.firstName.localeCompare(b.firstName))
    setStudents(list)
    if (!list.length) {
      setSelectedId(null)
      setShowDashboard(true)
    }
  }

  useEffect(() => {
    refresh()
    window.studentApi.onAppFocus(() => refresh())
  }, [])

  // Toasts depuis main (store:saved)
  useEffect(() => {
    const unsubscribe = window.studentApi.onStoreSaved?.(({ action, icloud }) => {
      const where = icloud ? '☁️ iCloud' : '💾 local'
      let label = 'Sauvegarde effectuée'
      if (action?.startsWith('students')) label = 'Étudiant enregistré'
      if (action === 'students:delete') label = 'Étudiant supprimé'
      if (action?.startsWith('lessons')) label = 'Leçon enregistrée'
      if (action === 'lessons:delete') label = 'Leçon supprimée'
      pushToast(`${label} • ${where}`)
    })
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
  }, [])

  function closeMenuSmooth() {
    setClosingMenu(true)
    window.setTimeout(() => {
      setClosingMenu(false)
      setMobileMenuOpen(false)
    }, 250)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileMenuOpen) closeMenuSmooth()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileMenuOpen])

  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < 900
      setIsMobile(mobile)
      if (!mobile) {
        setMobileMenuOpen(false)
        setClosingMenu(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Recherche fuzzy + filtre
  const filtered = useMemo(() => {
    let results = students
    const term = q.trim()

    if (term) {
      const fuse = new Fuse(students, {
        keys: [
          { name: 'firstName', weight: 0.5 },
          { name: 'lastName', weight: 0.5 },
          { name: 'description', weight: 0.3 }
        ],
        threshold: 0.35,
        ignoreLocation: true
      })
      results = fuse.search(term).map(r => r.item)
    }

    if (filterActive === 'active') results = results.filter(s => s.isActive)
    else if (filterActive === 'inactive') results = results.filter(s => !s.isActive)

    return results
  }, [q, students, filterActive])

  // Stats
  const stats: Stats = useMemo(() => {
    const total = students.length
    const active = students.filter(s => s.isActive).length
    const inactive = total - active
    let lessons = 0
    let lastLesson: Stats['lastLesson']
    let topStudent: Student | undefined

    students.forEach(s => {
      lessons += s.lessons.length
      if (s.lessons.length) {
        const recent = [...s.lessons].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        if (!lastLesson || recent.createdAt > lastLesson.createdAt) {
          lastLesson = { student: s, createdAt: recent.createdAt }
        }
      }
      if (!topStudent || s.lessons.length > topStudent.lessons.length) {
        topStudent = s
      }
    })

    const lastStudent = [...students].sort((a, b) => b.sheet.createdAt.localeCompare(a.sheet.createdAt))[0]

    return { total, active, inactive, lessons, lastStudent, lastLesson, topStudent }
  }, [students])

  // Génération d’événements récents
  const events: ActivityItem[] = useMemo(() => {
    const evts: ActivityItem[] = []

    students.forEach(s => {
      // Création
      evts.push({
        id: `stu-${s.id}-created`,
        kind: 'student:create',
        label: `${fullName(s)} ajouté`,
        when: s.sheet.createdAt,
        studentId: s.id
      })

      // Mise à jour
      if (s.updatedAt) {
        evts.push({
          id: `stu-${s.id}-updated`,
          kind: 'student:update',
          label: `${fullName(s)} modifié`,
          when: s.updatedAt,
          studentId: s.id
        })
      }

      // Suppression
      if (s.deletedAt) {
        evts.push({
          id: `stu-${s.id}-deleted`,
          kind: 'student:delete',
          label: `${fullName(s)} supprimé`,
          when: s.deletedAt,
          studentId: s.id
        })
      }

      // Leçons
      s.lessons.forEach(l => {
        // Création
        evts.push({
          id: `les-${s.id}-${l.id}-created`,
          kind: 'lesson:add',
          label: `Leçon pour ${fullName(s)}`,
          when: l.createdAt,
          studentId: s.id
        })

        // Mise à jour
        if (l.updatedAt) {
          evts.push({
            id: `les-${s.id}-${l.id}-updated`,
            kind: 'lesson:update',
            label: `Leçon modifiée pour ${fullName(s)}`,
            when: l.updatedAt,
            studentId: s.id
          })
        }

        // Suppression
        if (l.deletedAt) {
          evts.push({
            id: `les-${s.id}-${l.id}-deleted`,
            kind: 'lesson:delete',
            label: `Leçon supprimée pour ${fullName(s)}`,
            when: l.deletedAt,
            studentId: s.id
          })
        }
      })
    })

    return evts.sort((a, b) => b.when.localeCompare(a.when))
  }, [students])

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''} ${closingMenu ? 'closing' : ''}`}>
        <div className={`header ${isMobile ? '' : 'window-drag'}`}>
          <div className="brand window-no-drag">STUDENTDESK</div>
          <div style={{ flex: 1 }} />
          {!isMobile && (
            <button
              className="btn icon window-no-drag"
              title="Nouvel étudiant"
              aria-label="Nouvel étudiant"
              onClick={() => setShowNew(true)}
            >
              +
            </button>
          )}
        </div>

        <button
          className="btn ghost"
          style={{ marginBottom: '16px', width: '100%' }}
          onClick={() => { setSelectedId(null); setShowDashboard(true) }}
        >
          🏠 Accueil
        </button>

        {/* 👇 Bouton import CSV */}
        <button
          className="btn ghost"
          style={{ marginBottom: '16px', width: '100%' }}
          onClick={async () => {
            const result = await window.studentApi.importCSV()
            if (result?.count) {
              pushToast(`Importé ${result.count} étudiants • 💾 local`)
              refresh()
            }
          }}
        >
          📂 Importer CSV
        </button>

        {/* Texte d’aide sur le schéma CSV */}
        <div style={{ 
            fontSize: '11px', 
            color: '#aaa', 
            marginBottom: '16px', 
            paddingLeft: '4px',
            lineHeight: 1.4
        }}>
            Schéma du CSV attendu :<br/>
            <code>firstName, lastName, description, email, isActive</code>
        </div>

        <input
          className="search"
          placeholder="Rechercher des étudiants…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher des étudiants"
        />

        <div className="filter-row">
          <button
            className={`btn ghost ${filterActive === 'all' ? 'active' : ''}`}
            onClick={() => setFilterActive('all')}
          >
            Tous
          </button>
          <button
            className={`btn ghost ${filterActive === 'active' ? 'active' : ''}`}
            onClick={() => setFilterActive('active')}
          >
            Actifs
          </button>
          <button
            className={`btn ghost ${filterActive === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterActive('inactive')}
          >
            Inactifs
          </button>
        </div>

        {filtered.map(s => (
          <div
            key={s.id}
            className={['student-item', selectedId === s.id ? 'active' : ''].join(' ')}
            onClick={() => {
              setSelectedId(s.id)
              setShowDashboard(false)
              if (mobileMenuOpen) closeMenuSmooth()
            }}
            role="button"
            tabIndex={0}
          >
            <div className="student-row">
              <div className="avatar avatar--sm" aria-hidden="true">
                {s.photo ? (
                  <img src={s.photo} alt="" />
                ) : (
                  <div className="avatar__placeholder">{initialsOf(s)}</div>
                )}
              </div>
              <div className="student-meta">
                <div className="student-name">{fullName(s)}</div>
                <div className="student-state">{s.isActive ? 'Actif' : 'Inactif'}</div>
              </div>
            </div>
          </div>
        ))}

        {!filtered.length && <div className="empty">Aucun étudiant trouvé.</div>}
      </aside>

      {/* Main content */}
      <main className="content">
        <div className="title-drag window-drag" />
        <div className="mobile-topbar window-drag">
          <button
            className={`burger ${mobileMenuOpen && !closingMenu ? 'active' : ''}`}
            onClick={() => {
              if (mobileMenuOpen) closeMenuSmooth()
              else setMobileMenuOpen(true)
            }}
            aria-label="Ouvrir le menu"
          >
            <span />
            <span />
            <span />
          </button>
          <div className="brand window-no-drag">STUDENTDESK</div>
          <div style={{ flex: 1 }} />
          <button
            className="btn small window-no-drag"
            onClick={() => {
              if (mobileMenuOpen) closeMenuSmooth()
              setShowNew(true)
            }}
            aria-label="Créer un étudiant"
          >
            +
          </button>
        </div>

        <div className="container">
          {showDashboard ? (
            <Dashboard
              stats={stats}
              events={events}
              onOpenStudent={(id) => {
                setSelectedId(id)
                setShowDashboard(false)
              }}
            />
          ) : !selectedId ? (
            <div className="empty">Sélectionnez un étudiant pour afficher sa fiche.</div>
          ) : (
            <StudentDetail
              studentId={selectedId}
              onDeleted={() => { setSelectedId(null); setShowDashboard(true); refresh() }}
              onUpdated={() => refresh()}
            />
          )}
        </div>

        {/* Toasts */}
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className="toast">{t.text}</div>
          ))}
        </div>
      </main>

      {showNew && (
        <StudentForm
          onClose={() => setShowNew(false)}
          onSaved={async (payload) => {
            await window.studentApi.createStudent(payload as any)
            setShowNew(false)
            await refresh()
          }}
        />
      )}

      {mobileMenuOpen && (
        <div
          className={`overlay ${closingMenu ? 'fade-out' : 'fade-in'}`}
          onClick={closeMenuSmooth}
        />
      )}
    </div>
  )
}