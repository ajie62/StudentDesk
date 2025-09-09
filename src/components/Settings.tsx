import React, { useState, useEffect } from "react"
import { CURRENCIES } from "../constants"

// Types de réglages
type Tab = "appearance" | "lessons" | "data"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("appearance")

  const [theme, setTheme] = useState("dark")
  const [lessonDuration, setLessonDuration] = useState(60)
  const [currency, setCurrency] = useState("EUR") // ⚡ normalisation

  // Charger réglages depuis electron-store
  useEffect(() => {
    (async () => {
      try {
        const prefs = await window.studentApi.getSettings?.()
        if (prefs) {
          setTheme(prefs.theme ?? "dark")
          setLessonDuration(prefs.lessonDuration ?? 60)
          setCurrency(prefs.currency ?? "EUR")
        }
      } catch (e) {
        console.error("Impossible de charger les réglages :", e)
      }
    })()
  }, [])

  // Sauvegarde côté Electron
  async function handleChange(
    key: "theme" | "lessonDuration" | "currency",
    value: string | number
  ) {
    const newSettings = {
      theme,
      lessonDuration,
      currency,
      [key]: value,
    }

    // Met à jour l’état local
    if (key === "theme") setTheme(value as string)
    if (key === "lessonDuration") setLessonDuration(value as number)
    if (key === "currency") setCurrency(value as string)

    // Sauvegarde → le toast est déclenché par App.tsx quand "store-saved" est reçu
    try {
      await window.studentApi.saveSettings?.(newSettings)
    } catch (e) {
      console.error("Erreur de sauvegarde des réglages :", e)
    }
  }

  return (
    <div className="dash settings-page">
      <h2>Réglages</h2>

      {/* Onglets */}
      <div className="tabs">
        <button
          className={activeTab === "appearance" ? "active" : ""}
          onClick={() => setActiveTab("appearance")}
        >
          Apparence
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
      {activeTab === "appearance" && (
        <div className="settings-section">
          <label>
            Thème :
            <select value={theme} onChange={(e) => handleChange("theme", e.target.value)}>
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </label>
        </div>
      )}

      {activeTab === "lessons" && (
        <div className="settings-section">
          <label>
            Durée par défaut d’une leçon :
            <select
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
            <select value={currency} onChange={(e) => handleChange("currency", e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                    {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {activeTab === "data" && (
        <div className="settings-section">
          <button
            className="btn"
            onClick={() => {
              console.log("🚀 Export JSON bientôt disponible")
            }}
          >
            Exporter les données (JSON)
          </button>
        </div>
      )}
    </div>
  )
}