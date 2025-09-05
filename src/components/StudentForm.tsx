import React, { useEffect, useState, useRef } from 'react'
import { Student } from '../types'

type Props = {
  initial?: Partial<Student>
  onSaved: (payload: Partial<Student>) => void | Promise<void>
  onClose: () => void
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function StudentForm({ initial, onSaved, onClose }: Props) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null)
  const [saving, setSaving] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Auto-expand de la textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [description])

  async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/^image\/(png|jpeg)$/.test(f.type)) {
      alert('Formats autorisés : PNG ou JPG.')
      e.target.value = ''
      return
    }
    const dataUrl = await fileToDataURL(f)
    setPhoto(dataUrl)
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Prénom et Nom sont requis.')
      return
    }
    setSaving(true)
    try {
      await onSaved({ firstName, lastName, description, isActive, photo })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div
        className="card modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={initial ? 'Modifier l’étudiant' : 'Nouvel étudiant'}
      >
        <h3>{initial ? 'Modifier l’étudiant' : 'Nouvel étudiant'}</h3>

        {/* Photo + boutons */}
        <div className="field-photo">
          <div className="avatar avatar--lg">
            {photo ? (
              <img src={photo} alt="Photo de l’étudiant" />
            ) : (
              <div className="avatar__placeholder">?</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label className="btn" style={{ cursor: 'pointer' }}>
              Importer une photo
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handlePickFile}
                style={{ display: 'none' }}
              />
            </label>
            {photo && (
              <button className="btn ghost" onClick={() => setPhoto(null)}>
                Supprimer la photo
              </button>
            )}
          </div>
        </div>

        {/* Champs texte */}
        <div className="field">
          <label className="label" htmlFor="firstName">Prénom</label>
          <input
            id="firstName"
            className="input"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Prénom de l’étudiant"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="lastName">Nom</label>
          <input
            id="lastName"
            className="input"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Nom de l’étudiant"
          />
        </div>

        <div className="field">
          <label className="label" htmlFor="desc">Description</label>
          <textarea
            id="desc"
            ref={textareaRef}
            className="textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Notes générales à propos de l’étudiant"
          />
        </div>

        {/* Switch Actif */}
        <div className="field">
          <label className="switch">
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
            />
            <span className="track"><span className="thumb" /></span>
            <span className="text">Actif</span>
          </label>
        </div>

        {/* Actions */}
        <div className="actions">
          <button className="btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button className="btn ghost" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
