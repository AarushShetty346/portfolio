import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check, Info, Keyboard, Palette, RotateCcw, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { profile } from '../data/profile'
import { projects } from '../data/projects'
import { cn, OsMark } from '../os/icons'
import { ACCENTS, notify, PHOTOS, usePrefs, WALLPAPERS, type AccentId, type WallpaperId } from '../os/store'

type Pane = 'appearance' | 'desktop' | 'shortcuts' | 'about'
const PANES: { id: Pane; label: string; icon: LucideIcon }[] = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'desktop', label: 'Desktop', icon: SlidersHorizontal },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'about', label: 'About', icon: Info },
]

/* Still previews of each wallpaper, drawn with CSS only. */
const photoPreview = (id: WallpaperId): React.CSSProperties => ({
  background: `linear-gradient(rgb(4 5 10 / 0.25), rgb(4 5 10 / 0.25)), url(${PHOTOS[id]}) center / cover`,
})

const PREVIEW: Record<WallpaperId, React.CSSProperties> = {
  chicago: photoPreview('chicago'),
  milkyway: photoPreview('milkyway'),
  globe: {
    background:
      'radial-gradient(circle at 62% 52%, transparent 0 27%, color-mix(in oklab, var(--accent) 70%, transparent) 27.5% 28.5%, transparent 29%), repeating-radial-gradient(circle at 62% 52%, transparent 0 5px, color-mix(in oklab, var(--accent) 26%, transparent) 5.5px, transparent 6.5px) 62% 52% / 56% 90% no-repeat, #05060b',
  },
  terrain: {
    background:
      'linear-gradient(180deg, transparent 45%, color-mix(in oklab, var(--accent-2) 80%, transparent) 45.5%, transparent 47%), repeating-linear-gradient(180deg, transparent 0 7px, color-mix(in oklab, var(--accent) 34%, transparent) 7.5px, transparent 8.5px) 0 100% / 100% 54% no-repeat, radial-gradient(60% 50% at 50% 46%, color-mix(in oklab, var(--accent-2) 30%, transparent), transparent), #05060b',
  },
  warp: {
    background:
      'repeating-conic-gradient(from 0deg at 58% 50%, transparent 0 7deg, rgb(225 232 255 / 0.2) 7.2deg 7.6deg, transparent 8deg 15deg), radial-gradient(circle at 58% 50%, #05060b 0 16%, transparent 60%), #05060b',
  },
  flow: {
    background:
      'repeating-radial-gradient(ellipse at 20% 120%, transparent 0 7px, color-mix(in oklab, var(--accent) 30%, transparent) 8px, transparent 9px), repeating-radial-gradient(ellipse at 110% -10%, transparent 0 9px, color-mix(in oklab, var(--accent-2) 26%, transparent) 10px, transparent 11px), #07080d',
  },
  ridge: {
    background:
      'repeating-radial-gradient(ellipse 120% 60% at 75% 135%, transparent 0 6px, color-mix(in oklab, var(--accent) 38%, transparent) 6.5px, transparent 7.5px), linear-gradient(180deg, #05060b 40%, transparent 62%), #05060b',
  },
  grid: {
    background:
      'radial-gradient(circle, rgb(255 255 255 / 0.22) 1px, transparent 1.5px) 0 0 / 11px 11px, radial-gradient(60% 55% at 78% 70%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 70%), #06070c',
  },
  aurora: {
    background:
      'radial-gradient(ellipse at 15% 10%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 55%), radial-gradient(ellipse at 90% 40%, color-mix(in oklab, var(--accent-2) 55%, transparent), transparent 55%), radial-gradient(ellipse at 50% 120%, #2a4bff88, transparent 60%), #07080d',
  },
  dusk: {
    background:
      'radial-gradient(120% 60% at 62% 108%, color-mix(in oklab, var(--accent-2) 55%, transparent), transparent 62%), linear-gradient(180deg, #04050b 0%, #070919 42%, #100b26 70%, #1a0c2c 100%)',
  },
}

function Toggle({ label, note, value, onChange }: { label: string; note?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-white/[0.035]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {note && <span className="mt-0.5 block text-[12px] leading-snug text-dim">{note}</span>}
      </span>
      <span className={cn('relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200', value ? 'bg-accent' : 'bg-white/12')}>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 600, damping: 34 }}
          className={cn('absolute top-[3px] size-4 rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.5)]', value ? 'right-[3px] bg-white' : 'left-[3px] bg-white/70')}
        />
      </span>
    </button>
  )
}

/** A titled section. By default its children sit in one ruled box, like a system settings list. */
const Group = ({ title, bare, children }: { title: string; bare?: boolean; children: ReactNode }) => (
  <section className="mb-8">
    <h2 className="label mb-2.5 !text-ink/60">{title}</h2>
    {bare ? children : (
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">{children}</div>
    )}
  </section>
)

const SHORTCUTS: [string, string][] = [
  ['Ctrl K  or  /', 'Search apps and projects'],
  ['Alt 1 to 9', 'Open a dock app'],
  ['Alt W', 'Close the focused window'],
  ['Alt M', 'Minimize the focused window'],
  ['Alt Enter', 'Maximize or restore'],
  ['Alt `', 'Switch to the next window'],
  ['Alt T', 'Tidy windows into a grid'],
  ['Double-click title bar', 'Maximize or restore'],
  ['Right-click desktop', 'Desktop menu'],
  ['Esc', 'Close search or a screenshot'],
]

