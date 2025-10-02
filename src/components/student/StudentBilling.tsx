import { useMemo, useState, useEffect } from "react";
import { BillingContract, StudentBillingProps } from "../../types";
import { FAVORITES, OTHERS } from "../../constants";
import Select from "react-select";

export default function StudentBilling({ viewModel, onChange }: StudentBillingProps): JSX.Element {
  const c = viewModel.billing;
  const [settings, setSettings] = useState<{ lessonDuration: number; currency: string } | null>(
    null
  );

  // Charger les réglages et appliquer uniquement si valeurs absentes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const prefs = await window.studentApi.getSettings?.();
        if (prefs && mounted) {
          setSettings(prefs);

          // ✅ n’appliquer la durée que si elle n’est pas déjà définie
          if (!c.durationMinutes || c.durationMinutes <= 0) {
            onChange({ durationMinutes: prefs.lessonDuration ?? 60 });
          }

          // ✅ idem pour la devise
          if (!c.currency) {
            onChange({ currency: prefs.currency ?? "EUR" });
          }
        }
      } catch (e) {
        console.error("Impossible de charger les réglages", e);

        if (mounted) {
          if (!c.durationMinutes || c.durationMinutes <= 0) {
            onChange({ durationMinutes: 60 });
          }
          if (!c.currency) {
            onChange({ currency: "EUR" });
          }
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ---- Validation (durée + prix requis)
  const isValid = useMemo(() => {
    const hasDuration = typeof c.durationMinutes === "number" && c.durationMinutes > 0;
    const hasPrice = typeof c.pricePerLesson === "number" && c.pricePerLesson > 0;
    return hasDuration && hasPrice;
  }, [c.durationMinutes, c.pricePerLesson]);

  function setMode(mode: BillingContract["mode"]) {
    onChange({ mode });
  }

  function handleDurationSelect(value: string) {
    if (value === "custom") {
      onChange({ customDuration: true });
    } else {
      const num = Number(value);
      onChange({
        customDuration: false,
        durationMinutes: isFinite(num) ? num : (settings?.lessonDuration ?? 60),
      });
    }
  }

  function handleCustomDuration(v: string) {
    const num = Number(v);
    if (isFinite(num) && num > 0) {
      onChange({ durationMinutes: num });
    } else {
      onChange({ durationMinutes: 0 });
    }
  }

  function handlePrice(v: string) {
    const num = Number(v);
    if (isFinite(num) && num >= 0) {
      onChange({ pricePerLesson: num });
    } else {
      onChange({ pricePerLesson: null });
    }
  }

  return (
    <div className="form">
      <h3 style={{ marginBottom: 12 }}>
        Cours & facturation – {viewModel.firstName} {viewModel.lastName}
      </h3>

      {/* Type de contrat */}
      <div className="field">
        <label className="label">Type de contrat</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`btn ghost ${c.mode === "single" ? "active" : ""}`}
            onClick={() => setMode("single")}
          >
            Leçon unitaire
          </button>
          <button
            type="button"
            className={`btn ghost ${c.mode === "package" ? "active" : ""}`}
            onClick={() => setMode("package")}
          >
            Pack de leçons
          </button>
        </div>
      </div>

      {/* Nombre de leçons (pack) */}
      {c.mode === "package" && (
        <div className="field">
          <label className="label">Nombre de leçons dans le pack</label>
          <input
            className="input"
            type="number"
            min={1}
            value={c.totalLessons ?? 1}
            onChange={(e) => onChange({ totalLessons: Math.max(1, Number(e.target.value || 1)) })}
          />
        </div>
      )}

      {c.mode === "package" && (
        <div className="field">
          <label className="label">Leçon(s) gratuites ?</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={(c.freeLessons ?? 0) > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ freeLessons: 1 });
                } else {
                  onChange({ freeLessons: 0 });
                }
              }}
            />
            {(c.freeLessons ?? 0) > 0 && (
              <input
                className="input"
                type="number"
                min={1}
                value={c.freeLessons ?? 1}
                onChange={(e) => onChange({ freeLessons: Math.max(1, Number(e.target.value)) })}
                style={{ width: "80px" }}
              />
            )}
          </div>
        </div>
      )}

      {/* Durée */}
      <div className="field">
        <label className="label">
          Durée des cours (minutes) <span style={{ color: "var(--accent)" }}>*</span>
        </label>

        <select
          className="input"
          value={
            c.customDuration
              ? "custom"
              : String(c.durationMinutes ?? settings?.lessonDuration ?? 60)
          }
          onChange={(e) => handleDurationSelect(e.target.value)}
        >
          <option value="30">30</option>
          <option value="45">45</option>
          <option value="60">60</option>
          <option value="90">90</option>
          <option value="custom">Autre…</option>
        </select>

        {c.customDuration && (
          <div style={{ marginTop: 8 }}>
            <input
              className="input"
              type="number"
              min={1}
              placeholder="Durée personnalisée (en minutes)"
              value={c.durationMinutes ?? ""}
              onChange={(e) => handleCustomDuration(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Prix / Devise */}
      <div className="field">
        <label className="label">
          Prix / leçon <span style={{ color: "var(--accent)" }}>*</span>
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            placeholder="ex. 40"
            value={c.pricePerLesson ?? ""}
            onChange={(e) => handlePrice(e.target.value)}
          />
          <Select
            value={[...FAVORITES, ...OTHERS].find(
              (opt) => opt.value === (c.currency ?? settings?.currency ?? "EUR")
            )}
            onChange={(opt) => onChange({ currency: opt?.value ?? "EUR" })}
            options={[
              { label: "Favoris", options: FAVORITES },
              { label: "Autres devises", options: OTHERS },
            ]}
            isSearchable
            styles={{
              container: (base) => ({
                ...base,
                minWidth: "200px", // largeur mini plus grande
                maxWidth: "280px", // tu peux ajuster selon ton layout
                flex: "none", // évite que ça se compresse trop
              }),
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
                color: "var(--fg)",
                fontSize: "14px",
                margin: 0,
                padding: 0,
              }),
              singleValue: (base) => ({
                ...base,
                color: "var(--fg)",
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
        </div>
      </div>

      {/* Paiement */}
      <div className="field">
        <label className="label">Statut du paiement</label>
        <select
          className="input"
          value={c.paid ? "paid" : "unpaid"}
          onChange={(e) => onChange({ paid: e.target.value === "paid" })}
        >
          <option value="unpaid">Non payé</option>
          <option value="paid">Payé</option>
        </select>
      </div>

      {/* Notes */}
      <div className="field">
        <label className="label">Notes / détails</label>
        <textarea
          className="textarea"
          placeholder="Informations complémentaires…"
          value={c.notes ?? ""}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>

      {/* Aide validation */}
      {!isValid && (
        <div style={{ marginTop: 8, fontSize: 13, color: "var(--accent)" }}>
          La <strong>durée</strong> et le <strong>prix</strong> sont obligatoires.
        </div>
      )}
    </div>
  );
}
