export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="modal">
        <p className="modal-title">{message}</p>
        <div className="modal-btns">
          <button className="small-btn" onClick={onCancel}>Cancel</button>
          <button className="small-btn danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}
