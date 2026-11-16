import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { Boot } from './os/Boot'
import { Desktop } from './os/Desktop'
import { ACCENTS, usePrefs, useShell } from './os/store'

export default function App() {
  const accent = usePrefs((s) => s.accent)
  const bootOnStart = usePrefs((s) => s.bootOnStart)
  const booted = useShell((s) => s.booted)
  const setBooted = useShell((s) => s.setBooted)

  // Skip the boot sequence when turned off, or on reloads within the same session.
  const [showBoot] = useState(() => bootOnStart && !sessionStorage.getItem('aarush-os:booted'))
  const finishBoot = useCallback(() => {
    sessionStorage.setItem('aarush-os:booted', '1')
    setBooted(true)
  }, [setBooted])
  useEffect(() => {
    if (!showBoot) setBooted(true)
  }, [showBoot, setBooted])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent', ACCENTS[accent].value)
    root.style.setProperty('--accent-2', ACCENTS[accent].second)
  }, [accent])

  return (
    // motion follows the visitor's own device setting
    <MotionConfig reducedMotion="user">
      {booted && <Desktop />}
      <AnimatePresence>{showBoot && !booted && <Boot key="boot" onDone={finishBoot} />}</AnimatePresence>
    </MotionConfig>
  )
}
