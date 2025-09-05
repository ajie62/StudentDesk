import React, { useState } from 'react'
import LessonForm from './LessonForm'
import { Lesson } from '../types'

type Props = {
  studentId: string
  lesson: Lesson
  onUpdated: () => Promise<void> | void
  onDelete: () => Promise<void> | void
}

export default function LessonCard({ studentId, lesson, onUpdated, onDelete }: Props) {
  const [editing, setEditing] = useState(false)

  async function handleSave(patch: Partial<Lesson>) {
    await window.studentApi.updateLesson(studentId, lesson.id, {
      comment: patch.comment ?? lesson.comment,
      homework: patch.homework ?? lesson.homework,
    })
    setEditing(false)
    await onUpdated()
  }

  return (
    <div className="card">
      <div className="lesson-columns" style={{ marginBottom: 12 }}>
        <div>
          <h4>Commentaire</h4>
          <p>{lesson.comment || <span style={{ color: 'var(--muted)' }}>—</span>}</p>
        </div>
        <div>
          <h4>Devoirs</h4>
          <p>{lesson.homework || <span style={{ color: 'var(--muted)' }}>—</span>}</p>
        </div>
      </div>

      <div className="lesson-actions">
        <button className="btn ghost" onClick={() => setEditing(true)}>Modifier</button>
        <button className="btn" onClick={() => onDelete()}>Supprimer</button>
      </div>

      {editing && (
        <LessonForm
          studentId={studentId}
          initial={lesson}
          onClose={() => setEditing(false)}
          onSaved={handleSave}
        />
      )}
    </div>
  )
}
