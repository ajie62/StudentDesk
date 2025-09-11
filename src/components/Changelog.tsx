import React, { useEffect, useMemo, useState } from "react"
import "./changelog.css"

type Release = {
  version: string
  date: string
  notes: string
  url: string
}

type GitHubRelease = {
  tag_name?: string
  name?: string
  published_at?: string
  created_at?: string
  body?: string
  html_url?: string
  draft?: boolean
  prerelease?: boolean
}

const OWNER = "ajie62"
const REPO = "StudentDesk"
const PER_PAGE_UI = 5

export default function Changelog() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // On récupère TOUTES les releases (non draft). Par défaut on masque les pre-releases
        const res = await fetch(
          `https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=100`
        )
        if (!res.ok) {
          // Messages un peu plus parlants si rate limit, etc.
          const hint =
            res.status === 403
              ? "Rate limit GitHub atteinte (essaye plus tard)."
              : res.status === 404
              ? "Repo introuvable (le dépôt est-il bien public ?)."
              : `HTTP ${res.status}`
          throw new Error(hint)
        }

        const data: GitHubRelease[] = await res.json()

        // Filtre: on ignore les drafts; on garde les pre-releases mais tu peux les masquer si tu veux
        const mapped: Release[] = (data || [])
          .filter((r) => !r.draft) // .filter(r => !r.prerelease) pour masquer les pre-releases
          .map((r) => ({
            version:
              (r.tag_name || r.name || "").replace(/^v/i, "") || "0.0.0",
            date: (r.published_at || r.created_at || "").slice(0, 10),
            notes: (r.body || "").trim() || "—",
            url:
              r.html_url ||
              `https://github.com/${OWNER}/${REPO}/releases`,
          }))

        // Tri décroissant par date (GitHub renvoie déjà dans l’ordre, on sécurise)
        mapped.sort((a, b) => (b.date || "").localeCompare(a.date || ""))

        if (!cancelled) {
          setReleases(mapped)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg =
            e instanceof Error
              ? e.message
              : "Impossible de charger les releases."
          setError(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const totalPages = Math.max(1, Math.ceil(releases.length / PER_PAGE_UI))
  const current = useMemo(() => {
    const start = (page - 1) * PER_PAGE_UI
    return releases.slice(start, start + PER_PAGE_UI)
  }, [releases, page])

  // Si on supprime des releases et qu’on se retrouve hors pagination, on recadre
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="changelog">
      <h1 className="changelog-title">Historique des versions</h1>

      {loading && (
        <ul className="changelog-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="changelog-item" aria-busy="true">
              <div className="changelog-header">
                <span
                  className="changelog-version skeleton"
                  style={{ width: 90, display: "inline-block" }}
                >
                  &nbsp;
                </span>
                <span
                  className="changelog-date skeleton"
                  style={{ width: 110, display: "inline-block" }}
                >
                  &nbsp;
                </span>
              </div>
              <p className="changelog-notes skeleton" style={{ height: 48 }} />
            </li>
          ))}
        </ul>
      )}

      {!loading && error && (
        <div className="changelog-item" style={{ textAlign: "center" }}>
          <p style={{ color: "#f88", margin: 0 }}>⚠️ {error}</p>
          <p style={{ color: "#aaa", fontSize: 13, marginTop: 8 }}>
            Vérifie que le dépôt GitHub <code>{OWNER}/{REPO}</code> est public et
            que tu as bien publié une release.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {current.length === 0 ? (
            <div className="changelog-item" style={{ textAlign: "center" }}>
              <p style={{ margin: 0, color: "#aaa" }}>
                Aucune release trouvée pour le moment.
              </p>
            </div>
          ) : (
            <ul className="changelog-list">
              {current.map((r) => (
                <li
                  key={`${r.version}-${r.date}`}
                  className="changelog-item"
                >
                  <div className="changelog-header">
                    <span className="changelog-version">v{r.version}</span>
                    <span className="changelog-date">{r.date}</span>
                  </div>
                  <p
                    className="changelog-notes"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {r.notes}
                  </p>
                  <div style={{ marginTop: 10 }}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn segment"
                      style={{ textDecoration: "none" }}
                    >
                      Voir sur GitHub
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {releases.length > PER_PAGE_UI && (
            <div className="changelog-pagination">
              <button
                className="btn small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ◀
              </button>
              <span>
                Page {page} / {totalPages}
              </span>
              <button
                className="btn small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
