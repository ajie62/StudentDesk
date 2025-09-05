import React from 'react'
import { Lesson } from '../types'
import { formatDate } from '../utils'

type Props = {
  lesson: Lesson
  onDelete: () => void
}

export default function LessonCard({ lesson, onDelete }: Props) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="badge">Créée le {formatDate(lesson.createdAt)}</div>
        <button className="btn" onClick={onDelete}>Supprimer</button>
      </div>
      <div className="lesson-columns">
        <div>
          <h4>Commentaire</h4>
          <p>{lesson.comment || <span style={{ color: 'var(--muted)' }}>—</span>}</p>
        </div>
        <div>
          <h4>Devoirs</h4>
          <p>{lesson.homework || <span style={{ color: 'var(--muted)' }}>—</span>}</p>
        </div>
      </div>
    </div>
  )
}
