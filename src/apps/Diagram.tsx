import { Fragment } from 'react'
import { motion } from 'motion/react'
import { MoveDown, MoveHorizontal, MoveRight, MoveVertical } from 'lucide-react'
import type { Diagram as DiagramData } from '../data/diagrams'

/* An architecture diagram: lanes read left to right in a wide window,
   top to bottom in a narrow one. The data lives in src/data/diagrams.ts. */

function Connector({ link, both }: { link?: string; both?: boolean }) {
  const Across = both ? MoveHorizontal : MoveRight
  const Down = both ? MoveVertical : MoveDown
  return (
    <div className="flex shrink-0 items-center justify-center gap-2.5 py-2 text-accent @3xl/win:w-[78px] @3xl/win:flex-col @3xl/win:gap-1.5 @3xl/win:px-1 @3xl/win:py-0 @3xl/win:pt-6">
      <Down size={18} strokeWidth={1.5} className="@3xl/win:hidden" />
      <Across size={22} strokeWidth={1.5} className="hidden @3xl/win:block" />
      {link && (
        <span className="text-center font-mono text-[9.5px] uppercase leading-tight tracking-[0.08em] text-dim">{link}</span>
      )}
    </div>
  )
}

export function Diagram({ data }: { data: DiagramData }) {
  return (
    <div className="rounded-xl border border-line bg-black/25 p-4 @3xl/win:p-5">
      <div className="flex flex-col @3xl/win:flex-row @3xl/win:items-stretch">
        {data.lanes.map((lane, i) => (
          <Fragment key={lane.title}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="min-w-0 flex-1"
            >
              <div className="mb-2 flex h-4 items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">
                <span className="size-1 rounded-full bg-accent" />
                <span className="truncate">{lane.title}</span>
              </div>
              <div className="space-y-2">
                {lane.nodes.map((n) => (
                  <div key={n.label} className="rounded-[10px] border border-white/[0.1] bg-[#0b0d14] px-3 py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
                    <div className="text-[12.5px] font-medium leading-snug text-ink">{n.label}</div>
                    {n.note && <div className="mt-1 text-[11px] leading-snug text-dim">{n.note}</div>}
                  </div>
                ))}
              </div>
            </motion.div>
            {i < data.lanes.length - 1 && <Connector link={lane.link} both={lane.both} />}
          </Fragment>
        ))}
      </div>
      {data.foot && <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-dim">{data.foot}</p>}
    </div>
  )
}
