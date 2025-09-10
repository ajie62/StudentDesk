import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react'
import { Student, ActivityItem } from './types'
import { fullName } from './utils'
import { Sidebar } from './components/Sidebar'
import StudentForm from './components/StudentForm'
import StudentDetail from './components/StudentDetail'
import Changelog from './components/Changelog'
import SettingsPage from "./components/Settings"
import Fuse from 'fuse.js'
import './styles.css'

const Dashboard = lazy(() => import('./components/Dashboard'))

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
  const [showChangelog, setShowChangelog] = useState(false)

  const [q, setQ] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const [showNew, setShowNew] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [closingMenu, setClosingMenu] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 900)

  const [toasts, setToasts] = useState<Toast[]>([])
  function pushToast(text: string) {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, text }])
    window.setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, 3000)
  }

  const [updateReady, setUpdateReady] = useState(false)
  const [version, setVersion] = useState("")

  async function refresh() {
    const list = await window.studentApi.listStudents()
    list.sort((a, b) => a.firstName.localeCompare(b.firstName))
    setStudents(list)
    if (!list.length) {
      setSelectedId(null)
      setShowDashboard(true)
      setShowChangelog(false)
    }
  }

  useEffect(() => {
    refresh()
    window.studentApi.onAppFocus(() => refresh())
    ;(async () => {
      try {
        const v = await window.studentApi.getVersion()
        setVersion(v || "")
      } catch {
        setVersion("")
      }
    })()
  }, [])

  useEffect(() => {
    const unsubscribe = window.studentApi.onStoreSaved?.(({ action, icloud }) => {
      const where = icloud ? '☁️ iCloud' : '💾 local'
      let label = 'Sauvegarde effectuée'
      if (action?.startsWith('students')) label = 'Étudiant enregistré'
      if (action === 'students:delete') label = 'Étudiant supprimé'
      if (action?.startsWith('lessons')) label = 'Leçon enregistrée'
      if (action === 'lessons:delete') label = 'Leçon supprimée'
      if (action === 'settings') label = 'Réglages sauvegardés'
      pushToast(`${label} • ${where}`)
    })
    return () => { if (typeof unsubscribe === 'function') unsubscribe() }
  }, [])

  useEffect(() => {
    window.studentApi.onUpdate?.("update:checking", () => {
      pushToast("🔄 Vérification des mises à jour...")
      setUpdateReady(false)
    })
    window.studentApi.onUpdate?.("update:available", () => {
      pushToast("⬇️ Mise à jour disponible, téléchargement...")
      setUpdateReady(false)
    })
    window.studentApi.onUpdate?.("update:none", () => {
      pushToast("✅ Aucune mise à jour disponible")
      setUpdateReady(false)
    })
    window.studentApi.onUpdate?.("update:downloaded", () => {
      pushToast("📦 Mise à jour prête à installer")
      setUpdateReady(true)
    })
    window.studentApi.onUpdate?.("update:error", (_evt, err) => {
      pushToast("❌ Erreur de mise à jour: " + err)
      setUpdateReady(false)
    })
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

  const events: ActivityItem[] = useMemo(() => {
    const evts: ActivityItem[] = []

    students.forEach(s => {
      evts.push({
        id: `stu-${s.id}-created`,
        kind: 'student:create',
        label: `${fullName(s)} ajouté`,
        when: s.sheet.createdAt,
        studentId: s.id
      })
      if (s.updatedAt) {
        evts.push({
          id: `stu-${s.id}-updated`,
          kind: 'student:update',
          label: `${fullName(s)} modifié`,
          when: s.updatedAt,
          studentId: s.id
        })
      }
      if (s.deletedAt) {
        evts.push({
          id: `stu-${s.id}-deleted`,
          kind: 'student:delete',
          label: `${fullName(s)} supprimé`,
          when: s.deletedAt,
          studentId: s.id
        })
      }
      s.lessons.forEach(l => {
        evts.push({
          id: `les-${s.id}-${l.id}-created`,
          kind: 'lesson:add',
          label: `Leçon pour ${fullName(s)}`,
          when: l.createdAt,
          studentId: s.id
        })
        if (l.updatedAt) {
          evts.push({
            id: `les-${s.id}-${l.id}-updated`,
            kind: 'lesson:update',
            label: `Leçon modifiée pour ${fullName(s)}`,
            when: l.updatedAt,
            studentId: s.id
          })
        }
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
      <Sidebar
        isMobile={isMobile}
        mobileMenuOpen={mobileMenuOpen}
        closingMenu={closingMenu}
        setMobileMenuOpen={setMobileMenuOpen}
        closeMenuSmooth={closeMenuSmooth}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        students={filtered}
        filterActive={filterActive}
        setFilterActive={setFilterActive}
        setShowDashboard={setShowDashboard}
        setShowChangelog={setShowChangelog}
        setShowSettings={setShowSettings}
        setShowNew={setShowNew}
        q={q}
        setQ={setQ}
        refresh={refresh}
        pushToast={pushToast}
      />

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
        </div>

        <div className="container">
          {showChangelog ? (
            <Changelog />
          ) : showDashboard ? (
            <Suspense fallback={<div className="empty">Chargement du tableau de bord...</div>}>
              <Dashboard
                stats={stats}
                students={students}
                events={events}
                onOpenStudent={(id) => {
                  setSelectedId(id)
                  setShowDashboard(false)
                  setShowChangelog(false)
                  setShowSettings(false)
                }}
              />
            </Suspense>
          ) : showSettings ? (
            <SettingsPage/>
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

        {/* ✅ Version affichée avec lien vers changelog */}
        <div
          className="app-version window-no-drag"
          onClick={() => {
            console.log('Clic sur version détecté !')
            setSelectedId(null)
            setShowDashboard(false)
            setShowChangelog(true)
          }}
        >
          v{version}
        </div>

        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className="toast">{t.text}</div>
          ))}
        </div>

        {updateReady && (
          <div className="update-banner">
            🚀 Nouvelle version téléchargée&nbsp;
            <button
              className="btn small"
              onClick={() => window.studentApi.installUpdateNow()}
            >
              Mettre à jour maintenant
            </button>
          </div>
        )}
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