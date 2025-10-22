import React, { useEffect, useMemo, useState, Suspense, lazy } from "react";
import i18next from "i18next";
import { Student, AppSettings, FilterKind, Toast } from "./types";
import { pushToast, toastSave } from "./helpers/toastHelpers";
import { computeStats, computeEvents } from "./helpers/studentHelpers";
import { Sidebar } from "./components/ui/Sidebar";
import { ToastContainer } from "./components/ui/ToastContainer";
import StudentForm from "./components/student/StudentForm";
import StudentDetail from "./components/student-detail/StudentDetail";
import Changelog from "./components/changelog/Changelog";
import SettingsPage from "./components/settings/Settings";
import { useUpdates } from "./hooks/useUpdates";
import { useStudentsContext } from "./contexts/StudentsContext";
import Fuse from "fuse.js";
import "./styles.css";
import "../i18n";

const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));

export default function App() {
  // Data state (backend / API)
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // UI state (nav / display)
  const [showDashboard, setShowDashboard] = useState(true);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Search state / filter
  const [q, setQ] = useState("");
  const [filterActive, setFilterActive] = useState<FilterKind>("all");

  // System state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [version, setVersion] = useState("");

  const { students, setStudents, refresh } = useStudentsContext();
  const updateReady = useUpdates(setToasts);

  // Chargement initial : étudiants + version app
  useEffect(() => {
    refresh();
    window.studentApi.onAppFocus(() => refresh());
    (async () => {
      try {
        const v = await window.studentApi.getVersion();
        setVersion(v || "");
      } catch {
        setVersion("");
      }
    })();
  }, []);

  // Charger préférences (filtre par défaut + langue)
  useEffect(() => {
    (async () => {
      try {
        const prefs = (await window.studentApi.getSettings?.()) as Partial<AppSettings> | undefined;

        if (prefs?.defaultStudentFilter) {
          setFilterActive(prefs.defaultStudentFilter);
        }
        if (prefs?.language) {
          i18next.changeLanguage(prefs.language);
        }
      } catch (e) {
        console.error("Impossible de charger defaultStudentFilter :", e);
      }
    })();
  }, []);

  // Listener sur l'événement "studentFilterChanged"
  useEffect(() => {
    const handler = (e: any) => setFilterActive(e.detail);
    window.addEventListener("studentFilterChanged", handler);

    return () => window.removeEventListener("studentFilterChanged", handler);
  }, []);

  // Sauvegardes (étudiants, leçons, réglages)
  useEffect(() => {
    const unsubscribe = window.studentApi.onStoreSaved?.(({ action, icloud }) => {
      const where = icloud ? "☁️ iCloud" : "💾 local";
      toastSave(setToasts, action, where);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => {
    let results = students;
    const term = q.trim();

    if (term) {
      const fuse = new Fuse(students, {
        keys: [
          { name: "firstName", weight: 0.5 },
          { name: "lastName", weight: 0.5 },
          { name: "description", weight: 0.3 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      });
      results = fuse.search(term).map((r) => r.item);
    }

    if (filterActive === "active") results = results.filter((s) => s.isActive);
    else if (filterActive === "inactive") results = results.filter((s) => !s.isActive);

    return results;
  }, [q, students, filterActive]);

  const stats = useMemo(() => computeStats(students), [students]);
  const events = useMemo(() => computeEvents(students), [students]);

  // Render
  return (
    <div className="app-shell">
      <Sidebar
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        students={filtered}
        filterActive={filterActive}
        setFilterActive={setFilterActive}
        setShowDashboard={setShowDashboard}
        setShowChangelog={setShowChangelog}
        setShowSettings={setShowSettings}
        setShowNew={setShowNew}
        onStudentsChanged={refresh}
        pushToast={(msg) => pushToast(setToasts, msg)}
      />

      {/* Main content */}
      <main className="content">
        <div className="title-drag window-drag" />

        <div className="container">
          {showChangelog ? (
            // Page des versions
            <Changelog />
          ) : showDashboard ? (
            // Tableau de bord de l'app.
            <Suspense fallback={<div className="empty">Chargement du tableau de bord...</div>}>
              <Dashboard
                stats={stats}
                students={students}
                events={events}
                onOpenStudent={(id: React.SetStateAction<string | null>) => {
                  setSelectedId(id);
                  setShowDashboard(false);
                  setShowChangelog(false);
                  setShowSettings(false);
                }}
              />
            </Suspense>
          ) : showSettings ? (
            // Page des réglages
            <SettingsPage />
          ) : (
            // Fiche d'un étudiant
            <StudentDetail
              studentId={selectedId!}
              onDeleted={() => {
                setSelectedId(null);
                setShowDashboard(true);
                refresh();
              }}
              onUpdated={() => refresh()}
            />
          )}
        </div>

        <div
          className="app-version window-no-drag"
          onClick={() => {
            setSelectedId(null);
            setShowDashboard(false);
            setShowChangelog(true);
          }}
        >
          v{version}
        </div>

        {updateReady && (
          <div className="update-banner">
            🚀 Nouvelle version téléchargée&nbsp;
            <button className="btn small" onClick={() => window.studentApi.installUpdateNow()}>
              Mettre à jour maintenant
            </button>
          </div>
        )}
      </main>

      {showNew && (
        <StudentForm
          onClose={() => setShowNew(false)}
          onSaved={async (payload: Partial<Student>) => {
            try {
              // 1) Crée l'étudiant et récupère son ID
              const created: any = await window.studentApi.createStudent(payload as Partial<Student>);

              // 2) Ouvre immédiatement sa fiche si possible
              if (created && created.id) {
                setSelectedId(created.id);
                setShowDashboard(false);
                setShowChangelog(false);
                setShowSettings(false);
              }

              // 3) Ferme la modale
              setShowNew(false);

              // 4) Rafraîchit la liste (sidebar & co)
              await refresh();
            } catch (err) {
              console.error("Erreur lors de la création de l'étudiant :", err);
            }
          }}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}
