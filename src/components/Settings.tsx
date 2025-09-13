import React, { useState, useEffect } from "react";
import { AppSettings } from "../types";
import { FAVORITES, OTHERS } from "../constants";
import Select from "react-select";

// Types de réglages
type Tab = "app" | "lessons" | "data";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("app");

  const [theme, setTheme] = useState("dark");
  const [lessonDuration, setLessonDuration] = useState(60);
  const [currency, setCurrency] = useState("EUR"); // ⚡ normalisation
  const [defaultStudentFilter, setDefaultStudentFilter] = useState("all");

  // Charger réglages depuis electron-store
  useEffect(() => {
    (async () => {
      try {
        const prefs: AppSettings | undefined = await window.studentApi.getSettings?.();
        if (prefs) {
          setTheme(prefs.theme ?? "dark");
          setLessonDuration(prefs.lessonDuration ?? 60);
          setCurrency(prefs.currency ?? "EUR");
          setDefaultStudentFilter(prefs.defaultStudentFilter ?? "all");
        }
      } catch (e) {
        console.error("Impossible de charger les réglages :", e);
      }
    })();
  }, []);

  // Sauvegarde côté Electron
  async function handleChange(
    key: "theme" | "lessonDuration" | "currency" | "defaultStudentFilter",
    value: string | number
  ) {
    const newSettings = {
      theme,
      lessonDuration,
      currency,
      defaultStudentFilter,
      [key]: value,
    };

    // Met à jour l’état local
    if (key === "theme") setTheme(value as string);
    if (key === "lessonDuration") setLessonDuration(value as number);
    if (key === "currency") setCurrency(value as string);
    if (key === "defaultStudentFilter") setDefaultStudentFilter(value as string);

    // Sauvegarde → le toast est déclenché par App.tsx quand "store-saved" est reçu
    try {
      await window.studentApi.saveSettings?.(newSettings);

      window.dispatchEvent(new CustomEvent("studentFilterChanged", { detail: value }));
    } catch (e) {
      console.error("Erreur de sauvegarde des réglages :", e);
    }
  }

  return (
    <div className="dash settings-page">
      <h2>Réglages</h2>

      {/* Onglets */}
      <div className="tabs">
        <button className={activeTab === "app" ? "active" : ""} onClick={() => setActiveTab("app")}>
          App
        </button>
        <button
          className={activeTab === "lessons" ? "active" : ""}
          onClick={() => setActiveTab("lessons")}
        >
          Leçons
        </button>
        <button
          className={activeTab === "data" ? "active" : ""}
          onClick={() => setActiveTab("data")}
        >
          Données
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "app" && (
        <div className="settings-section">
          <label>
            Thème :
            <select
              className="input"
              value={theme}
              onChange={(e) => handleChange("theme", e.target.value)}
            >
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </label>

          <label>
            Catégorie étudiant par défaut :
            <select
              className="input"
              value={defaultStudentFilter}
              onChange={(e) => handleChange("defaultStudentFilter", e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="contracts">Contrat(s) actif(s)</option>
            </select>
          </label>
        </div>
      )}

      {activeTab === "lessons" && (
        <div className="settings-section">
          <label>
            Durée par défaut d’une leçon :
            <select
              className="input"
              value={lessonDuration}
              onChange={(e) => handleChange("lessonDuration", Number(e.target.value))}
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </label>

          <label>
            Devise :
            <Select
              value={[...FAVORITES, ...OTHERS].find((opt) => opt.value === currency)}
              onChange={(opt) => handleChange("currency", opt?.value ?? "EUR")}
              options={[
                { label: "Favoris", options: FAVORITES },
                { label: "Autres devises", options: OTHERS },
              ]}
              isSearchable
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "var(--card)",
                  borderColor: "var(--soft)",
                  borderRadius: "var(--r)",
                  color: "var(--fg)",
                  fontSize: "14px",
                  minHeight: "32px",
                }),
                valueContainer: (base) => ({
                  ...base,
                  color: "var(--fg)",
                  fontSize: "14px",
                }),
                input: (base) => ({
                  ...base,
                  color: "var(--fg)", // texte de saisie en couleur visible
                  fontSize: "14px",
                  margin: 0,
                  padding: 0,
                }),
                singleValue: (base) => ({
                  ...base,
                  color: "var(--fg)", // texte de la devise sélectionnée
                  fontSize: "14px",
                }),
                placeholder: (base) => ({
                  ...base,
                  color: "var(--muted)",
                  fontSize: "14px",
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--soft)",
                  borderRadius: "var(--r)",
                  zIndex: 100,
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? "var(--soft)" : "transparent",
                  color: "var(--fg)",
                  fontSize: "14px",
                  cursor: "pointer",
                }),
                groupHeading: (base) => ({
                  ...base,
                  color: "var(--muted)",
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "4px 8px",
                }),
              }}
            />
          </label>
        </div>
      )}

      {activeTab === "data" && (
        <div className="settings-section">
          <button
            className="btn"
            onClick={() => {
              console.log("🚀 Export JSON bientôt disponible");
            }}
          >
            Exporter les données (JSON)
          </button>
        </div>
      )}
    </div>
  );
}
