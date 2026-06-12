import { useState } from 'react'
import Card from './Card'
import ConfirmModal from './ConfirmModal'
import { PencilIcon, TrashIcon, PlusIcon } from './Icons'

export default function Column({ column, cards, onAddCard, onDeleteCard, onVoteCard, onReactToCard, onUpdateColumn, onDeleteColumn, votedCards, pendingVotes = new Set(), myReactions }) {
  const [inputOpen, setInputOpen] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(column.title)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null) // { message, onConfirm }


  async function handleAdd() {
    if (!inputVal.trim()) return
    await onAddCard(column.id, inputVal.trim())
    setInputVal('')
    setInputOpen(false)
  }

  async function saveTitle() {
    if (!editTitle.trim()) { setEditTitle(column.title); setEditing(false); return }
    setSaving(true)
    await onUpdateColumn(column.id, { title: editTitle.trim() })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="column" style={{ '--col-color': column.color }}>
      <div className="col-header">
        <div className="col-dot" style={{ background: column.color }} />
        {editing ? (
          <input
            className="col-title-input"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditTitle(column.title); setEditing(false) } }}
            autoFocus
            disabled={saving}
          />
        ) : (
          <span className="col-title" onClick={() => setEditing(true)} title="Click to rename">{column.title}</span>
        )}
        <div className="col-actions">
          <span className="col-count">{cards.length}</span>
          <button className="icon-btn" onClick={() => setEditing(true)} title="Rename column"><PencilIcon /></button>
          <button className="icon-btn danger" onClick={() => setConfirm({ message: 'Are you sure you want to delete this column?', onConfirm: () => onDeleteColumn(column.id) })} title="Delete column"><TrashIcon /></button>
        </div>
      </div>

      <div className="col-body">
        {cards.length === 0 && !inputOpen && (
          <p className="empty-hint">No cards yet — add the first one</p>
        )}
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            color={column.color}
            hasVoted={votedCards.has(card.id)}
            votePending={pendingVotes.has(card.id)}
            myReactions={myReactions[card.id] || []}
            onDelete={() => setConfirm({ message: 'Are you sure you want to delete this card?', onConfirm: () => onDeleteCard(card.id) })}
            onVote={() => onVoteCard(card)}
            onReact={(card, emoji) => onReactToCard(card, emoji)}
          />
        ))}

        {inputOpen ? (
          <div className="card-input-wrap">
            <textarea
              className="card-textarea"
              placeholder="What's on your mind?"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } if (e.key === 'Escape') setInputOpen(false) }}
              maxLength={500}
              autoFocus
              rows={3}
            />
            <div className="card-input-btns">
              <button className="small-btn" onClick={() => { setInputOpen(false); setInputVal('') }}>Cancel</button>
              <button className="small-btn primary" onClick={handleAdd}>Add card</button>
            </div>
          </div>
        ) : (
          <button
            className="add-card-trigger"
            onClick={() => setInputOpen(true)}
            disabled={cards.length >= 30}
            title={cards.length >= 30 ? 'Column is full (30 cards max)' : undefined}
          >
            {cards.length >= 30 ? 'Column full' : <><PlusIcon size={13} /> Add a card</>}
          </button>
        )}
      </div>

      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
