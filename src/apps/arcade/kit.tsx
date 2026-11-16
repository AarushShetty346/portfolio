import { useEffect, useRef, useState, type ReactNode } from 'react'

/* Shared pieces for the arcade games.
   Every game fills the space it is given: it measures its stage, then
   lays out as many cells as fit, so the field is wide on a laptop and
   tall on a phone. */

export type HudItem = [label: string, value: string | number]

export interface GameProps {
  /** Best result this session, if any. */
  best?: number
  /** Report a finished game's result. */
  submit: (score: number) => void
  /** Show these numbers in the corner of the game. */
  hud: (items: HudItem[]) => void
}

export type Dir = 'up' | 'down' | 'left' | 'right'
export const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
}
export const dirFromKey = (key: string): Dir | undefined => KEYS[key.length === 1 ? key.toLowerCase() : key]

export interface Area { w: number; h: number }

/** What a game wants to hear about. It fills this in on every render. */
export interface Input { dir?: (d: Dir) => void; go?: () => void; key?: (key: string) => void }

/**
 * The play area: takes the keyboard, turns swipes into directions, and
 * reports its own size so the game can decide how many cells fit.
 */
export function Stage({ children }: { children: (area: Area, input: React.RefObject<Input>) => ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const input = useRef<Input>({})
  const [area, setArea] = useState<Area>({ w: 0, h: 0 })
  const touch = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const el = ref.current!
    el.focus()
    const ro = new ResizeObserver(() => setArea({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={(e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
        const d = dirFromKey(e.key)
        if (d) input.current.dir?.(d)
        else if (e.key === 'Enter') input.current.go?.()
        else input.current.key?.(e.key)
      }}
      onPointerDown={(e) => {
        ref.current?.focus()
        if (e.pointerType !== 'mouse') touch.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={(e) => {
        const t = touch.current
        touch.current = null
        if (!t) return
        const dx = e.clientX - t.x, dy = e.clientY - t.y
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return input.current.go?.()
        input.current.dir?.(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
      }}
      className="no-ring relative grid size-full touch-none place-items-center overflow-hidden"
    >
      {area.w > 0 && children(area, input)}
    </div>
  )
}

/** Sizes a canvas for sharp drawing and returns its context, in CSS pixels. */
export function prep(canvas: HTMLCanvasElement | null, w: number, h: number) {
  if (!canvas) return null
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
  }
  const c = canvas.getContext('2d')!
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  return c
}

export const touchDevice = () => window.matchMedia('(pointer: coarse)').matches

export function Overlay({ title, note, action, onAction }: { title: string; note?: string; action: string; onAction: () => void }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-[#05060a]/75 p-4 text-center backdrop-blur-[3px]">
      <div>
        <div className="display text-[26px] font-semibold text-ink">{title}</div>
        {note && <div className="mx-auto mt-2 max-w-[38ch] text-[13px] leading-snug text-ink/70">{note}</div>}
        <button className="btn btn-accent mt-5 !h-10 !px-6" onClick={onAction}>{action}</button>
      </div>
    </div>
  )
}
