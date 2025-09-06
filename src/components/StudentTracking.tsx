import React, { useMemo, useRef } from 'react'
import type { CEFR, Lesson } from '../types'

type ViewModel = {
  firstName: string
  lastName: string
  lessons: Lesson[]
  goals: string
  progress: number
  cefr: {
    oral?: CEFR
    ecrit?: CEFR
    interaction?: CEFR
    grammaire?: CEFR
    vocabulaire?: CEFR
  }
  tags: string[]
}

type Props = {
  viewModel: ViewModel
  onChange: (patch: Partial<Pick<ViewModel, 'goals' | 'progress' | 'cefr' | 'tags'>>) => void
}

const CEFR_LEVELS: CEFR[] = ['A1','A2','B1','B2','C1','C2']

export default function StudentTracking({ viewModel, onChange }: Props) {
  const { firstName, lastName, lessons, goals, progress, cefr, tags } = viewModel
  const printRef = useRef<HTMLDivElement>(null)

  const lessonsCount = lessons?.length ?? 0
  const lastLessonDate = useMemo(() => {
    const ll = [...(lessons || [])].sort((a,b) => b.createdAt.localeCompare(a.createdAt))[0]
    return ll ? new Date(ll.createdAt).toLocaleDateString() : '—'
  }, [lessons])

  function updateCEFR(key: keyof NonNullable<ViewModel['cefr']>, val: CEFR|undefined) {
    onChange({ cefr: { ...(cefr||{}), [key]: val } })
  }

  function addTag(tag: string) {
    tag = tag.trim()
    if (!tag) return
    const set = new Set([...(tags||[]), tag])
    onChange({ tags: [...set] })
  }
  function removeTag(tag: string) {
    onChange({ tags: (tags||[]).filter(t => t !== tag) })
  }

  function exportPDF() {
    const node = printRef.current
    if (!node) return
    const win = window.open('', '_blank', 'width=840,height=1080')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Bilan – ${firstName} ${lastName}</title>
          <style>
            body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            h2 { margin: 16px 0 8px; font-size: 16px; }
            .chip { display:inline-block; padding:4px 8px; border:1px solid #ddd; border-radius:12px; margin:2px 6px 2px 0; }
            table { border-collapse: collapse; width: 100%; }
            td { padding: 4px 0; }
            .muted { color:#666; }
          </style>
        </head>
        <body>${node.innerHTML}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  return (
    <div className="tracking">
      {/* progression */}
      <div className="stat-card wide" style={{ marginBottom: 16 }}>
        <div className="stat-icon">📈</div>
        <div>
          <div className="stat-label">Progression estimée</div>
          <div className="stat-value">{progress ?? 0}%</div>
          <input
            type="range"
            min={0} max={100}
            value={progress ?? 0}
            onChange={(e)=> onChange({ progress: Number(e.target.value) })}
            aria-label="Progression"
            style={{ width: 240, marginTop: 8 }}
          />
        </div>
      </div>

      {/* objectifs */}
      <div className="stat-card wide" style={{ marginBottom: 16 }}>
        <div className="stat-icon">🎯</div>
        <div style={{ width: '100%' }}>
          <div className="stat-label">Objectifs</div>
          <textarea
            className="input"
            placeholder="Ex: Atteindre B1 en compréhension orale d’ici juin…"
            value={goals}
            onChange={(e)=> onChange({ goals: e.target.value })}
            rows={4}
            style={{ width: '100%', marginTop: 8 }}
          />
        </div>
      </div>

      {/* CECRL */}
      <div className="stat-card wide" style={{ marginBottom: 16 }}>
        <div className="stat-icon">🧭</div>
        <div style={{ width: '100%' }}>
          <div className="stat-label">Niveaux CECRL</div>
          <div className="grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginTop:8 }}>
            {[
              ['oral','Compréhension orale'],
              ['ecrit','Production écrite'],
              ['interaction','Interaction'],
              ['grammaire','Grammaire'],
              ['vocabulaire','Vocabulaire'],
            ].map(([key,label]) => (
              <label key={key} className="input-row">
                <span style={{ display:'block', fontSize:12, color:'#999' }}>{label}</span>
                <select
                  className="input"
                  value={(cefr?.[key as keyof NonNullable<ViewModel['cefr']>] as CEFR) || ''}
                  onChange={(e)=> updateCEFR(key as any, (e.target.value || undefined) as CEFR|undefined)}
                >
                  <option value="">—</option>
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* tags */}
      <div className="stat-card wide" style={{ marginBottom: 16 }}>
        <div className="stat-icon">🏷️</div>
        <div style={{ width: '100%' }}>
          <div className="stat-label">Tags</div>
          <div style={{ marginTop: 8 }}>
            {(tags||[]).map(t => (
              <span key={t} className="chip">
                {t}{' '}
                <button className="btn small" onClick={()=> removeTag(t)} aria-label={`Retirer ${t}`}>×</button>
              </span>
            ))}
          </div>
          <form
            onSubmit={(e)=> { e.preventDefault(); const f=e.currentTarget; const input = (f.elements.namedItem('tag') as HTMLInputElement); addTag(input.value); input.value=''; }}
            style={{ marginTop: 8 }}
          >
            <input name="tag" className="input" placeholder="Ajouter un tag (Entrée)" />
          </form>
        </div>
      </div>

      {/* mini synthèse imprimable */}
      <div className="stat-card wide" style={{ marginBottom: 8 }}>
        <div className="stat-icon">🧾</div>
        <div style={{ width:'100%' }}>
          <div className="stat-label">Bilan imprimable</div>
          <div ref={printRef} style={{ paddingTop: 8 }}>
            <h1>{firstName} {lastName}</h1>
            <table>
              <tbody>
                <tr><td><strong>Dernière leçon</strong></td><td className="muted">{lastLessonDate}</td></tr>
                <tr><td><strong>Leçons totales</strong></td><td className="muted">{lessonsCount}</td></tr>
                <tr><td><strong>Progression</strong></td><td className="muted">{progress ?? 0}%</td></tr>
              </tbody>
            </table>
            <h2>Objectifs</h2>
            <div>{(goals||'—').split('\n').map((l,i)=><div key={i}>{l}</div>)}</div>
            <h2>Niveaux CECRL</h2>
            <div>
              {['oral','ecrit','interaction','grammaire','vocabulaire'].map(k => (
                <div key={k}>
                  <strong style={{ display:'inline-block', width:140, fontSize:12, color:'#666', textTransform:'capitalize' }}>{k}</strong>
                  <span>{cefr?.[k as keyof NonNullable<ViewModel['cefr']>] ?? '—'}</span>
                </div>
              ))}
            </div>
            <h2>Tags</h2>
            <div>{(tags||[]).map(t => <span key={t} className="chip">{t}</span>)}</div>
          </div>

          <button className="btn" style={{ marginTop: 10 }} onClick={exportPDF}>
            ⤓ Exporter en PDF
          </button>
        </div>
      </div>
    </div>
  )
}
