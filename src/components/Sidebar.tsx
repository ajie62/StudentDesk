import { Settings, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { fullName, initialsOf } from "../utils";
import { Student } from "../types";

type FilterKind = "all" | "active" | "inactive" | "contracts";

interface SidebarProps {
  students: Student[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setShowDashboard: (v: boolean) => void;
  setShowChangelog: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  setShowNew: (v: boolean) => void;
  refresh: () => Promise<void>;
  pushToast: (msg: string) => void;
  filterActive: FilterKind;
  setFilterActive: (v: FilterKind) => void;
}

export function Sidebar({
  students,
  selectedId,
  setSelectedId,
  setShowDashboard,
  setShowChangelog,
  setShowSettings,
  setShowNew,
  refresh,
  pushToast,
  filterActive,
  setFilterActive,
}: SidebarProps) {
  const [q, setQ] = useState("");

  const filtered = students.filter((s) => {
    if (filterActive === "active" && !s.isActive) return false;
    if (filterActive === "inactive" && s.isActive) return false;
    if (filterActive === "contracts") {
      const activeContracts =
        typeof s.billingActiveCount === "number"
          ? s.billingActiveCount
          : Array.isArray(s.billingHistory)
            ? s.billingHistory.filter((c) => {
                const doneByFlag = c.completed === true;
                const consumed = c.consumedLessons ?? 0;
                const total = c.totalLessons ?? 0;
                const doneByCount = total > 0 && consumed >= total;
                return !(doneByFlag || doneByCount);
              }).length
            : 0;
      if (activeContracts === 0) return false;
    }
    return (
      fullName(s).toLowerCase().includes(q.toLowerCase()) ||
      s.description?.toLowerCase().includes(q.toLowerCase())
    );
  });

  useEffect(() => {
    const handler = (e: any) => {
      setFilterActive(e.detail);
    };
    window.addEventListener("studentFilterChanged", handler);

    return () => {
      window.removeEventListener("studentFilterChanged", handler);
    };
  }, [setFilterActive]);

  return (
    <aside className="sidebar">
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
          }}
        >
          <Settings size={16} strokeWidth={1.5} />
        </button>

        <button
          className="btn icon window-no-drag"
          title="Nouvel étudiant"
          aria-label="Nouvel étudiant"
          onClick={() => {
            setShowNew(true);
          }}
        >
          <Plus size={16} strokeWidth={1.5} />
        </button>
      </div>

      <button
        className="btn ghost"
        style={{ marginBottom: "16px", width: "100%" }}
        onClick={() => {
          setSelectedId(null);
          setShowDashboard(true);
          setShowChangelog(false);
          setShowSettings(false);
        }}
      >
        🏠 Accueil
      </button>

      {/* 👇 Bouton import CSV */}
      <button
        className="btn ghost"
        style={{ marginBottom: "16px", width: "100%" }}
        onClick={async () => {
          const result = await window.studentApi.importCSV();
          if (result?.count) {
            pushToast(`Importé ${result.count} étudiants • 💾 local`);
            refresh();
          }
        }}
      >
        📂 Importer CSV
      </button>

      {/* Texte d’aide sur le schéma CSV */}
      <div
        style={{
          fontSize: "11px",
          color: "#aaa",
          marginBottom: "16px",
          paddingLeft: "4px",
          lineHeight: 1.4,
        }}
      >
        Schéma du CSV attendu :<br />
        <code>firstName, lastName, description, email, isActive</code>
      </div>

      <input
        className="search"
        placeholder="Rechercher des étudiants…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Rechercher des étudiants"
      />

      {/* Dropdown filtre */}
      <div className="filter-select-wrapper" style={{ margin: "12px 0" }}>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as FilterKind)}
          className="filter-select"
        >
          <option value="all">Tous</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
          <option value="contracts">Contrat(s) actif(s)</option>
        </select>
      </div>

      {filtered.map((s) => {
        const activeContracts =
          typeof s.billingActiveCount === "number"
            ? s.billingActiveCount
            : Array.isArray(s.billingHistory)
              ? s.billingHistory.filter((c) => {
                  const doneByFlag = c.completed === true;
                  const consumed = c.consumedLessons ?? 0;
                  const total = c.totalLessons ?? 0;
                  const doneByCount = total > 0 && consumed >= total;
                  return !(doneByFlag || doneByCount);
                }).length
              : 0;

        return (
          <div
            key={s.id}
            className={["student-item", selectedId === s.id ? "active" : ""].join(" ")}
            onClick={() => {
              setSelectedId(s.id);
              setShowDashboard(false);
              setShowChangelog(false);
              setShowSettings(false);
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
                <div
                  className="student-state"
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: s.isActive ? "limegreen" : "red",
                    }}
                  />
                  {activeContracts > 0 && (
                    <span style={{ fontSize: 12, color: "#aaa" }}>
                      {activeContracts} contrat{activeContracts > 1 ? "s" : ""} actif
                      {activeContracts > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {!filtered.length && <div className="empty">Aucun étudiant trouvé.</div>}
    </aside>
  );
}
