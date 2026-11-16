import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, Award, BriefcaseBusiness, GitPullRequest, Trophy, type LucideIcon } from 'lucide-react'
import { experience, type ExperienceItem, type ExperienceKind } from '../data/experience'
import { projectBySlug } from '../data/projects'
import { openProject } from '../os/apps'
import { AppIcon, cn, glyphFor } from '../os/icons'
import { ContentSlot, Prose, SectionTitle } from './shared'

const KIND: Record<ExperienceKind, { icon: LucideIcon; color: string }> = {
  Internship: { icon: BriefcaseBusiness, color: '#ffb657' },
  Hackathon: { icon: Trophy, color: '#3ee6ff' },
  'Open source': { icon: GitPullRequest, color: '#5dffa8' },
  Achievement: { icon: Award, color: '#ff5fd2' },
}
const KINDS = Object.keys(KIND) as ExperienceKind[]

function Detail({ item }: { item: ExperienceItem }) {
  const k = KIND[item.kind]
  const p = projectBySlug(item.project)
  const path = (f: string) => `src/data/experience.ts > ${item.id} > ${f}`
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="p-7"
    >
      <div className="flex items-center gap-2 text-[12px]" style={{ color: k.color }}>
        <k.icon size={14} /> {item.kind}
        <span className="ml-auto font-mono text-[11.5px] text-dim">{item.period}</span>
      </div>
      <h2 className="display selectable mt-3 text-[26px] font-semibold leading-tight text-ink">{item.title}</h2>
      <div className="selectable mt-1.5 text-[14px] text-dim">{item.org}</div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {item.tags.map((t) => <span key={t} className="chip">{t}</span>)}
      </div>

      <div className="mt-7">
        <SectionTitle>Summary</SectionTitle>
        {item.summary ? <Prose text={item.summary} /> : <ContentSlot title="Summary coming soon" path={path('summary')} />}
      </div>

      <div className="mt-7">
        <SectionTitle>What I did</SectionTitle>
        {item.points.length ? (
          <ul className="selectable max-w-[68ch] space-y-2.5">
            {item.points.map((pt, i) => (
              <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-ink/85">
                <span className="mt-[9px] h-px w-3 shrink-0 bg-accent" />
                {pt}
              </li>
            ))}
          </ul>
        ) : (
          <ContentSlot title="Details coming soon" note="Responsibilities and outcomes will be listed here." path={path('points')} />
        )}
      </div>

      {(p || item.links?.length) && (
        <div className="mt-7 flex flex-wrap gap-2">
          {p && (
            <button className="btn !h-11 !pl-1.5" onClick={() => openProject(p.slug)}>
              <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={30} />
              Open {p.name}
            </button>
          )}
          {item.links?.map((l) => (
            <a key={l.href} className="btn !h-11" href={l.href} target="_blank" rel="noreferrer">
              {l.label} <ArrowUpRight size={14} />
            </a>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default function Experience() {
  const [kind, setKind] = useState<ExperienceKind | 'All'>('All')
  const list = useMemo(() => experience.filter((e) => kind === 'All' || e.kind === kind), [kind])
  const [selected, setSelected] = useState(experience[0]?.id)
  const current = list.find((e) => e.id === selected) ?? list[0]

  return (
    <div className="flex h-full">
      <aside className="flex w-[330px] shrink-0 flex-col border-r border-line bg-black/20">
        <div className="flex flex-wrap gap-1 border-b border-line p-3">
          {(['All', ...KINDS] as const).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn('h-7 rounded-md px-2.5 text-[12px] transition-colors', kind === k ? 'bg-white/10 text-ink' : 'text-dim hover:bg-white/5 hover:text-ink')}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="os-scroll flex-1 p-2">
          {list.map((e) => {
            const k = KIND[e.kind]
            const on = e.id === current?.id
            return (
              <button
                key={e.id}
                onClick={() => setSelected(e.id)}
                className={cn('relative flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors', on ? 'bg-white/8' : 'hover:bg-white/5')}
              >
                {on && <motion.span layoutId="exp-sel" className="absolute inset-y-3 left-0 w-[2px] rounded-full bg-accent" />}
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line" style={{ color: k.color, background: `color-mix(in oklab, ${k.color} 10%, transparent)` }}>
                  <k.icon size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{e.title}</span>
                  <span className="block truncate text-[12px] text-dim">{e.org}</span>
                  <span className="mt-1 block font-mono text-[10.5px] text-faint">{e.period}</span>
                </span>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="os-scroll min-w-0 flex-1">
        {current ? (
          <AnimatePresence mode="wait" initial={false}><Detail key={current.id} item={current} /></AnimatePresence>
        ) : (
          <div className="grid h-full place-items-center text-[13px] text-dim">Nothing in this category yet.</div>
        )}
      </section>
    </div>
  )
}
