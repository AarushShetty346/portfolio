import { useEffect, useRef, type ReactNode } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react'

/* Shared pieces for the arcade games. */

export interface GameProps {
  /** Best result this session, if any. */
  best?: number
  /** Report a finished game's result. */
  submit: (score: number) => void
}

export type Dir = 'up' | 'down' | 'left' | 'right'
export const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
}
export const dirFromKey = (key: string): Dir | undefined => KEYS[key.length === 1 ? key.toLowerCase() : key]

/** A focusable stage that takes the keyboard while the game is open. */
export function Stage({ onKey, children }: { onKey: (e: React.KeyboardEvent) => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => ref.current?.focus(), [])
  return (
    <div
      ref={ref}
      tabIndex={0}
      onKeyDown={(e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
        onKey(e)
      }}
      onPointerDown={() => ref.current?.focus()}
      className="no-ring flex h-full min-h-0 flex-col items-center gap-3"
    >
      {children}
    </div>
  )
}

export function Hud({ items }: { items: [string, string | number][] }) {
  return (
    <div className="flex shrink-0 items-stretch gap-2">
      {items.map(([k, v]) => (
        <div key={k} className="glass-card min-w-[72px] px-3 py-1.5 text-center">
          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink/50">{k}</div>
          <div className="display mt-0.5 text-[15px] tabular-nums text-ink">{v}</div>
        </div>
      ))}
    </div>
  )
}

/** The canvas keeps its shape and fills whatever height is left. */
export function Board({ canvas, w, h, overlay }: { canvas: React.RefObject<HTMLCanvasElement | null>; w: number; h: number; overlay?: ReactNode }) {
  return (
    <div className="grid min-h-0 w-full flex-1 place-items-center [container-type:size]">
      <div className="relative" style={{ width: `min(100cqw, calc(100cqh * ${w / h}))`, aspectRatio: `${w} / ${h}` }}>
        <canvas ref={canvas} width={w} height={h} className="size-full rounded-[10px] border border-white/12 bg-[#06070c]" />
        {overlay}
      </div>
    </div>
  )
}

export function Overlay({ title, note, action, onAction }: { title: string; note?: string; action: string; onAction: () => void }) {
  return (
    <div className="absolute inset-0 grid place-items-center rounded-[10px] bg-[#05060a]/80 p-4 text-center backdrop-blur-[2px]">
      <div>
        <div className="display text-[20px] font-semibold text-ink">{title}</div>
        {note && <div className="mt-1.5 text-[12.5px] leading-snug text-ink/65">{note}</div>}
        <button className="btn btn-accent mt-4" onClick={onAction}>{action}</button>
      </div>
    </div>
  )
}

/** On-screen arrows, so the games also work on a phone. */
export function Pad({ onDir, extra }: { onDir: (d: Dir) => void; extra?: ReactNode }) {
  const key = (d: Dir, icon: ReactNode, cls: string) => (
    <button aria-label={d} onPointerDown={(e) => { e.preventDefault(); onDir(d) }} className={`win-key !h-9 !w-11 ${cls}`}>{icon}</button>
  )
  return (
    <div className="flex shrink-0 items-center gap-4">
      <div className="grid grid-cols-3 gap-1">
        {key('up', <ArrowUp size={15} />, 'col-start-2')}
        {key('left', <ArrowLeft size={15} />, 'col-start-1 row-start-2')}
        {key('down', <ArrowDown size={15} />, 'col-start-2 row-start-2')}
        {key('right', <ArrowRight size={15} />, 'col-start-3 row-start-2')}
      </div>
      {extra}
    </div>
  )
}
