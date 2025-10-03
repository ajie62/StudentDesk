import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { OriginsPieProps } from "../../../types";

const RADIAN = Math.PI / 180;

const renderOriginLabel = ({
  cx,
  cy,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  name,
}: any) => {
  if (!cx || !cy) return null;

  const radius = innerRadius + (outerRadius - innerRadius) / 2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight="600"
    >
      {name}
    </text>
  );
};

export default function OriginsPie({ data, colors = [] }: OriginsPieProps) {
  const { t } = useTranslation();
  if (!data || data.length === 0) {
    return <div className="empty-state">{t("dashboard.origins.empty")}</div>;
  }

  return (
    // Hauteur fixe → évite le "clignotement" au montage
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            labelLine={false}
            label={renderOriginLabel}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
            ))}
          </Pie>
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
    </div>
  );
}
