import React, { useMemo, useState, useEffect } from "react";
import { Student, ActivityItem } from "../types";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Stats = {
  total: number;
  active: number;
  inactive: number;
  lessons: number;
};

type Props = {
  stats: Stats;
  students: Student[];
  events: ActivityItem[];
  onOpenStudent: (id: string) => void;
};

const motivationalQuotes = [
  "🌱 Chaque leçon est une graine semée dans l'esprit d'un étudiant.",
  "✨ Inspirer aujourd’hui, c’est changer demain.",
  "📘 Un élève motivé est un monde qui s’ouvre.",
  "🌍 Enseigner, c’est laisser une trace dans l’infini.",
  "💡 Une seule explication claire peut illuminer une vie entière.",
  "🌟 Derrière chaque progrès d’un étudiant, il y a votre patience.",
  "🔥 La passion d’enseigner crée la passion d’apprendre.",
  "🎶 Chaque cours est une note dans la symphonie de leur avenir.",
  "🌸 Enseigner, c’est semer la confiance en soi.",
  "🚀 Aujourd’hui, vous changez la trajectoire d’une vie.",
];

export default function Dashboard({ stats, students, events, onOpenStudent }: Props) {
  const [page, setPage] = useState(1);
  const [historyClearedAt, setHistoryClearedAt] = useState<string | null>(null);
  const PAGE_SIZE = 8;

  const randomQuote = useMemo(() => {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  }, []);

  useEffect(() => {
    console.log("Étudiants ->", students);
  }, [students]);

  // Récupère la date de purge (pour masquer les créations/updates antérieures)
  useEffect(() => {
    (async () => {
      try {
        const ts = await window.studentApi.getHistoryClearedAt?.();
        setHistoryClearedAt(ts || null);
      } catch {
        setHistoryClearedAt(null);
      }
    })();
  }, []);

  // Filtre l'historique avec cutoff local (effet immédiat après "Vider")
  const recent = useMemo(() => {
    const cutoff = historyClearedAt ? new Date(historyClearedAt).toISOString() : null;
    const filtered = cutoff ? events.filter((ev) => ev.when > cutoff) : events;
    return [...filtered].sort((a, b) => b.when.localeCompare(a.when));
  }, [events, historyClearedAt]);

  const pageCount = Math.max(1, Math.ceil(recent.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return recent.slice(start, start + PAGE_SIZE);
  }, [recent, page]);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - 3 + i);
    return {
      day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      count: students.reduce(
        (acc, s) =>
          acc +
          (s.lessons || []).filter((l) => new Date(l.createdAt).toDateString() === d.toDateString())
            .length,
        0
      ),
      isToday: d.toDateString() === today.toDateString(),
    };
  });

  const weeklyTotal = days.reduce((acc, d) => acc + d.count, 0);

  const revenueByMonth = useMemo(() => {
    type RevenueMonth = {
      month: string;
      [currency: string]: number | string;
    };

    const months: RevenueMonth[] = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString("fr-FR", { month: "short" }),
    }));

    students.forEach((s) => {
      (s.lessons || []).forEach((lesson) => {
        const d = new Date(lesson.createdAt);
        if (d.getFullYear() !== new Date().getFullYear()) return;

        const contract = (s.billingHistory || []).find((c) => c.id === lesson.billingId);
        if (!contract || !contract.pricePerLesson || !contract.currency) return;

        const m = d.getMonth();
        months[m][contract.currency] =
          ((months[m][contract.currency] as number) ?? 0) + contract.pricePerLesson;
      });
    });

    return months;
  }, [students]);

  // Liste des devises présentes
  const currencies = useMemo(() => {
    const set = new Set<string>();
    revenueByMonth.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "month") set.add(key);
      });
    });
    return Array.from(set);
  }, [revenueByMonth]);

  // Palette de couleurs
  const colors = ["#16d39a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Totaux par devise
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    revenueByMonth.forEach((row) => {
      currencies.forEach((cur) => {
        totals[cur] = (totals[cur] ?? 0) + ((row[cur] as number) ?? 0);
      });
    });
    return totals;
  }, [revenueByMonth, currencies]);

  // Top 3 étudiants (seulement ceux avec ≥1 leçon), complété avec "—"
  const top3 = useMemo(() => {
    const ranked = [...students]
      .map((s) => ({
        id: s.id,
        name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "—",
        lessons: Array.isArray(s.lessons) ? s.lessons.length : 0,
      }))
      .filter((s) => s.lessons > 0) // ⬅️ on exclut ceux à 0 leçon
      .sort((a, b) => b.lessons - a.lessons)
      .slice(0, 3);

    // Complète jusqu'à 3 avec des placeholders "—"
    while (ranked.length < 3) {
      ranked.push({
        id: `placeholder-${ranked.length + 1}`,
        name: "—",
        lessons: 0,
      });
    }

    return ranked;
  }, [students]);

  async function handleClearHistory() {
    const ok = window.confirm(
      "Cette action va effacer définitivement l'historique (modifications) et masquer toutes les créations antérieures à maintenant. Continuer ?"
    );
    if (!ok) return;
    try {
      await window.studentApi.clearHistory?.();
      // Reprend la nouvelle date de purge et remet à la page 1
      const ts = await window.studentApi.getHistoryClearedAt?.();
      setHistoryClearedAt(ts || null);
      setPage(1);
    } catch (e) {
      console.error("clearHistory failed:", e);
      alert("Impossible de vider l'historique. Regarde la console pour les détails.");
    }
  }

  return (
    <div className="dash">
      <h2>Tableau de bord</h2>

      {/* Citation motivante (aléatoire) */}
      <p className="motivational-quote">{randomQuote}</p>

      {/* ROW 1 : 50/50 charts */}
      <div className="dash-grid">
        {/* ROW 2 : Podium */}
        <div className="dashboard-card full-width">
          <h3>Top 3 étudiants (leçons)</h3>

          {top3.length === 0 || top3.every((s) => s.lessons === 0) ? (
            <div className="empty-state">Aucune leçon enregistrée pour l’instant.</div>
          ) : (
            <div className="podium-wrap">
              {/* 2e place */}
              {top3[1] ? (
                <div
                  className="podium-step step-2"
                  title={`${top3[1].name} • ${top3[1].lessons} leçons`}
                >
                  <div className="step-rank">2</div>
                  <div className="step-name">{top3[1].name}</div>
                  <div className="step-meta">{top3[1].lessons} leçons</div>
                </div>
              ) : (
                <div className="podium-step step-2 placeholder">
                  <div className="step-rank">2</div>
                  <div className="step-name muted">—</div>
                  <div className="step-meta muted">—</div>
                </div>
              )}

              {/* 1re place */}
              {top3[0] ? (
                <div
                  className="podium-step step-1"
                  title={`${top3[0].name} • ${top3[0].lessons} leçons`}
                >
                  <div className="crown">🥇</div>
                  <div className="step-rank">1</div>
                  <div className="step-name">{top3[0].name}</div>
                  <div className="step-meta">{top3[0].lessons} leçons</div>
                </div>
              ) : (
                <div className="podium-step step-1 placeholder">
                  <div className="step-rank">1</div>
                  <div className="step-name muted">—</div>
                  <div className="step-meta muted">—</div>
                </div>
              )}

              {/* 3e place */}
              {top3[2] ? (
                <div
                  className="podium-step step-3"
                  title={`${top3[2].name} • ${top3[2].lessons} leçons`}
                >
                  <div className="step-rank">3</div>
                  <div className="step-name">{top3[2].name}</div>
                  <div className="step-meta">{top3[2].lessons} leçons</div>
                </div>
              ) : (
                <div className="podium-step step-3 placeholder">
                  <div className="step-rank">3</div>
                  <div className="step-name muted">—</div>
                  <div className="step-meta muted">—</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dashboard-card full-width">
          <h3>Revenus annuels ({new Date().getFullYear()})</h3>
          <div className="chart-container">
            {currencies.length === 0 ? (
              <div className="empty-state">Aucun revenu enregistré pour l’instant.</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip
                    formatter={(val: number, name: string) => `${val} ${name}`}
                    contentStyle={{
                      backgroundColor: "rgba(31,31,31,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#f9fafb",
                    }}
                    itemStyle={{ color: "#f9fafb" }}
                    cursor={{ fill: "rgba(59,130,246,0.15)" }}
                  />

                  {currencies.map((cur, i) => (
                    <Bar
                      key={cur}
                      dataKey={cur}
                      fill={colors[i % colors.length]}
                      barSize={20}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Résumé par devise */}
          <div className="donut-legend donut-legend--center" style={{ marginTop: 8 }}>
            {currencies.map((cur, i) => (
              <div key={cur} className="legend-item">
                <span className="legend-dot" style={{ background: colors[i % colors.length] }} />
                <span>{cur}</span>
                <span className="legend-count">
                  {totalsByCurrency[cur]} {cur}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- Donut Actifs/Inactifs --- */}
        <div className="dashboard-card pie">
          <h3>Actifs / Inactifs</h3>

          <div className="chart-container relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* Dégradés & lueur discrète */}
                <defs>
                  <linearGradient id="gradActive" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#16d39a" />
                    <stop offset="100%" stopColor="#0ea372" />
                  </linearGradient>
                  <linearGradient id="gradInactive" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff6b6b" />
                    <stop offset="100%" stopColor="#e43f3f" />
                  </linearGradient>
                  <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Anneau de fond (piste) */}
                <Pie
                  data={[{ value: 1 }]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={70}
                  outerRadius={100}
                  stroke="none"
                  fill="rgba(255,255,255,0.04)"
                />

                {/* Donut principal */}
                <Pie
                  data={[
                    { name: "Actifs", value: stats.active, fill: "url(#gradActive)" },
                    { name: "Inactifs", value: stats.inactive, fill: "url(#gradInactive)" },
                  ]}
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2.5}
                  cornerRadius={10}
                  dataKey="value"
                  stroke="#0f0f11"
                  strokeWidth={2}
                  filter="url(#softGlow)"
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(31,31,31,0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    color: "#f9fafb",
                    fontSize: 13,
                  }}
                  itemStyle={{ color: "#f9fafb" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centre parfaitement aligné */}
            <div className="donut-center">
              <span className="donut-value">{stats.total}</span>
              <span className="donut-label">Étudiants</span>
            </div>
          </div>

          {/* Légende compacte */}
          <div className="donut-legend">
            <div className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "linear-gradient(135deg,#16d39a,#0ea372)" }}
              />
              <span>Actifs</span>
              <span className="legend-count">{stats.active}</span>
            </div>
            <div className="legend-item">
              <span
                className="legend-dot"
                style={{ background: "linear-gradient(135deg,#ff6b6b,#e43f3f)" }}
              />
              <span>Inactifs</span>
              <span className="legend-count">{stats.inactive}</span>
            </div>
          </div>
        </div>

        {/* --- Histogramme 7 jours --- */}
        <div className="dashboard-card">
          <h3>Leçons (7 derniers jours)</h3>
          <div className="chart-container">
            <ResponsiveContainer>
              <BarChart data={days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" allowDecimals={false} interval={0} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(31,31,31,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#f9fafb",
                  }}
                  itemStyle={{ color: "#f9fafb" }}
                  cursor={{ fill: "rgba(59,130,246,0.15)" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Total hebdo aligné au centre, même style que la légende du donut */}
          <div className="donut-legend donut-legend--center" style={{ marginTop: 8 }}>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: "#3b82f6" }} />
              <span>Total</span>
              <span className="legend-count">{weeklyTotal}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 : Historique */}
      <div className="dashboard-card">
        <div
          className="card-header"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <h3>Historique</h3>
          <button
            className={`btn ghost ${recent.length === 0 ? "disabled" : "danger"}`}
            disabled={recent.length === 0}
            onClick={handleClearHistory}
          >
            🗑 Vider
          </button>
        </div>

        <div className="activity-list">
          {paginated.length === 0 ? (
            <div className="empty-state">Aucune activité enregistrée pour l’instant.</div>
          ) : (
            paginated.map((ev) => (
              <div
                key={ev.id}
                className="activity-item"
                onClick={() => onOpenStudent(ev.studentId)}
              >
                <span className="activity-icon">{ev.kind.startsWith("student") ? "👤" : "📘"}</span>
                <span className="activity-label">{ev.label}</span>
                <span className="activity-date">
                  {formatDistanceToNow(new Date(ev.when), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </div>
            ))
          )}
        </div>

        {pageCount > 1 && (
          <div className="pagination" style={{ marginTop: "12px" }}>
            <button
              className="btn ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </button>
            <span className="counter">
              Page {page} / {pageCount}
            </span>
            <button
              className="btn"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
