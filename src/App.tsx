import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { MonitorSmartphone } from 'lucide-react'
import { Boot } from './os/Boot'
import { Desktop } from './os/Desktop'
import { ACCENTS, usePrefs, useShell } from './os/store'

/** Phones are out of scope for now: say so honestly, and let people in anyway. */
function SmallScreenNotice() {
  const [small, setSmall] = useState(() => window.innerWidth < 860)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    const on = () => setSmall(window.innerWidth < 860)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  if (!small || dismissed) return null
  return (
    <div className="fixed inset-0 z-[9500] grid place-items-center bg-void/95 p-8 text-center backdrop-blur">
      <div className="max-w-xs">
        <MonitorSmartphone size={30} className="mx-auto text-accent" />
        <h1 className="display mt-5 text-xl font-semibold tracking-[0.2em]">AARUSH<span className="text-accent">.</span>OS</h1>
        <p className="mt-3 text-sm leading-relaxed text-dim">
          This is a desktop operating system. It is built for a laptop or larger screen, so things will be cramped here.
        </p>
        <button className="btn btn-accent mt-6" onClick={() => setDismissed(true)}>Continue anyway</button>
      </div>
    </div>
  )
}

export default function App() {
  const accent = usePrefs((s) => s.accent)
  const reduceMotion = usePrefs((s) => s.reduceMotion)
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

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [reduceMotion])

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      {booted && <Desktop />}
      <AnimatePresence>{showBoot && !booted && <Boot key="boot" onDone={finishBoot} />}</AnimatePresence>
      <SmallScreenNotice />
    </MotionConfig>
  )
}
