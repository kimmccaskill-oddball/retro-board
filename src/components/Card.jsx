export default function Card({ card, color, onDelete, onVote }) {
  return (
    <div className="card">
      <p className="card-text">{card.text}</p>
      <div className="card-footer">
        <button
          className={`vote-btn${card.votes > 0 ? ' has-votes' : ''}`}
          style={card.votes > 0 ? { '--vote-color': color } : {}}
          onClick={onVote}
          title="Upvote"
        >
          ▲ {card.votes}
        </button>
        <button className="delete-card-btn" onClick={onDelete} title="Delete">✕</button>
      </div>
    </div>
  )
}
