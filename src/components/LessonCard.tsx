import React, { useState } from 'react'
import LessonForm from './LessonForm'
import { Lesson, BillingContract } from '../types'

type Props = {
  studentId: string
  lesson: Lesson
  allContracts: BillingContract[]
  onUpdated: () => Promise<void> | void
  onDelete: () => Promise<void> | void
}

export default function LessonCard({ studentId, lesson, allContracts, onUpdated, onDelete }: Props) {
  const [editing, setEditing] = useState(false)

  const contract = allContracts.find(c => c.id === lesson.billingId)

  async function handleSave(patch: Partial<Lesson>) {
    const payload: Partial<Lesson> = {
        comment: patch.comment ?? lesson.comment,
        homework: patch.homework ?? lesson.homework,
        billingId: patch.billingId ?? lesson.billingId,
    }

    await window.studentApi.updateLesson(studentId, lesson.id, payload)
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

      {lesson.billingId && (
        <div
          style={{
            fontSize: 12,
            color: contract ? 'var(--muted)' : '#f87171',
            marginBottom: 8,
          }}
        >
          Contrat lié : {contract?.displayName ?? lesson.billingId}{' '}
          {!contract && <span>(contrat supprimé)</span>}
        </div>
      )}

      <div className="lesson-actions">
        <button className="btn ghost" onClick={() => setEditing(true)}>Modifier</button>
        <button className="btn" onClick={() => onDelete()}>Supprimer</button>
      </div>

      {editing && (
        <LessonForm
          studentId={studentId}
          initial={lesson}
          availableContracts={allContracts.filter(c => !c.completed)}
          onClose={() => setEditing(false)}
          onSaved={handleSave}
        />
      )}
    </div>
  )
}