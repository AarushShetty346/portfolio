import { useSyncExternalStore } from 'react'

/* Phone layout: narrow screens, and short ones (a phone held sideways). */
const QUERY = '(max-width: 767px), (max-height: 480px)'

export const isPhone = () => window.matchMedia(QUERY).matches

const subscribe = (cb: () => void) => {
  const m = window.matchMedia(QUERY)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

/** True when the shell should behave like a phone: one fullscreen app at a time. */
export const usePhone = () => useSyncExternalStore(subscribe, isPhone)
