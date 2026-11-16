import { useMemo, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, Award, BriefcaseBusiness, GitPullRequest, Trophy, type LucideIcon } from 'lucide-react'
import { experience, type ExperienceItem, type ExperienceKind } from '../data/experience'
import { projectBySlug } from '../data/projects'
import { openProject } from '../os/apps'
import { AppIcon, cn, glyphFor } from '../os/icons'
import { ContentSlot } from './shared'

/* ------------------------------------------------------------------
   EXPERIENCE: a timeline on the left, one entry laid out like a page
   on the right. Each kind of entry has its own colour, which lights
   the page header and the timeline node.
------------------------------------------------------------------- */

const KIND: Record<ExperienceKind, { icon: LucideIcon; color: string }> = {
  Internship: { icon: BriefcaseBusiness, color: '#ffb657' },
  Hackathon: { icon: Trophy, color: '#3ee6ff' },
  'Open source': { icon: GitPullRequest, color: '#5dffa8' },
  Achievement: { icon: Award, color: '#ff5fd2' },
}
const KINDS = Object.keys(KIND) as ExperienceKind[]
const ease = [0.16, 1, 0.3, 1] as const
const pad = (n: number) => String(n).padStart(2, '0')

function Page({ item, onBack }: { item: ExperienceItem; onBack: () => void }) {
  const k = KIND[item.kind]
  const p = projectBySlug(item.project)
  const path = (f: string) => `src/data/experience.ts > ${item.id} > ${f}`
  const rise = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.04 + i * 0.05, duration: 0.5, ease },
  })

  return (
    <motion.article
      style={{ '--accent': k.color } as CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="@container min-h-full"
    >
      {/* header band, lit in the entry's colour */}
      <header
        className="relative overflow-hidden border-b border-white/[0.07] px-5 pb-7 pt-6 @2xl:px-9 @2xl:pb-8 @2xl:pt-9"
        style={{ background: 'radial-gradient(90% 140% at 0% 0%, color-mix(in oklab, var(--accent) 15%, transparent), transparent 62%)' }}
      >
        <k.icon aria-hidden size={190} strokeWidth={0.6} className="pointer-events-none absolute -right-8 -top-10 text-accent opacity-[0.09]" />
        <button onClick={onBack} className="relative mb-5 flex items-center gap-1.5 text-[12.5px] text-dim @2xl/win:hidden">
          <ArrowLeft size={14} /> Timeline
        </button>
        <motion.div {...rise(0)} className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.18em]">
          <span className="flex items-center gap-2 text-accent"><k.icon size={13} /> {item.kind}</span>
          <span className="h-px w-6 bg-white/20" />
          <span className="text-dim">{item.period}</span>
        </motion.div>
        <motion.h2 {...rise(1)} className="display selectable mt-4 max-w-[18ch] text-[22px] font-semibold leading-[1.12] tracking-[-0.01em] text-ink @2xl:text-[29px]">
          {item.title}
        </motion.h2>
        <motion.div {...rise(2)} className="selectable mt-2.5 text-[14.5px] text-ink/65">{item.org}</motion.div>
      </header>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 px-5 py-7 @2xl:grid-cols-[minmax(0,1fr)_200px] @2xl:px-9 @2xl:py-8">
        <div className="min-w-0">
          {item.summary ? (
            <motion.p {...rise(3)} className="selectable max-w-[58ch] text-[16px] leading-[1.65] text-ink/90">{item.summary}</motion.p>
          ) : (
            <ContentSlot title="Summary coming soon" path={path('summary')} />
          )}

          {item.points.length ? (
            <ol className="selectable mt-7 max-w-[62ch]">
              {item.points.map((pt, i) => (
                <motion.li key={i} {...rise(4 + i)} className="flex gap-5 border-t border-white/[0.07] py-3.5">
                  <span className="pt-[3px] font-mono text-[10.5px] tabular-nums tracking-[0.1em] text-accent">{pad(i + 1)}</span>
                  <span className="text-[13.5px] leading-[1.7] text-ink/80">{pt}</span>
                </motion.li>
              ))}
            </ol>
          ) : (
            <ContentSlot className="mt-6" title="Details coming soon" note="Responsibilities and outcomes will be listed here." path={path('points')} />
          )}
        </div>

        <motion.aside {...rise(4)} className="space-y-6">
          <div>
            <div className="label">Areas</div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {item.tags.map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
          </div>

          {p && (
            <div>
              <div className="label">Project</div>
              <button
                onClick={() => openProject(p.slug)}
                className="group mt-2.5 flex w-full items-center gap-3 rounded-[10px] border border-white/[0.08] bg-white/[0.025] p-2 text-left transition-colors hover:border-white/16 hover:bg-white/[0.06]"
              >
                <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{p.name}</span>
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">Open app</span>
                </span>
                <ArrowUpRight size={14} className="text-faint transition-colors group-hover:text-ink" />
              </button>
            </div>
          )}

          {item.links?.length ? (
            <div>
              <div className="label">Links</div>
              <div className="mt-1.5">
                {item.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="group flex items-center justify-between border-b border-white/[0.07] py-2.5 text-[13px] text-ink/85 transition-colors hover:text-accent">
                    {l.label}
                    <ArrowUpRight size={14} className="text-faint transition-colors group-hover:text-accent" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </motion.aside>
      </div>
    </motion.article>
  )
}

export default function Experience() {
  const [kind, setKind] = useState<ExperienceKind | 'All'>('All')
  const list = useMemo(() => experience.filter((e) => kind === 'All' || e.kind === kind), [kind])
  const [selected, setSelected] = useState(experience[0]?.id)
  const current = list.find((e) => e.id === selected) ?? list[0]
  // narrow windows and phones show one pane at a time: the timeline, then the entry
  const [detail, setDetail] = useState(false)

  return (
    <div className="flex h-full">
      <aside className={cn('w-full shrink-0 flex-col border-r border-white/[0.07] bg-black/25 @2xl/win:flex @2xl/win:w-[292px]', detail ? 'hidden' : 'flex')}>
        <div className="px-4 pb-3 pt-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-[15px] font-semibold tracking-tight text-ink">Timeline</h1>
            <span className="font-mono text-[10.5px] text-faint">{pad(list.length)} entries</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {(['All', ...KINDS] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={cn('h-[22px] rounded-full px-2.5 text-[11px] transition-colors', kind === k ? 'bg-ink text-[#06070b]' : 'bg-white/[0.05] text-dim hover:bg-white/10 hover:text-ink')}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="os-scroll relative flex-1 px-3 pb-3">
          {/* the rail the nodes sit on */}
          <div className="absolute bottom-3 left-[31px] top-2 w-px bg-white/[0.09]" />
          {list.map((e) => {
            const k = KIND[e.kind]
            const on = e.id === current?.id
            return (
              <button
                key={e.id}
                onClick={() => { setSelected(e.id); setDetail(true) }}
                className={cn('group relative flex w-full gap-3.5 rounded-[10px] py-3 pl-2 pr-3 text-left transition-colors', !on && 'hover:bg-white/[0.04]')}
              >
                {on && <motion.span layoutId="exp-sel" className="absolute inset-0 rounded-[10px] border border-white/10 bg-white/[0.055]" transition={{ type: 'spring', stiffness: 480, damping: 40 }} />}
                <span
                  className="relative mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full border bg-[#0a0c13] transition-all duration-300"
                  style={{ borderColor: on ? k.color : 'rgb(255 255 255 / 0.16)', color: on ? k.color : 'rgb(255 255 255 / 0.45)', boxShadow: on ? `0 0 14px -2px ${k.color}` : undefined }}
                >
                  <k.icon size={11} />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className="block font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">{e.period}</span>
                  <span className={cn('mt-1 block truncate text-[13.5px] font-medium transition-colors', on ? 'text-ink' : 'text-ink/80')}>{e.title}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-dim">{e.org}</span>
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <section className={cn('os-scroll min-w-0 flex-1', !detail && 'hidden @2xl/win:block')}>
        {current ? (
          <AnimatePresence mode="wait" initial={false}><Page key={current.id} item={current} onBack={() => setDetail(false)} /></AnimatePresence>
        ) : (
          <div className="grid h-full place-items-center text-[13px] text-dim">Nothing in this category yet.</div>
        )}
      </section>
    </div>
  )
}
