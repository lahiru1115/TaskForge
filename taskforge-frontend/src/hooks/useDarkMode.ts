import { useEffect, useState } from 'react'

const STORAGE_KEY = 'tf-theme'
const THEME_CHANGE_EVENT = 'tf-theme-change'

function readInitial() {
  return localStorage.getItem(STORAGE_KEY) === 'dark'
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
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
    // applyTheme (DOM mutation, localStorage write, cross-instance event
    // dispatch) must stay out of the setDark updater — React invokes
    // updaters more than once under StrictMode to check they're pure, and
    // this has side effects. Compute `next` from the closure instead.
    const next = !dark
    applyTheme(next)
    window.dispatchEvent(new CustomEvent<boolean>(THEME_CHANGE_EVENT, { detail: next }))
    setDark(next)
  }

  return [dark, toggle] as const
}
