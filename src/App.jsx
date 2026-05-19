import { useState, useEffect } from 'react'
import Board from './components/Board'
import HomeScreen from './components/HomeScreen'
import { supabase } from './lib/supabase'
import './App.css'

export default function App() {
  const [boardId, setBoardId] = useState(null)
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

  async function loadBoard(id) {
    setLoading(true)
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      window.location.hash = ''
      setLoading(false)
      return
    }
    setBoardId(id)
    setBoard(data)
    setLoading(false)
  }

  async function createBoard(name) {
    const { data, error } = await supabase
      .from('boards')
      .insert({ name })
      .select()
      .single()

    if (error) { alert(`Error creating board: ${error.message}`); return }
    window.location.hash = data.id
    setBoardId(data.id)
    setBoard(data)
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
    </div>
  )

  if (!boardId) return <HomeScreen onCreate={createBoard} />

  return <Board boardId={boardId} board={board} />
}
