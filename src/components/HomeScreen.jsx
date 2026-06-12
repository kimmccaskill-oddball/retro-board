import { useState } from 'react'
import { timeAgo } from '../lib/timeAgo'
import { SunIcon, MoonIcon, BoltIcon, HeartIcon, FileIcon } from './Icons'

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
      <div className="home-bg" aria-hidden="true" />
      <button className="theme-toggle" onClick={onToggleTheme} title="Toggle theme">
        {theme === 'dark' ? <SunIcon size={17} /> : <MoonIcon size={17} />}
      </button>
      <div className="home-card">
        <div className="home-logo">
          <div className="logo-mark">R</div>
        </div>
        <h1 className="home-title">Retro Board</h1>
        <p className="home-subtitle">Run better retrospectives with your team — real-time, no sign-up required.</p>
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
        <div className="home-features">
          <span className="feature-pill"><BoltIcon /> Real-time sync</span>
          <span className="feature-pill"><HeartIcon /> Votes &amp; reactions</span>
          <span className="feature-pill"><FileIcon /> PDF export</span>
        </div>
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
