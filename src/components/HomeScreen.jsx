import { useState } from 'react'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function HomeScreen({ onCreate, recentBoards = [], onOpenBoard, theme, onToggleTheme }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await onCreate(name.trim())
    setLoading(false)
  }

  return (
    <div className="home-screen">
      <button className="theme-toggle" onClick={onToggleTheme} title="Toggle theme">
        {theme === 'dark' ? '☀︎' : '☽'}
      </button>
      <div className="home-card">
        <div className="home-logo">
          <div className="logo-mark">R</div>
        </div>
        <h1 className="home-title">Retro Board</h1>
        <p className="home-subtitle">Run better retrospectives. No sign-up required for your team.</p>
        <form onSubmit={handleCreate} className="home-form">
          <input
            className="home-input"
            type="text"
            placeholder="Name your board (e.g. Sprint 42)"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
            autoFocus
          />
          <button className="home-btn" type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating…' : 'Create board →'}
          </button>
        </form>
        <p className="home-hint">A shareable link will be generated. Anyone with the link can collaborate.</p>

        {recentBoards.length > 0 && (
          <div className="recent-boards">
            <p className="recent-label">Recent boards</p>
            <ul className="recent-list">
              {recentBoards.map(b => (
                <li key={b.slug}>
                  <button className="recent-item" onClick={() => onOpenBoard(b.slug)}>
                    <span className="recent-name">{b.name}</span>
                    <span className="recent-time">{timeAgo(b.visitedAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
