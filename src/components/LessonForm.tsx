import React, { useEffect, useState } from 'react'

type Props = {
  onSaved: (payload: { comment: string; homework: string }) => void | Promise<void>
  onClose: () => void
}

export default function LessonForm({ onSaved, onClose }: Props) {
  const [comment, setComment] = useState('')
  const [homework, setHomework] = useState('')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div style={overlay}>
      <div style={modal} className="card">
        <h3 style={{ marginTop: 0 }}>Ajouter une leçon</h3>

        <div className="form-row">
          <label>Commentaire (déroulement de la leçon)</label>
          <textarea className="textarea" value={comment} onChange={e => setComment(e.target.value)} />
        </div>

        <div className="form-row">
          <label>Devoirs (à faire pour la prochaine leçon)</label>
          <textarea className="textarea" value={homework} onChange={e => setHomework(e.target.value)} />
        </div>

        <div className="actions">
          <button className="btn" onClick={() => onSaved({ comment, homework })}>
            Enregistrer
          </button>
          <button className="btn ghost" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
  display: 'grid', placeItems: 'center', zIndex: 50
}
const modal: React.CSSProperties = { width: 700, maxWidth: '95vw' }
