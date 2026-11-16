import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { isPhone } from './device'
import { OsMark } from './icons'

const STEPS = ['Waking display', 'Mounting projects', 'Linking GitHub', 'Starting window manager', 'Ready']
const DURATION = 2600

/** Short, skippable boot sequence. Any key or click skips it. */
export function Boot({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((_, i) => window.setTimeout(() => setStep(i), (DURATION / STEPS.length) * i))
    const end = window.setTimeout(onDone, DURATION + 250)
    const skip = () => onDone()
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(end)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[9000] grid place-items-center bg-void"
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, color-mix(in oklab, var(--accent) 10%, transparent), transparent)' }}
      />
      <div className="scanlines absolute inset-0" />

      <div className="relative flex w-[320px] max-w-[78vw] flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          className="text-accent"
        >
          <OsMark size={64} />
        </motion.div>

        <div className="display mt-7 flex pl-[0.34em] text-[22px] font-semibold tracking-[0.34em] text-ink sm:text-[26px]">
          {'AARUSH.OS'.split('').map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.045, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={ch === '.' ? 'text-accent' : undefined}
            >
              {ch}
            </motion.span>
          ))}
        </div>

        <div className="mt-9 h-[2px] w-full overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full origin-left bg-accent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: DURATION / 1000, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        <div className="mt-4 flex w-full items-center justify-between font-mono text-[11px] text-dim">
          <motion.span key={step} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
            {STEPS[step]}
          </motion.span>
          <span className="text-faint">{String(Math.round(((step + 1) / STEPS.length) * 100)).padStart(3, '0')}%</span>
        </div>
      </div>

      <div className="absolute bottom-8 font-mono text-[11px] tracking-wider text-faint">{isPhone() ? 'Tap to skip' : 'Press any key to skip'}</div>
    </motion.div>
  )
}
