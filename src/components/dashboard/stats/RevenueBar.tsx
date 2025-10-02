import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { RevenueBarProps } from "../../../types";

export default function RevenueBar({
  revenueByMonth,
  currencies,
  colors,
  totalsByCurrency,
}: RevenueBarProps) {
  // ✅ Liste fixe des mois en français
  const monthLabels = [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];

  // ✅ Remap les données pour forcer les mois corrects dans l’ordre
  const normalizedData = useMemo(() => {
    return monthLabels.map((m, idx) => ({
      ...revenueByMonth[idx], // d’abord les valeurs existantes
      month: m, // puis on force notre libellé
    }));
  }, [revenueByMonth]);

  return (
    <div className="dashboard-card">
      <h3>Revenus annuels ({new Date().getFullYear()})</h3>
      <div className="chart-container">
        {currencies.length === 0 ? (
          <div className="empty-state">Aucun revenu enregistré pour l’instant.</div>
        ) : (
          <ResponsiveContainer>
            <BarChart data={normalizedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                interval={0} // on affiche tous les ticks
                tickFormatter={(value, index) => (index % 2 === 0 ? value : "")}
              />
              <YAxis stroke="#9ca3af" allowDecimals={false} />
              <Tooltip
                formatter={(val: number, name: string, props) => {
                  if (props && props.payload && props.payload.length > 0 && props.payload[0].payload.isFree === true) {
                    return null;
                  }
                  return `${val} ${name}`;
                }}
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
  );
}
