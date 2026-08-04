import { useEffect, useState } from 'react'

const STORAGE_KEY = 'tf-theme'
const THEME_CHANGE_EVENT = 'tf-theme-change'

function readInitial() {
  return localStorage.getItem(STORAGE_KEY) === 'dark'
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  window.dispatchEvent(new CustomEvent<boolean>(THEME_CHANGE_EVENT, { detail: dark }))
}

/** Shared across every mount so toggling in one place (e.g. the command palette) updates all of them. */
export function useDarkMode() {
  const [dark, setDark] = useState(readInitial)

  useEffect(() => {
    function onChange(e: Event) {
      setDark((e as CustomEvent<boolean>).detail)
    }
    window.addEventListener(THEME_CHANGE_EVENT, onChange)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange)
  }, [])

  function toggle() {
    setDark((prev) => {
      const next = !prev
      applyTheme(next)
      return next
    })
  }

  return [dark, toggle] as const
}
