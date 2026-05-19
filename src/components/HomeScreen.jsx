import { useState } from 'react'

export default function HomeScreen({ onCreate, theme, onToggleTheme }) {
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
            autoFocus
          />
          <button className="home-btn" type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating…' : 'Create board →'}
          </button>
        </form>
        <p className="home-hint">A shareable link will be generated. Anyone with the link can collaborate.</p>
      </div>
    </div>
  )
}
