import { useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { APPS, openApp, resolveApp, type ResolvedApp } from './apps'
import { AppIcon } from './icons'
import { useFocusedId, usePrefs, useWM } from './store'

const BASE = 48
const PEAK = 74
const REACH = 150
const FAR = 99999

interface ItemProps {
  app: ResolvedApp
  mouseX: MotionValue<number>
  running: boolean
  active: boolean
  hint?: string
  onClick: () => void
}

function DockItem({ app, mouseX, running, active, hint, onClick }: ItemProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [hover, setHover] = useState(false)
  const [pulse, setPulse] = useState(0)
  const hop = useAnimationControls()

  // Size follows the pointer along a smooth bell curve, so neighbours swell too.
  const dist = useTransform(mouseX, (v) => {
    const r = ref.current?.getBoundingClientRect()
    return r ? v - (r.left + r.width / 2) : FAR
  })
  const target = useTransform(dist, (d) => {
    const t = Math.max(0, 1 - Math.abs(d) / REACH)
    return BASE + (PEAK - BASE) * (0.5 - 0.5 * Math.cos(Math.PI * t))
  })
  const size = useSpring(target, { stiffness: 380, damping: 28, mass: 0.35 })
  const scale = useTransform(size, (s) => s / BASE)
  const lift = useTransform(size, (s) => -(s - BASE) * 0.18)

  return (
    <motion.button
      ref={ref}
      layout="position"
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.4 }}
      style={{ width: size, height: BASE }}
      className="relative shrink-0"
      aria-label={app.title}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={() => {
        if (!running) {
          setPulse((n) => n + 1)
          hop.start({ y: [0, -18, 0, -6, 0], transition: { duration: 0.62, times: [0, 0.3, 0.62, 0.8, 1], ease: 'easeOut' } })
        }
        onClick()
      }}
    >
      <motion.div style={{ y: lift }} className="absolute bottom-0 left-1/2">
        <motion.div animate={hop}>
          <motion.div
            style={{ scale, x: '-50%', transformOrigin: '50% 100%', width: BASE, height: BASE }}
            whileTap={{ filter: 'brightness(0.7)' }}
            className="relative"
          >
            {/* launch ring: one soft pulse in the app's colour */}
            <AnimatePresence>
              {pulse > 0 && (
                <motion.span
                  key={pulse}
                  initial={{ opacity: 0.55, scale: 0.9 }}
                  animate={{ opacity: 0, scale: 1.9 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="pointer-events-none absolute inset-0 rounded-[13px] border-2"
                  style={{ borderColor: app.color }}
                />
              )}
            </AnimatePresence>
            <AppIcon icon={app.icon} color={app.color} color2={app.color2} variant={app.variant} size={BASE} />
          </motion.div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {hover && (
          <motion.span
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="glass pointer-events-none absolute -top-[58px] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-ink"
          >
            {app.title}
            {hint && <kbd className="rounded bg-white/10 px-1 font-mono text-[9.5px] font-normal text-faint">{hint}</kbd>}
          </motion.span>
        )}
      </AnimatePresence>

      {/* running: a dot. focused: a short bar in the app's colour. */}
      <span
        className="absolute -bottom-[9px] left-1/2 h-[3px] -translate-x-1/2 rounded-full transition-all duration-300 ease-out"
        style={{
          width: running ? (active ? 16 : 4) : 0,
          opacity: running ? 1 : 0,
          background: active ? app.color : 'rgb(255 255 255 / 0.5)',
          boxShadow: active ? `0 0 10px ${app.color}` : undefined,
        }}
      />
    </motion.button>
  )
}

export function Dock() {
  const windows = useWM((s) => s.windows)
  const focusedId = useFocusedId()
  const magnify = usePrefs((s) => s.dockMagnify)
  const mouseX = useMotionValue(FAR)
  const { focus, minimize } = useWM.getState()

  const toggle = (id: string, launch: () => void) => {
    const w = windows.find((x) => x.id === id)
    if (!w) return launch()
    if (w.id === focusedId) minimize(id)
    else focus(id)
  }

  const projectWins = windows.filter((w) => w.appId === 'project')

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3.5 z-[4000] flex justify-center">
      <motion.div
        initial={{ y: 96, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 210, damping: 25, delay: 0.15 }}
        onPointerMove={(e) => magnify && mouseX.set(e.clientX)}
        onPointerLeave={() => mouseX.set(FAR)}
        className="pointer-events-auto relative"
      >
        {/* the tray is its own layer so icons can rise out of it */}
        <div className="glass absolute inset-0 rounded-[22px]" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgb(255 255 255 / 0.28), transparent)' }} />

        <div className="relative flex h-[70px] items-start gap-2 px-3 pt-[10px]">
          {APPS.map((a, i) => (
            <DockItem
              key={a.id}
              app={resolveApp({ appId: a.id })!}
              mouseX={mouseX}
              running={windows.some((w) => w.id === a.id)}
              active={focusedId === a.id}
              hint={`Alt ${i + 1}`}
              onClick={() => toggle(a.id, () => openApp(a.id))}
            />
          ))}
          <AnimatePresence initial={false}>
            {projectWins.length > 0 && (
              <motion.div
                key="sep"
                layout="position"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                className="mx-1 mt-1.5 h-9 w-px shrink-0 bg-white/14"
              />
            )}
            {projectWins.map((w) => {
              const app = resolveApp(w)
              if (!app) return null
              return (
                <DockItem
                  key={w.id}
                  app={app}
                  mouseX={mouseX}
                  running
                  active={focusedId === w.id}
                  onClick={() => toggle(w.id, () => {})}
                />
              )
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
