import { useState, useEffect } from "react";
import { AppSettings, SettingsTab } from "../../types";
import { FAVORITES, OTHERS } from "../../constants";
import Select from "react-select";
import i18next from "i18next";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("app");

  const [theme, setTheme] = useState("dark");
  const [lessonDuration, setLessonDuration] = useState(60);
  const [currency, setCurrency] = useState("EUR"); // ⚡ normalisation
  const [defaultStudentFilter, setDefaultStudentFilter] = useState("all");
  const [language, setLanguage] = useState("fr");

  // Charger réglages depuis electron-store
  useEffect(() => {
    (async () => {
      try {
        const prefs: Partial<AppSettings> | undefined = await window.studentApi.getSettings?.();
        if (prefs) {
          setTheme(prefs.theme ?? "dark");
          setLessonDuration(prefs.lessonDuration ?? 60);
          setCurrency(prefs.currency ?? "EUR");
          setDefaultStudentFilter(prefs.defaultStudentFilter ?? "all");
          setLanguage(prefs.language ?? "fr");
        }
      } catch (e) {
        console.error("Impossible de charger les réglages :", e);
      }
    })();
  }, []);

  // Sauvegarde côté Electron
  async function handleChange(
    key: "theme" | "lessonDuration" | "currency" | "defaultStudentFilter" | "language",
    value: string | number
  ) {
    const newSettings = {
      theme,
      lessonDuration,
      currency,
      defaultStudentFilter,
      language,
      [key]: value,
    };

    // Met à jour l’état local
    if (key === "theme") setTheme(value as string);
    if (key === "lessonDuration") setLessonDuration(value as number);
    if (key === "currency") setCurrency(value as string);
    if (key === "defaultStudentFilter") setDefaultStudentFilter(value as string);
    if (key === "language") {
      setLanguage(value as string);
      i18next.changeLanguage(value as string);
    }

    // Sauvegarde → le toast est déclenché par App.tsx quand "store-saved" est reçu
    try {
      await window.studentApi.saveSettings?.(newSettings);
      // Le toast est déclenché par App.tsx quand "store-saved" est reçu
      if (key === "defaultStudentFilter") {
        window.dispatchEvent(new CustomEvent("studentFilterChanged", { detail: value }));
      }
    } catch (e) {
      console.error("Erreur de sauvegarde des réglages :", e);
    }
  }

  return (
    <div className="dash settings-page">
      <h2>{t("settings.title")}</h2>

      {/* Onglets */}
      <div className="tabs">
        <button className={activeTab === "app" ? "active" : ""} onClick={() => setActiveTab("app")}>
          {t("settings.tabs.app")}
        </button>
        <button
          className={activeTab === "lessons" ? "active" : ""}
          onClick={() => setActiveTab("lessons")}
        >
          {t("settings.tabs.lessons")}
        </button>
        <button
          className={activeTab === "data" ? "active" : ""}
          onClick={() => setActiveTab("data")}
        >
          {t("settings.tabs.data")}
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "app" && (
        <div className="settings-section">
          <label>
            {t("settings.app.theme")} :
            <select
              className="input"
              value={theme}
              onChange={(e) => handleChange("theme", e.target.value)}
            >
              <option value="light">{t("settings.theme.light")}</option>
              <option value="dark">{t("settings.theme.dark")}</option>
            </select>
          </label>

          <label>
            {t("settings.app.defaultStudentFilter")} :
            <select
              className="input"
              value={defaultStudentFilter}
              onChange={(e) => handleChange("defaultStudentFilter", e.target.value)}
            >
              <option value="all">{t("settings.studentFilter.all")}</option>
              <option value="active">{t("settings.studentFilter.active")}</option>
              <option value="inactive">{t("settings.studentFilter.inactive")}</option>
              <option value="contracts">{t("settings.studentFilter.contracts")}</option>
            </select>
          </label>

          <label>
            {t("settings.app.language")} :
            <select
              className="input"
              value={language}
              onChange={(e) => handleChange("language", e.target.value)}
            >
              <option value="fr">{t("settings.language.fr")}</option>
              <option value="en">{t("settings.language.en")}</option>
              <option value="zh">{t("settings.language.zh")}</option>
            </select>
          </label>
        </div>
      )}

      {activeTab === "lessons" && (
        <div className="settings-section">
          <label>
            {t("settings.lessons.defaultDuration")} :
            <select
              className="input"
              value={lessonDuration}
              onChange={(e) => handleChange("lessonDuration", Number(e.target.value))}
            >
              <option value={30}>{t("settings.lessons.30min")}</option>
              <option value={45}>{t("settings.lessons.45min")}</option>
              <option value={60}>{t("settings.lessons.60min")}</option>
              <option value={90}>{t("settings.lessons.90min")}</option>
            </select>
          </label>

          <label>
            {t("settings.lessons.currency")} :
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
            {t("settings.data.exportJson")}
          </button>
        </div>
      )}
    </div>
  );
}
