import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Column from './Column'
import AddColumnModal from './AddColumnModal'

const DEFAULT_COLUMNS = [
  { title: 'Went well', color: '#1D9E75' },
  { title: 'To improve', color: '#D85A30' },
  { title: 'Action items', color: '#185FA5' },
]

function getUserId() {
  let id = localStorage.getItem('retro-user-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('retro-user-id', id)
  }
  return id
}

function getVotedCards() {
  try { return new Set(JSON.parse(localStorage.getItem('retro-voted-cards') || '[]')) }
  catch { return new Set() }
}

function saveVotedCards(set) {
  localStorage.setItem('retro-voted-cards', JSON.stringify([...set]))
}

export default function Board({ boardId, board }) {
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCol, setShowAddCol] = useState(false)
  const [copied, setCopied] = useState(false)
  const [votedCards, setVotedCards] = useState(getVotedCards)

  useEffect(() => {
    initBoard()
  }, [boardId])

  async function initBoard() {
    setLoading(true)
    let { data: cols } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', boardId)
      .order('position')

    if (!cols || cols.length === 0) {
      const toInsert = DEFAULT_COLUMNS.map((c, i) => ({
        board_id: boardId,
        title: c.title,
        color: c.color,
        position: i,
      }))
      const { data: inserted } = await supabase.from('columns').insert(toInsert).select()
      cols = inserted || []
    }

    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at')

    setColumns(cols || [])
    setCards(cardData || [])
    setLoading(false)
  }

  useEffect(() => {
    const channel = supabase
      .channel(`board-${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards', filter: `board_id=eq.${boardId}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setCards(prev => [...prev, payload.new])
        } else if (payload.eventType === 'DELETE') {
          setCards(prev => prev.filter(c => c.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setCards(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setColumns(prev => [...prev, payload.new].sort((a, b) => a.position - b.position))
        } else if (payload.eventType === 'DELETE') {
          setColumns(prev => prev.filter(c => c.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setColumns(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [boardId])

  async function addCard(columnId, text) {
    const { error } = await supabase.from('cards').insert({
      board_id: boardId,
      column_id: columnId,
      text,
      votes: 0,
    })
    if (error) alert(`Error adding card: ${error.message}`)
  }

  async function deleteCard(cardId) {
    setCards(prev => prev.filter(c => c.id !== cardId))
    const { error } = await supabase.from('cards').delete().eq('id', cardId)
    if (error) {
      setCards(prev => [...prev, cards.find(c => c.id === cardId)].filter(Boolean))
      alert(`Error deleting card: ${error.message}`)
    }
  }

  async function voteCard(card) {
    const hasVoted = votedCards.has(card.id)
    const newVotes = hasVoted ? card.votes - 1 : card.votes + 1
    const newVotedCards = new Set(votedCards)
    if (hasVoted) newVotedCards.delete(card.id)
    else newVotedCards.add(card.id)
    setVotedCards(newVotedCards)
    saveVotedCards(newVotedCards)
    const { error } = await supabase.from('cards').update({ votes: newVotes }).eq('id', card.id)
    if (error) {
      setVotedCards(votedCards)
      saveVotedCards(votedCards)
      alert(`Error voting: ${error.message}`)
    }
  }

  async function addColumn(title, color) {
    const maxPos = columns.reduce((m, c) => Math.max(m, c.position), -1)
    const { error } = await supabase.from('columns').insert({
      board_id: boardId,
      title,
      color,
      position: maxPos + 1,
    })
    if (error) alert(`Error adding column: ${error.message}`)
  }

  async function updateColumn(colId, updates) {
    await supabase.from('columns').update(updates).eq('id', colId)
  }

  async function deleteColumn(colId) {
    setCards(prev => prev.filter(c => c.column_id !== colId))
    setColumns(prev => prev.filter(c => c.id !== colId))
    await supabase.from('cards').delete().eq('column_id', colId)
    await supabase.from('columns').delete().eq('id', colId)
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
    </div>
  )

  const totalCards = cards.length

  return (
    <div className="board-page">
      <header className="board-header">
        <div className="board-header-left">
          <a href="/" className="logo-small" onClick={e => { e.preventDefault(); window.location.hash = ''; window.location.reload() }}>R</a>
          <div>
            <h1 className="board-name">{board.name}</h1>
            <span className="board-meta">{totalCards} card{totalCards !== 1 ? 's' : ''} · {columns.length} column{columns.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="board-header-right">
          <button className="header-btn" onClick={() => setShowAddCol(true)}>
            + Add column
          </button>
          <button className="header-btn" onClick={() => window.print()}>
            ↓ Export PDF
          </button>
          <button className="header-btn primary" onClick={copyLink}>
            {copied ? '✓ Copied!' : '⟳ Share link'}
          </button>
        </div>
      </header>

      <div className="columns-scroll">
        <div className="columns-track">
          {columns.map(col => (
            <Column
              key={col.id}
              column={col}
              cards={cards.filter(c => c.column_id === col.id)}
              onAddCard={addCard}
              onDeleteCard={deleteCard}
              onVoteCard={voteCard}
              onUpdateColumn={updateColumn}
              onDeleteColumn={deleteColumn}
              votedCards={votedCards}
            />
          ))}
        </div>
      </div>

      {showAddCol && (
        <AddColumnModal
          onAdd={addColumn}
          onClose={() => setShowAddCol(false)}
        />
      )}
    </div>
  )
}
