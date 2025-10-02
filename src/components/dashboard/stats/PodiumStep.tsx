import { PodiumStepProps } from "@/types";
import React from "react";

export default function PodiumStep({ rank, student }: PodiumStepProps) {
  const crowns = { 1: "🥇", 2: "🥈", 3: "🥉" };

  if (!student) {
    return (
      <div className={`podium-step step-${rank} placeholder`}>
        <div className="step-rank">{rank}</div>
        <div className="step-name muted">—</div>
        <div className="step-meta muted">—</div>
      </div>
    );
  }

  const initials = (student.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`podium-step step-${rank}`}
      title={`${student.name} • ${student.lessons} leçons`}
    >
      {crowns[rank] && <div className="crown">{crowns[rank]}</div>}

      <div className="step-rank">{rank}</div>

      {/* Avatar + Nom */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div className="avatar avatar--sm" aria-hidden="true">
          {student.photo ? (
            <img src={student.photo} alt={student.name} />
          ) : (
            <div className="avatar__placeholder">{initials}</div>
          )}
        </div>
        <div className="step-name">{student.name}</div>
      </div>

      <div className="step-meta">{student.lessons} leçons</div>
    </div>
  );
}
