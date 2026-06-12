let listener = null
let nextId = 0

export function toast(message, type = 'info') {
  listener?.({ id: nextId++, message, type })
}

export function subscribeToToasts(fn) {
  listener = fn
  return () => { if (listener === fn) listener = null }
}
