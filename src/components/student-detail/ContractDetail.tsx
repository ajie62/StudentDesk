import type { Student, Lesson, BillingContract } from "../../types";
import "../../styles.css";

interface ContractDetailProps {
  student: Student;
  contract: BillingContract;
  lessons: Lesson[];
  onBack: () => void;
}

export default function ContractDetail({
  student,
  contract,
  lessons,
  onBack,
}: ContractDetailProps) {
  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="content container">
      {/* Bouton de retour */}
      <button onClick={onBack} className="btn ghost small" style={{ marginBottom: "20px" }}>
        ←
      </button>

      {/* Bloc principal */}
      <div className="card contract-detail">
        <h2>Contrat terminé</h2>
        <div className="contract-meta">
          <div>
            <strong>ID :</strong> {contract.id}
          </div>
          <div>
            <strong>Mode :</strong> {contract.mode || "—"}
          </div>
          <div>
            <strong>Total leçons :</strong> {contract.totalLessons ?? 0}
          </div>
          <div>
            <strong>Gratuites :</strong> {contract.freeLessons ?? 0}
          </div>
          <div>
            <strong>Créé le :</strong> {formatDate(contract.createdAt)}
          </div>
          <div>
            <strong>Terminé le :</strong> {formatDate(contract.completedAt)}
          </div>
        </div>
      </div>

      {/* Liste des leçons */}
      <div className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <h3>Leçons de ce contrat</h3>
          <span className="badge">
            {lessons.length} leçon{lessons.length > 1 ? "s" : ""}
          </span>
        </div>

        {lessons.length === 0 ? (
          <p className="empty-state">Aucune leçon associée à ce contrat.</p>
        ) : (
          <div className="list">
            {lessons.map((l) => (
              <div key={l.id} className="lesson-item">
                <div className="lesson-columns">
                  <div>
                    <h4>Commentaire</h4>
                    <p>{l.comment || "—"}</p>
                  </div>
                  <div>
                    <h4>Devoirs</h4>
                    <p>{l.homework || "—"}</p>
                  </div>
                </div>
                <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--muted)" }}>
                  {formatDate(l.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
