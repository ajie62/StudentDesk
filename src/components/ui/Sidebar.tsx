import { Settings, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { fullName, initialsOf } from "../../utils";
import { Student, FilterKind } from "../../types";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  students: Student[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  setShowDashboard: (v: boolean) => void;
  setShowChangelog: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  setShowNew: (v: boolean) => void;
  onStudentsChanged: () => void;
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
  onStudentsChanged,
  pushToast,
  filterActive,
  setFilterActive,
}: SidebarProps) {
  const { t } = useTranslation();
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
        <div className="brand window-no-drag">{t("sidebar.brand")}</div>
        <div style={{ flex: 1 }} />

        <button
          className="btn icon window-no-drag"
          title={t("sidebar.settings")}
          aria-label={t("sidebar.settings")}
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
          title={t("sidebar.newStudent")}
          aria-label={t("sidebar.newStudent")}
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
        🏠 {t("sidebar.home")}
      </button>

      {/* 👇 Bouton import CSV */}
      <button
        className="btn ghost"
        style={{ marginBottom: "16px", width: "100%" }}
        onClick={async () => {
          const result = await window.studentApi.importCSV();
          if (result?.count) {
            pushToast(t("sidebar.imported", { count: result.count }));
            onStudentsChanged();
          }
        }}
      >
        📂 {t("sidebar.importCsv")}
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
        {t("sidebar.csvSchema")}
        <br />
        <code>firstName, lastName, description, email, isActive</code>
      </div>

      <input
        className="search"
        placeholder={t("sidebar.searchPlaceholder")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={t("sidebar.searchPlaceholder")}
      />

      {/* Dropdown filtre */}
      <div className="filter-select-wrapper" style={{ margin: "12px 0" }}>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as FilterKind)}
          className="filter-select"
        >
          <option value="all">{t("sidebar.filter.all")}</option>
          <option value="active">{t("sidebar.filter.active")}</option>
          <option value="inactive">{t("sidebar.filter.inactive")}</option>
          <option value="contracts">{t("sidebar.filter.contracts")}</option>
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
                      {t("sidebar.contractsActive", { count: activeContracts })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {!filtered.length && <div className="empty">{t("sidebar.noResults")}</div>}
    </aside>
  );
}
