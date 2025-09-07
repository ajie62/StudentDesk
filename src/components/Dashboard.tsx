import React, { useMemo, useState, useEffect } from "react";
import { Student, ActivityItem } from "../types";
import {
  PieChart,
  Pie,
  Cell,
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

const COLORS = ["#10b981", "#ef4444"];

export default function Dashboard({ stats, students, events, onOpenStudent }: Props) {
  const [page, setPage] = useState(1);
  const [historyClearedAt, setHistoryClearedAt] = useState<string | null>(null);
  const PAGE_SIZE = 8;

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

  // Filtre l'historique avec cutoff
  const recent = useMemo(() => {
    const cutoff = historyClearedAt ? new Date(historyClearedAt).toISOString() : null;
    const filtered = cutoff
      ? events.filter(ev => ev.when > cutoff)
      : events;
    return [...filtered].sort((a, b) => b.when.localeCompare(a.when));
  }, [events, historyClearedAt]);

  const pageCount = Math.max(1, Math.ceil(recent.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return recent.slice(start, start + PAGE_SIZE);
  }, [recent, page]);

  // Graphiques
  const pieData = [
    { name: "Actifs", value: stats.active },
    { name: "Inactifs", value: stats.inactive },
  ];

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - 3 + i);
    return {
      day: d.toLocaleDateString("fr-FR", { weekday: "short" }),
      count: students.reduce(
        (acc, s) =>
          acc +
          (s.lessons || []).filter(
            (l) => new Date(l.createdAt).toDateString() === d.toDateString()
          ).length,
        0
      ),
    };
  });

  // Top 3 étudiants
  const top3 = useMemo(() => {
    return [...students]
      .map((s) => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        lessons: (s.lessons || []).length,
      }))
      .sort((a, b) => b.lessons - a.lessons)
      .slice(0, 3);
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

      {/* ROW 1 : 50/50 charts */}
      <div className="dash-grid">
        <div className="dashboard-card">
          <h3>Actifs / Inactifs</h3>
          <div className="chart-container">
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                    data={pieData}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    >
                    {pieData.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip
                    contentStyle={{
                        backgroundColor: "rgba(31,31,31,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#f9fafb",
                    }}
                    itemStyle={{ color: "#f9fafb" }}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="chart-center">
              <span className="value">{stats.total}</span>
              <span className="label">Étudiants</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
            <h3>Leçons (7 derniers jours)</h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" />

                    <XAxis
                        dataKey="day"
                        stroke="#9ca3af"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value: string) => {
                            const todayShort = new Date().toLocaleDateString("fr-FR", { weekday: "short" });
                            return value === todayShort ? `${value} ⭐` : value;
                        }}
                    />

                    <YAxis stroke="#9ca3af" allowDecimals={false} />

                    <Tooltip
                    contentStyle={{
                        backgroundColor: "rgba(31,31,31,0.95)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        color: "#f9fafb",
                    }}
                    itemStyle={{ color: "#f9fafb" }}
                    cursor={{ fill: "rgba(59,130,246,0.15)" }} // hover plus doux
                    />

                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
      </div>

      {/* ROW 2 : Podium */}
      <div className="dashboard-card">
        <h3>Top 3 étudiants (leçons)</h3>

        {top3.length === 0 || top3.every(s => s.lessons === 0) ? (
            <div className="empty-state">Aucune leçon enregistrée pour l’instant.</div>
        ) : (
            <div className="podium-wrap">
            {/* 2e place */}
            {top3[1] ? (
                <div className="podium-step step-2" title={`${top3[1].name} • ${top3[1].lessons} leçons`}>
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
                <div className="podium-step step-1" title={`${top3[0].name} • ${top3[0].lessons} leçons`}>
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
                <div className="podium-step step-3" title={`${top3[2].name} • ${top3[2].lessons} leçons`}>
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

      {/* ROW 3 : Historique */}
      <div className="dashboard-card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Historique</h3>
            <button
            className={`btn ghost ${recent.length === 0 ? "disabled" : "danger"}`}
            disabled={recent.length === 0}
            onClick={async () => {
                if (recent.length > 0 && confirm("Voulez-vous vraiment vider l'historique ?")) {
                await window.studentApi.clearHistory();
                }
            }}
            >
            🗑 Vider
            </button>
        </div>

        <div className="activity-list">
            {paginated.map((ev) => (
            <div
                key={ev.id}
                className="activity-item"
                onClick={() => onOpenStudent(ev.studentId)}
            >
                <span className="activity-icon">
                {ev.kind.startsWith("student") ? "👤" : "📘"}
                </span>
                <span className="activity-label">{ev.label}</span>
                <span className="activity-date">
                {formatDistanceToNow(new Date(ev.when), {
                    addSuffix: true,
                    locale: fr,
                })}
                </span>
            </div>
            ))}
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
