import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import Column from './Column'
import AddColumnModal from './AddColumnModal'
import { SunIcon, MoonIcon, LinkIcon, DownloadIcon, PlusIcon, CheckIcon } from './Icons'

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

export default function Board({ boardId, board, theme, onToggleTheme }) {
  const [columns, setColumns] = useState([])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCol, setShowAddCol] = useState(false)
  const [copied, setCopied] = useState(false)
  const [votedCards, setVotedCards] = useState(getVotedCards)
  const [pendingVotes, setPendingVotes] = useState(new Set())
  const [myReactions, setMyReactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('retro-reactions') || '{}') }
    catch { return {} }
  })
  // Refs (not state) so a second click fired before React re-renders is still rejected.
  // Counts are incremented atomically in the DB, so the only thing to protect here is
  // that each toggle of the user's own vote/reaction is sent exactly once.
  const inFlight = useRef(new Set())
  const votedRef = useRef(votedCards)
  votedRef.current = votedCards
  const reactionsRef = useRef(myReactions)
  reactionsRef.current = myReactions

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
          setCards(prev => prev.some(c => c.id === payload.new.id) ? prev : [...prev, payload.new])
        } else if (payload.eventType === 'DELETE') {
          setCards(prev => prev.filter(c => c.id !== payload.old.id))
        } else if (payload.eventType === 'UPDATE') {
          setCards(prev => prev.map(c => c.id === payload.new.id ? payload.new : c))
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` }, payload => {
        if (payload.eventType === 'INSERT') {
          setColumns(prev => prev.some(c => c.id === payload.new.id) ? prev : [...prev, payload.new].sort((a, b) => a.position - b.position))
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
    const columnCards = cards.filter(c => c.column_id === columnId)
    if (columnCards.length >= 30) {
      toast('This column has reached the maximum of 30 cards.', 'error')
      return
    }
    const { error } = await supabase.from('cards').insert({
      board_id: boardId,
      column_id: columnId,
      text,
      votes: 0,
    })
    if (error) toast(`Error adding card: ${error.message}`, 'error')
  }

  async function deleteCard(cardId) {
    setCards(prev => prev.filter(c => c.id !== cardId))
    const { error } = await supabase.from('cards').delete().eq('id', cardId)
    if (error) {
      setCards(prev => [...prev, cards.find(c => c.id === cardId)].filter(Boolean))
      toast(`Error deleting card: ${error.message}`, 'error')
    }
  }

  function applyCardRow(row) {
    if (row) setCards(prev => prev.map(c => c.id === row.id ? row : c))
  }

  function setVoted(cardId, voted) {
    setVotedCards(prev => {
      const next = new Set(prev)
      if (voted) next.add(cardId)
      else next.delete(cardId)
      saveVotedCards(next)
      return next
    })
  }

  function setReacted(cardId, emoji, reacted) {
    setMyReactions(prev => {
      const current = (prev[cardId] || []).filter(e => e !== emoji)
      const next = { ...prev, [cardId]: reacted ? [...current, emoji] : current }
      localStorage.setItem('retro-reactions', JSON.stringify(next))
      return next
    })
  }

  async function voteCard(card) {
    const key = `vote:${card.id}`
    if (inFlight.current.has(key)) return
    inFlight.current.add(key)
    setPendingVotes(prev => new Set([...prev, card.id]))
    const hasVoted = votedRef.current.has(card.id)
    setVoted(card.id, !hasVoted)
    const { data, error } = await supabase.rpc('vote_card', { card_id: card.id, delta: hasVoted ? -1 : 1 })
    if (error) {
      setVoted(card.id, hasVoted)
      toast(`Error voting: ${error.message}`, 'error')
    } else {
      applyCardRow(data)
    }
    inFlight.current.delete(key)
    setPendingVotes(prev => { const s = new Set(prev); s.delete(card.id); return s })
  }

  async function reactToCard(card, emoji) {
    const key = `react:${card.id}:${emoji}`
    if (inFlight.current.has(key)) return
    inFlight.current.add(key)
    const hasReacted = (reactionsRef.current[card.id] || []).includes(emoji)
    setReacted(card.id, emoji, !hasReacted)
    const { data, error } = await supabase.rpc('react_to_card', { card_id: card.id, emoji, delta: hasReacted ? -1 : 1 })
    if (error) {
      setReacted(card.id, emoji, hasReacted)
      toast(`Error adding reaction: ${error.message}`, 'error')
    } else {
      applyCardRow(data)
    }
    inFlight.current.delete(key)
  }

  async function addColumn(title, color) {
    if (columns.length >= 10) {
      toast('This board has reached the maximum of 10 columns.', 'error')
      return
    }
    const maxPos = columns.reduce((m, c) => Math.max(m, c.position), -1)
    const { error } = await supabase.from('columns').insert({
      board_id: boardId,
      title,
      color,
      position: maxPos + 1,
    })
    if (error) toast(`Error adding column: ${error.message}`, 'error')
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
    toast('Board link copied to clipboard', 'success')
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
          <button className="header-btn" onClick={() => setShowAddCol(true)} title="Add column">
            <PlusIcon /><span className="btn-label">Add column</span>
          </button>
          <button className="header-btn icon-only" onClick={onToggleTheme} title="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="header-btn" onClick={() => window.print()} title="Export as PDF">
            <DownloadIcon /><span className="btn-label">Export PDF</span>
          </button>
          <button className="header-btn primary" onClick={copyLink} title="Copy share link">
            {copied ? <CheckIcon /> : <LinkIcon />}<span className="btn-label">{copied ? 'Copied!' : 'Share link'}</span>
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
              onReactToCard={reactToCard}
              onUpdateColumn={updateColumn}
              onDeleteColumn={deleteColumn}
              votedCards={votedCards}
              pendingVotes={pendingVotes}
              myReactions={myReactions}
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
