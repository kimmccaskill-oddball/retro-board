import { useState } from 'react'

const COLORS = ['#1D9E75', '#185FA5', '#D85A30', '#9966CC', '#BA7517', '#D4537E', '#E24B4A', '#639922']

export default function AddColumnModal({ onAdd, onClose }) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [saving, setSaving] = useState(false)

  async function handleAdd() {
    if (!title.trim()) return
    setSaving(true)
    await onAdd(title.trim(), color)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h2 className="modal-title">Add column</h2>
        <input
          className="modal-input"
          placeholder="Column name"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onClose() }}
          autoFocus
          maxLength={40}
        />
        <div className="color-row">
          {COLORS.map(c => (
            <button
              key={c}
              className={`color-swatch${color === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
        <div className="modal-btns">
          <button className="small-btn" onClick={onClose}>Cancel</button>
          <button className="small-btn primary" onClick={handleAdd} disabled={saving || !title.trim()}>
            {saving ? 'Adding…' : 'Add column'}
          </button>
        </div>
      </div>
    </div>
  )
}
