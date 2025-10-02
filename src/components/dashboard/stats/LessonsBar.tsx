import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { LessonsBarProps } from "../../../types";

export default function LessonsBar({ days, weeklyTotal }: LessonsBarProps) {
  return (
    <div className="dashboard-card">
      <h3>Leçons (7 derniers jours)</h3>
      <div className="chart-container">
        <ResponsiveContainer>
          <BarChart data={days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d2d30" />
            <XAxis
              dataKey="day"
              stroke="#9ca3af"
              interval={0}
              tickFormatter={(value, index) => (index % 2 === 0 ? value : "")}
            />
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
  );
}
