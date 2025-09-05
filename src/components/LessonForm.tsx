import React, { useState } from 'react'
import { Lesson } from '../types'

type Props = {
  studentId: string
  onClose: () => void
  onSaved: (payload: Partial<Lesson>) => Promise<void>
  initial?: Lesson // si présent → mode édition
}

export default function LessonForm({ studentId, onClose, onSaved, initial }: Props) {
  const [comment, setComment] = useState(initial?.comment || '')
  const [homework, setHomework] = useState(initial?.homework || '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSaved({ comment, homework })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>{initial ? 'Modifier la leçon' : 'Nouvelle leçon'}</h3>
        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label className="label">Commentaire</label>
            <textarea
              className="textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Notes sur la leçon..."
            />
          </div>

          <div className="field">
            <label className="label">Devoirs</label>
            <textarea
              className="textarea"
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="Travail à faire..."
            />
          </div>

          <div className="actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {initial ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}