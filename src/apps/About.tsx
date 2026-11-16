import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, GraduationCap, MapPin } from 'lucide-react'
import { profile } from '../data/profile'
import { projectBySlug } from '../data/projects'
import { openApp, openProject } from '../os/apps'
import { AppIcon, glyphFor } from '../os/icons'
import { ContentSlot, Prose, SectionTitle } from './shared'

function Avatar() {
  const [failed, setFailed] = useState(false)
  const initials = profile.name.split(' ').map((w) => w[0]).join('')
  return (
    <div className="relative size-[104px] shrink-0">
      <div className="absolute -inset-[3px] rounded-[26px]" style={{ background: 'conic-gradient(from 210deg, var(--accent), var(--accent-2), transparent 70%, var(--accent))' }} />
      <div className="absolute inset-0 grid place-items-center overflow-hidden rounded-[24px] bg-panel">
        {failed ? (
          <span className="display text-[34px] font-semibold text-accent">{initials}</span>
        ) : (
          <img src={`https://github.com/${profile.handle}.png?size=240`} alt={profile.name} className="size-full object-cover" draggable={false} onError={() => setFailed(true)} />
        )}
      </div>
    </div>
  )
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
})

export default function About() {
  return (
    <div className="os-scroll @container h-full">
      {/* Identity */}
      <div className="relative overflow-hidden border-b border-line px-8 pb-7 pt-8">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 120% at 0% 0%, color-mix(in oklab, var(--accent-2) 14%, transparent), transparent 70%)' }} />
        <motion.div {...rise(0)} className="relative flex items-center gap-6">
          <Avatar />
          <div className="min-w-0">
            <h1 className="display selectable text-[34px] font-semibold leading-none tracking-tight text-ink">{profile.name}</h1>
            <p className="selectable mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-ink/80">{profile.headline}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="chip"><GraduationCap size={11} /> {profile.degree}</span>
              <span className="chip">{profile.school}, class of {profile.gradYear}</span>
              <span className="chip"><MapPin size={11} /> {profile.location}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-7 p-8 @2xl:grid-cols-[1.35fr_1fr]">
        <motion.div {...rise(1)} className="space-y-7">
          <div>
            <SectionTitle>About</SectionTitle>
            {profile.bio.length ? (
              <Prose text={profile.bio.join('\n\n')} />
            ) : (
              <ContentSlot title="Bio coming soon" note="A proper introduction is on its way." path="src/data/profile.ts > bio" />
            )}
          </div>

          <div>
            <SectionTitle>Skills</SectionTitle>
            <div className="space-y-3">
              {profile.skills.map((g) => (
                <div key={g.group} className="grid grid-cols-[84px_1fr] items-start gap-3">
                  <div className="pt-1 text-[12px] text-faint">{g.group}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((s) => <span key={s} className="chip !text-ink/85">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...rise(2)} className="space-y-7">
          <div>
            <SectionTitle>Building now</SectionTitle>
            <div className="space-y-2">
              {profile.buildingNow.map((b) => {
                const p = projectBySlug(b.project)
                return (
                  <button
                    key={b.name}
                    onClick={() => p && openProject(p.slug)}
                    className="group flex w-full items-center gap-3.5 rounded-xl border border-line bg-black/20 p-3 text-left transition-colors hover:border-line-strong hover:bg-white/5"
                  >
                    {p && <AppIcon icon={glyphFor(p.glyph)} color={p.accent} color2={p.accent2} variant="project" size={40} />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium text-ink">{b.name}</span>
                      <span className="block truncate text-[12px] text-dim">{b.note}</span>
                    </span>
                    <ArrowUpRight size={15} className="text-faint transition-colors group-hover:text-accent" />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <SectionTitle>Interests</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((s) => (
                <span key={s} className="rounded-lg border border-line bg-accent/[0.07] px-3 py-1.5 text-[12.5px] text-ink/90">{s}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn btn-accent" onClick={() => openApp('projects')}>Browse projects</button>
            <button className="btn" onClick={() => openApp('contact')}>Contact</button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
