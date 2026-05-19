import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('retro-theme') || 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('retro-theme', theme)
  }, [theme])

  function toggle() {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  return { theme, toggle }
}