export default function Settings() {
  const prefs = usePrefs()
  const [pane, setPane] = useState<Pane>('appearance')

  return (
    <div className="flex h-full flex-col @2xl/win:flex-row">
      <aside className="shrink-0 border-b border-white/[0.07] bg-black/25 p-2 @2xl/win:w-[200px] @2xl/win:border-b-0 @2xl/win:border-r @2xl/win:p-3">
        <div className="hidden px-2.5 pb-3 pt-1 text-[15px] font-semibold tracking-tight text-ink @2xl/win:block">Settings</div>
        <div className="os-scroll flex gap-1 [scrollbar-width:none] @2xl/win:block @2xl/win:space-y-0.5">
          {PANES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPane(p.id)}
              className={cn('relative flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition-colors @2xl/win:w-full', pane === p.id ? 'text-ink' : 'text-dim hover:bg-white/5 hover:text-ink')}
            >
              {pane === p.id && <motion.span layoutId="settings-nav" className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.055]" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <p.icon size={15} className={cn('relative', pane === p.id && 'text-accent')} />
              <span className="relative">{p.label}</span>
            </button>
          ))}
        </div>
      </aside>

      <motion.div
        key={pane}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="os-scroll min-h-0 min-w-0 flex-1 px-5 py-6 @2xl/win:px-8 @2xl/win:py-7"
      >
        {pane !== 'about' && (
          <h1 className="display mb-7 text-[22px] font-semibold tracking-[-0.01em] text-ink">{PANES.find((x) => x.id === pane)!.label}</h1>
        )}
        {pane === 'appearance' && (
          <>
            <Group title="Wallpaper" bare>
              <div className="grid grid-cols-2 gap-3 @lg/win:grid-cols-3">
                {(Object.keys(WALLPAPERS) as WallpaperId[]).map((id) => {
                  const on = prefs.wallpaper === id
                  return (
                    <button key={id} onClick={() => prefs.set('wallpaper', id)} className="group text-left">
                      <div
                        className={cn('relative aspect-[16/10] overflow-hidden rounded-[10px] border transition-all duration-200', on ? 'border-accent shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_22%,transparent)]' : 'border-white/[0.08] group-hover:border-white/20')}
                        style={PREVIEW[id]}
                      >
                        {on && (
                          <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-accent text-[#05060a]"><Check size={12} strokeWidth={3} /></span>
                        )}
                      </div>
                      <div className="mt-2 text-[13px] font-medium text-ink">{WALLPAPERS[id].name}</div>
                      <div className="text-[11.5px] text-faint">{WALLPAPERS[id].note}</div>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[12px] text-faint">Photographs: NASA and the US National Park Service (Jeremy M. White), public domain.</p>
            </Group>

            <Group title="Accent colour" bare>
              <div className="flex flex-wrap gap-2.5">
                {(Object.keys(ACCENTS) as AccentId[]).map((id) => {
                  const a = ACCENTS[id]
                  const on = prefs.accent === id
                  return (
                    <button
                      key={id}
                      onClick={() => prefs.set('accent', id)}
                      className={cn('flex h-11 items-center gap-2.5 rounded-xl border pl-2 pr-3.5 transition-colors', on ? 'border-white/30 bg-white/8' : 'border-line hover:bg-white/5')}
                    >
                      <span className="grid size-7 place-items-center rounded-lg" style={{ background: `linear-gradient(135deg, ${a.value}, ${a.second})` }}>
                        {on && <Check size={14} strokeWidth={3} className="text-[#05060a]" />}
                      </span>
                      <span className="text-[13px] text-ink">{a.name}</span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[12px] text-faint">Project apps keep their own colours.</p>
            </Group>
          </>
        )}

        {pane === 'desktop' && (
          <>
            <Group title="Desktop">
              <Toggle label="Identity panel" note="The clock, ID card and pinned project apps on the desktop" value={prefs.showWidgets} onChange={(v) => prefs.set('showWidgets', v)} />
              <Toggle label="Dock magnification" note="Icons grow as the pointer moves across the dock" value={prefs.dockMagnify} onChange={(v) => prefs.set('dockMagnify', v)} />
              <Toggle label="24-hour clock" value={prefs.clock24} onChange={(v) => prefs.set('clock24', v)} />
            </Group>
            <Group title="Startup">
              <Toggle label="Boot sequence" note="Play the startup animation on the first visit of a session" value={prefs.bootOnStart} onChange={(v) => prefs.set('bootOnStart', v)} />
            </Group>
            <button
              className="btn"
              onClick={() => {
                prefs.reset()
                notify('Preferences reset', 'Everything is back to its defaults.', 'ok')
              }}
            >
              <RotateCcw size={13} /> Reset to defaults
            </button>
          </>
        )}

        {pane === 'shortcuts' && (
          <Group title="Keyboard and pointer">
            <>
              {SHORTCUTS.map(([keys, what]) => (
                <div key={keys} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <span className="text-[13px] text-ink/85">{what}</span>
                  <kbd className="shrink-0 rounded-md bg-white/[0.07] px-2 py-1 font-mono text-[10.5px] text-ink/80">{keys}</kbd>
                </div>
              ))}
            </>
          </Group>
        )}

        {pane === 'about' && (
          <div className="flex h-full flex-col items-center justify-center pb-8 text-center">
            <span className="text-accent"><OsMark size={54} /></span>
            <div className="display mt-5 text-[24px] font-semibold tracking-[0.3em] text-ink">AARUSH<span className="text-accent">.</span>OS</div>
            <p className="mt-3 max-w-[40ch] text-[13px] leading-relaxed text-dim">
              A portfolio built as a desktop operating system by {profile.name}. {projects.length} project apps installed.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-1.5">
              {['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Motion', 'Zustand'].map((t) => <span key={t} className="chip">{t}</span>)}
            </div>
            <p className="mt-6 text-[11.5px] text-faint">Preferences are saved in this browser only.</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
