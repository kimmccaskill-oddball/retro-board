import { useState, useEffect } from 'react'
import { subscribeToToasts } from '../lib/toast'
import { CheckIcon, AlertIcon } from './Icons'

const ICONS = {
  success: <CheckIcon />,
  error: <AlertIcon />,
  info: <AlertIcon />,
}

export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => subscribeToToasts(t => {
    setToasts(prev => [...prev, t])
    setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== t.id))
    }, 3500)
  }), [])

  if (toasts.length === 0) return null

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {ICONS[t.type]}
          {t.message}
        </div>
      ))}
    </div>
  )
}
