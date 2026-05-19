import { useState, useEffect } from 'react'
import Board from './components/Board'
import HomeScreen from './components/HomeScreen'
import { supabase } from './lib/supabase'
import { useTheme } from './lib/useTheme'
import './App.css'

const SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 } // 5 boards per hour

function generateSlug(length = 6) {
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(b => SLUG_CHARS[b % SLUG_CHARS.length])
    .join('')
}

function checkRateLimit() {
  const now = Date.now()
  const raw = localStorage.getItem('retro-create-times')
  const times = raw ? JSON.parse(raw).filter(t => now - t < RATE_LIMIT.windowMs) : []
  if (times.length >= RATE_LIMIT.max) return false
  localStorage.setItem('retro-create-times', JSON.stringify([...times, now]))
  return true
}

export default function App() {
  const [boardId, setBoardId] = useState(null)
  const { theme, toggle } = useTheme()
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash) {
      loadBoard(hash)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadBoard(hash) {
    setLoading(true)
    // Legacy support: old links used the UUID directly
    const column = UUID_RE.test(hash) ? 'id' : 'slug'
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq(column, hash)
      .single()

    if (error || !data) {
      window.location.hash = ''
      setLoading(false)
      return
    }
    setBoardId(data.id)
    setBoard(data)
    setLoading(false)
  }

  async function createBoard(name) {
    if (!checkRateLimit()) {
      alert('You\'ve created too many boards. Please wait an hour before creating another.')
      return
    }
    let data, error, attempts = 0
    do {
      const slug = generateSlug()
      ;({ data, error } = await supabase
        .from('boards')
        .insert({ name, slug })
        .select()
        .single())
      attempts++
    } while (error?.code === '23505' && attempts < 5) // retry on slug collision

    if (error) { alert(`Error creating board: ${error.message}`); return }
    window.location.hash = data.slug
    setBoardId(data.id)
    setBoard(data)
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
    </div>
  )

  if (!boardId) return <HomeScreen onCreate={createBoard} theme={theme} onToggleTheme={toggle} />

  return <Board boardId={boardId} board={board} theme={theme} onToggleTheme={toggle} />
}
