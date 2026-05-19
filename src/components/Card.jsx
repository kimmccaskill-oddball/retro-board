import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const EMOJIS = ['👍', '👎', '❤️', '😄', '🎉', '🤔', '😬']

export default function Card({ card, color, hasVoted, myReactions, onDelete, onVote, onReact }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const pickerRef = useRef(null)
  const reactions = card.reactions || {}

  useEffect(() => {
    if (!pickerOpen) return
    function handleClick(e) {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [pickerOpen])

  function openPicker() {
    const rect = btnRef.current.getBoundingClientRect()
    setPickerPos({ top: rect.top - 8, left: rect.right })
    setPickerOpen(o => !o)
  }

  return (
    <div className="card">
      <p className="card-text">{card.text}</p>
      <div className="card-reactions">
        {Object.entries(reactions).filter(([, count]) => count > 0).map(([emoji, count]) => (
          <button
            key={emoji}
            className={`reaction-chip${myReactions.includes(emoji) ? ' my-reaction' : ''}`}
            onClick={() => onReact(card, emoji)}
            title={myReactions.includes(emoji) ? 'Remove reaction' : `React with ${emoji}`}
          >
            {emoji} {count}
          </button>
        ))}
        <button ref={btnRef} className="reaction-add-btn" onClick={openPicker} title="Add reaction">+</button>
        {pickerOpen && createPortal(
          <div
            ref={pickerRef}
            className="emoji-picker"
            style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, transform: 'translate(-100%, -100%)' }}
          >
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                className={`emoji-option${myReactions.includes(emoji) ? ' active' : ''}`}
                onClick={() => { onReact(card, emoji); setPickerOpen(false) }}
              >
                {emoji}
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
      <div className="card-footer">
        <button
          className={`vote-btn${card.votes > 0 ? ' has-votes' : ''}${hasVoted ? ' my-vote' : ''}`}
          style={card.votes > 0 ? { '--vote-color': color } : {}}
          onClick={onVote}
          title={hasVoted ? 'Remove vote' : 'Upvote'}
        >
          ▲ {card.votes}
        </button>
        <button className="delete-card-btn" onClick={onDelete} title="Delete">✕</button>
      </div>
    </div>
  )
}
