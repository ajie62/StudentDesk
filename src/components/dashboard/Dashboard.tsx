import { useMemo, useState, useEffect } from "react";
import { DashboardProps } from "../../types";
import { fullName } from "../../utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import PodiumStep from "./stats/PodiumStep";
import OriginsPie from "./stats/OriginsPie";
import LessonsBar from "./stats/LessonsBar";
import RevenueBar from "./stats/RevenueBar";

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

export default function Dashboard({ stats, students, events, onOpenStudent }: DashboardProps) {
  const [page, setPage] = useState(1);
  const [historyClearedAt, setHistoryClearedAt] = useState<string | null>(null);
  const PAGE_SIZE = 8;

  const randomQuote = useMemo(() => {
    return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  }, []);

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
    };
  });

  const weeklyTotal = days.reduce((acc, d) => acc + d.count, 0);

  const revenueByMonth = useMemo(() => {
    type RevenueMonth = { month: string; [currency: string]: number | string };
    const months: RevenueMonth[] = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(0, i).toLocaleString("fr-FR", { month: "short" }),
    }));

    students.forEach((s) => {
      (s.lessons || []).forEach((lesson) => {
        const d = new Date(lesson.createdAt);
        if (d.getFullYear() !== new Date().getFullYear()) return;

        const contract = (s.billingHistory || []).find((c) => c.id === lesson.billingId);
        if (!contract || !contract.pricePerLesson || !contract.currency) return;

        // Determine if this lesson is billable.
        // For package contracts: only the first `totalLessons` are paid; any extra up to `freeLessons` are free (0€).
        // For unit contracts: every lesson is billable.
        let isBillable = true;

        if (contract.mode === "package") {
          const payingCount = contract.totalLessons ?? 0; // totalLessons represents the PAID lessons in the pack
          const contractLessons = (s.lessons || [])
            .filter((l) => l.billingId === contract.id)
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

          const idx = contractLessons.findIndex((l) => l.id === lesson.id);

          // If this lesson's position is beyond the paid portion, it's one of the free lessons → not billable.
          isBillable = idx > -1 && idx < payingCount;
        }

        if (!isBillable) return;

        const m = d.getMonth();
        months[m][contract.currency] =
          ((months[m][contract.currency] as number) ?? 0) +
          (contract.pricePerLesson || 0);
      });
    });
    return months;
  }, [students]);

  const currencies = useMemo(() => {
    const set = new Set<string>();
    revenueByMonth.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key !== "month") set.add(key);
      });
    });
    return Array.from(set);
  }, [revenueByMonth]);

  const originsData = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const origin = s.origin?.trim() || "Inconnu";
      counts[origin] = (counts[origin] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [students]);

  const colors = ["#16d39a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};
    revenueByMonth.forEach((row) => {
      currencies.forEach((cur) => {
        totals[cur] = (totals[cur] ?? 0) + ((row[cur] as number) ?? 0);
      });
    });
    return totals;
  }, [revenueByMonth, currencies]);

  const top3 = useMemo(() => {
    const ranked = students
      .map((s) => ({
        id: s.id,
        name: fullName(s),
        lessons: Array.isArray(s.lessons) ? s.lessons.length : 0,
        photo: s.photo ?? null,
      }))
      .filter((s) => s.lessons > 0)
      .sort((a, b) => b.lessons - a.lessons)
      .slice(0, 3);

    while (ranked.length < 3) {
      ranked.push({
        id: `placeholder-${ranked.length + 1}`,
        name: "—",
        lessons: 0,
        photo: null,
      });
    }
    return ranked;
  }, [students]);

  async function handleClearHistory() {
    const ok = window.confirm("Effacer définitivement l'historique ?");
    if (!ok) return;
    try {
      await window.studentApi.clearHistory?.();
      const ts = await window.studentApi.getHistoryClearedAt?.();
      setHistoryClearedAt(ts || null);
      setPage(1);
    } catch (e) {
      console.error("clearHistory failed:", e);
    }
  }

  return (
    <div className="dash">
      <h2>Tableau de bord</h2>
      <p className="motivational-quote">{randomQuote}</p>

      <div className="dash-grid">
        <div className="dashboard-card full-width">
          <h3>Top 3 étudiants (leçons)</h3>
          {top3.every((s) => s.lessons === 0) ? (
            <div className="empty-state">Aucune leçon enregistrée.</div>
          ) : (
            <div className="podium-wrap">
              <PodiumStep rank={2} student={top3[1]} />
              <PodiumStep rank={1} student={top3[0]} />
              <PodiumStep rank={3} student={top3[2]} />
            </div>
          )}
        </div>

        <div className="dashboard-card full-width">
          <div className="double-chart">
            <div className="chart-half">
              <RevenueBar
                revenueByMonth={revenueByMonth}
                currencies={currencies}
                colors={colors}
                totalsByCurrency={totalsByCurrency}
              />
            </div>
            <div className="chart-half">
              <LessonsBar days={days} weeklyTotal={weeklyTotal} />
            </div>
          </div>
        </div>

        <div className="dashboard-card pie">
          <h3>Actifs / Inactifs</h3>
          <div className="chart-container relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <circle
                  cx="50%"
                  cy="50%"
                  r={85}
                  fill="none"
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={30}
                />
                <Pie
                  data={[
                    { name: "Actifs", value: stats.active, fill: "#16d39a" },
                    { name: "Inactifs", value: stats.inactive, fill: "#ef4444" },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2.5}
                  cornerRadius={10}
                  dataKey="value"
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
                  cursor={{ fill: "rgba(59,130,246,0.15)" }}
                  formatter={(value: number, name: string) => [`${name} : ${value}`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-value">{stats.total}</span>
              <span className="donut-label">Étudiants</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card pie">
          <h3>Origine des étudiants</h3>
          <div className="chart-container relative">
            {originsData.length === 0 ? (
              <div className="empty-state">Aucune origine définie.</div>
            ) : (
              <OriginsPie data={originsData} colors={colors} />
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
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
            <div className="empty-state">Aucune activité.</div>
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
                  {formatDistanceToNow(new Date(ev.when), { addSuffix: true, locale: fr })}
                </span>
              </div>
            ))
          )}
        </div>
        {pageCount > 1 && (
          <div className="pagination">
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
