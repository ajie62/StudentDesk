import React, { useEffect, useRef, useState } from "react";
import { Student } from "../types";

type Props = {
  initial?: Student;
  onClose: () => void;
  onSaved: (payload: Partial<Student>) => Promise<void> | void;
};

export default function StudentForm({ initial, onClose, onSaved }: Props): JSX.Element {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  // auto-grow pour la textarea
  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [description]);

  function pickFile() {
    fileInputRef.current?.click();
  }

  async function resizeImage(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width;
          let h = img.height;

          if (w > h) {
            if (w > maxSize) {
              h *= maxSize / w;
              w = maxSize;
            }
          } else {
            if (h > maxSize) {
              w *= maxSize / h;
              h = maxSize;
            }
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Impossible de créer le canvas"));

          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL(file.type, 0.85)); // qualité 85%
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const resized = await resizeImage(f, 130);
      setPhoto(resized);
    } catch (err) {
      console.error("Erreur lors du redimensionnement de l’image", err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSaved({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      description: description.trim(),
      isActive,
      photo,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3>{initial ? "Modifier l’étudiant" : "Nouvel étudiant"}</h3>

        {/* Bloc avatar + bouton import (colonne gauche fixe 130px) */}
        <div className="field-photo">
          <div className="avatar avatar--lg" style={{ width: 130, height: 130 }}>
            {photo ? (
              <img src={photo} alt="" />
            ) : (
              <div className="avatar__placeholder" style={{ fontSize: 18 }}>
                ?
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" className="btn" onClick={pickFile}>
                Importer une photo
              </button>
              {photo && (
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setPhoto(null)}
                  title="Retirer la photo"
                >
                  Retirer
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              style={{ display: "none" }}
            />

            <div style={{ fontSize: 13, color: "var(--muted)" }}>
              JPG/PNG. Redimensionné automatiquement (max 130×130).
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Prénom</label>
            <input
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label className="label">Nom</label>
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Description</label>
            <textarea
              ref={descRef}
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes générales, contexte, objectifs…"
            />
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="track">
              <span className="thumb" />
            </span>
            <span>Étudiant actif</span>
          </label>

          <div className="actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn">
              {initial ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
