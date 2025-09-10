import { Settings, Plus } from "lucide-react"
import { Student } from "../types"
import { initialsOf, fullName } from "../utils"

interface SidebarProps {
  isMobile: boolean
  mobileMenuOpen: boolean
  closingMenu: boolean
  setMobileMenuOpen: (v: boolean) => void
  closeMenuSmooth: () => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  students: Student[]
  filterActive: "all" | "active" | "inactive"
  setFilterActive: (f: "all" | "active" | "inactive") => void
  setShowDashboard: (v: boolean) => void
  setShowChangelog: (v: boolean) => void
  setShowSettings: (v: boolean) => void
  setShowNew: (v: boolean) => void
  q: string
  setQ: (q: string) => void
  refresh: () => void
  pushToast: (msg: string) => void
}

export function Sidebar({
  isMobile,
  mobileMenuOpen,
  closingMenu,
  closeMenuSmooth,
  setMobileMenuOpen,
  selectedId,
  setSelectedId,
  students,
  filterActive,
  setFilterActive,
  setShowDashboard,
  setShowChangelog,
  setShowSettings,
  setShowNew,
  q,
  setQ,
  refresh,
  pushToast,
}: SidebarProps) {
  return (
    <>
      {isMobile && mobileMenuOpen && (
        <div
          className={`overlay ${closingMenu ? "fade-out" : "fade-in"}`}
          onClick={closeMenuSmooth}
        />
      )}

      <aside
        className={`sidebar ${mobileMenuOpen ? "open" : ""} ${
          closingMenu ? "closing" : ""
        }`}
      >
        <div className="header window-drag">
            <div className="brand window-no-drag">STUDENTDESK</div>
            <div style={{ flex: 1 }} />
            <button
                className="btn icon window-no-drag"
                title="Réglages"
                aria-label="Réglages"
                onClick={() => {
                setSelectedId(null);
                setShowDashboard(false);
                setShowChangelog(false);
                setShowNew(false);
                setShowSettings(true);
                if (isMobile) closeMenuSmooth();
                }}
            >
                <Settings size={14} />
            </button>
            <button
                className="btn icon window-no-drag"
                title="Nouvel étudiant"
                aria-label="Nouvel étudiant"
                onClick={() => {
                setShowNew(true);
                setShowDashboard(false);
                setShowChangelog(false);
                setShowSettings(false);
                if (isMobile) closeMenuSmooth();
                }}
            >
                <Plus size={14} />
            </button>
        </div>

        {/* 🏠 Accueil */}
        <button
          className="btn ghost"
          style={{ marginBottom: "16px", width: "100%" }}
          onClick={() => {
            setSelectedId(null)
            setShowDashboard(true)
            setShowChangelog(false)
            setShowSettings(false)
            if (isMobile) closeMenuSmooth()
          }}
        >
          🏠 Accueil
        </button>

        {/* 📂 Import CSV */}
        <button
          className="btn ghost"
          style={{ marginBottom: "16px", width: "100%" }}
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

        {/* 🔎 Recherche */}
        <input
          className="search"
          placeholder="Rechercher des étudiants…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Rechercher des étudiants"
        />

        {/* Filtres */}
        <div className="filter-row">
          <button
            className={`btn ghost ${filterActive === "all" ? "active" : ""}`}
            onClick={() => setFilterActive("all")}
          >
            Tous
          </button>
          <button
            className={`btn ghost ${filterActive === "active" ? "active" : ""}`}
            onClick={() => setFilterActive("active")}
          >
            Actifs
          </button>
          <button
            className={`btn ghost ${filterActive === "inactive" ? "active" : ""}`}
            onClick={() => setFilterActive("inactive")}
          >
            Inactifs
          </button>
        </div>

        {/* Liste étudiants */}
        {students.map((s) => (
          <div
            key={s.id}
            className={[
              "student-item",
              selectedId === s.id ? "active" : "",
            ].join(" ")}
            onClick={() => {
              setSelectedId(s.id)
              setShowDashboard(false)
              setShowChangelog(false)
              setShowSettings(false)
              if (isMobile) closeMenuSmooth()
            }}
            role="button"
            tabIndex={0}
          >
            <div className="student-row">
              <div className="avatar avatar--sm" aria-hidden="true">
                {s.photo ? (
                  <img src={s.photo} alt="" />
                ) : (
                  <div className="avatar__placeholder">
                    {initialsOf(s)}
                  </div>
                )}
              </div>
              <div className="student-meta">
                <div className="student-name">{fullName(s)}</div>
                <div className="student-state">
                  {s.isActive ? "Actif" : "Inactif"}
                </div>
              </div>
            </div>
          </div>
        ))}

        {!students.length && (
          <div className="empty">Aucun étudiant trouvé.</div>
        )}
      </aside>
    </>
  )
}
