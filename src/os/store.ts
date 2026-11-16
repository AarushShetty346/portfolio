import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/* ------------------------------------------------------------------
   Window manager
------------------------------------------------------------------- */
export const TOPBAR_H = 38
export const DOCK_SPACE = 92

export interface Bounds { x: number; y: number; w: number; h: number }

export interface Win extends Bounds {
  /** Unique window id. System apps use their app id; project apps use `project:<slug>`. */
  id: string
  appId: string
  /** Extra data for the app, e.g. the project slug. */
  payload?: string
  z: number
  minimized: boolean
  maximized: boolean
  /** Bumped whenever geometry should animate (maximize, restore, tidy). */
  snapTick: number
}

export interface OpenOptions { id?: string; payload?: string; w?: number; h?: number; minW?: number; minH?: number }

interface WMState {
  windows: Win[]
  topZ: number
  open: (appId: string, opts?: OpenOptions) => void
  close: (id: string) => void
  focus: (id: string) => void
  minimize: (id: string) => void
  toggleMaximize: (id: string) => void
  setBounds: (id: string, b: Partial<Bounds>) => void
  closeAll: () => void
  tidy: () => void
  cycle: () => void
}

const viewport = () => ({ vw: window.innerWidth, vh: window.innerHeight })

export const workArea = () => {
  const { vw, vh } = viewport()
  return { x: 0, y: TOPBAR_H, w: vw, h: vh - TOPBAR_H - DOCK_SPACE }
}

function placeNew(count: number, w: number, h: number): Bounds {
  const area = workArea()
  const cw = Math.min(w, area.w - 48)
  const ch = Math.min(h, area.h - 16)
  const step = (count % 6) * 30
  const x = Math.round(Math.max(24, (area.w - cw) / 2 + step - 60))
  const y = Math.round(Math.max(area.y + 8, area.y + (area.h - ch) / 2 + step - 40))
  return { x: Math.min(x, area.w - cw - 8), y: Math.min(y, area.y + area.h - ch + 40), w: cw, h: ch }
}

export const useWM = create<WMState>((set, get) => ({
  windows: [],
  topZ: 10,

  open: (appId, opts = {}) => {
    const id = opts.id ?? appId
    const existing = get().windows.find((w) => w.id === id)
    const z = get().topZ + 1
    if (existing) {
      set((s) => ({
        topZ: z,
        windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: false, z } : w)),
      }))
      return
    }
    const visible = get().windows.filter((w) => !w.minimized).length
    const b = placeNew(visible, opts.w ?? 920, opts.h ?? 600)
    set((s) => ({
      topZ: z,
      windows: [...s.windows, { id, appId, payload: opts.payload, ...b, z, minimized: false, maximized: false, snapTick: 0 }],
    }))
  },

  close: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focus: (id) => {
    const w = get().windows.find((x) => x.id === id)
    if (!w) return
    if (w.z === get().topZ && !w.minimized) return
    const z = get().topZ + 1
    set((s) => ({ topZ: z, windows: s.windows.map((x) => (x.id === id ? { ...x, z, minimized: false } : x)) }))
  },

  minimize: (id) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)) })),

  toggleMaximize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized, snapTick: w.snapTick + 1 } : w)),
    })),

  setBounds: (id, b) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...b } : w)) })),

  closeAll: () => set({ windows: [] }),

  tidy: () => {
    const area = workArea()
    const open = get().windows.filter((w) => !w.minimized).sort((a, b) => a.z - b.z)
    const n = open.length
    if (!n) return
    const cols = Math.ceil(Math.sqrt(n))
    const rows = Math.ceil(n / cols)
    const gap = 12
    const cw = (area.w - gap * (cols + 1)) / cols
    const ch = (area.h - gap * (rows + 1)) / rows
    const next = new Map<string, Bounds>()
    open.forEach((w, i) => {
      const c = i % cols
      const r = Math.floor(i / cols)
      next.set(w.id, {
        x: Math.round(gap + c * (cw + gap)),
        y: Math.round(area.y + gap + r * (ch + gap)),
        w: Math.round(cw),
        h: Math.round(ch),
      })
    })
    set((s) => ({
      windows: s.windows.map((w) =>
        next.has(w.id) ? { ...w, ...next.get(w.id)!, maximized: false, snapTick: w.snapTick + 1 } : w,
      ),
    }))
  },

  cycle: () => {
    const open = get().windows.filter((w) => !w.minimized).sort((a, b) => a.z - b.z)
    if (open.length < 2) return
    get().focus(open[0].id)
  },
}))

/** Id of the focused (top-most, visible) window. */
export const useFocusedId = () =>
  useWM((s) => {
    let top: Win | undefined
    for (const w of s.windows) if (!w.minimized && (!top || w.z > top.z)) top = w
    return top?.id
  })

/* ------------------------------------------------------------------
   Preferences (persisted locally)
------------------------------------------------------------------- */
export type WallpaperId = 'city' | 'horizon' | 'flow' | 'aurora' | 'obsidian'
export type AccentId = 'cyan' | 'violet' | 'magenta' | 'green' | 'amber'

export const ACCENTS: Record<AccentId, { name: string; value: string; second: string }> = {
  cyan: { name: 'Electric cyan', value: '#3ee6ff', second: '#ff4fd8' },
  violet: { name: 'Neon violet', value: '#a98bff', second: '#3ee6ff' },
  magenta: { name: 'Magenta', value: '#ff5fd2', second: '#3ee6ff' },
  green: { name: 'Terminal green', value: '#5dffa8', second: '#3ee6ff' },
  amber: { name: 'Amber', value: '#ffb657', second: '#ff5fd2' },
}

export const WALLPAPERS: Record<WallpaperId, { name: string; note: string }> = {
  city: { name: 'Neon city', note: 'Skyline over a moving grid' },
  horizon: { name: 'Horizon', note: 'Drifting perspective grid' },
  flow: { name: 'Flow field', note: 'Particles tracing a slow current' },
  aurora: { name: 'Aurora', note: 'Soft moving light' },
  obsidian: { name: 'Obsidian', note: 'Still and dark' },
}

interface Prefs {
  wallpaper: WallpaperId
  accent: AccentId
  scanlines: boolean
  grain: boolean
  bootOnStart: boolean
  reduceMotion: boolean
  clock24: boolean
  dockMagnify: boolean
  showWidgets: boolean
  set: <K extends keyof Omit<Prefs, 'set' | 'reset'>>(k: K, v: Prefs[K]) => void
  reset: () => void
}

const DEFAULT_PREFS = {
  wallpaper: 'city' as WallpaperId,
  accent: 'cyan' as AccentId,
  scanlines: true,
  grain: true,
  bootOnStart: true,
  reduceMotion: false,
  clock24: false,
  dockMagnify: true,
  showWidgets: true,
}

export const usePrefs = create<Prefs>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFS,
      set: (k, v) => set({ [k]: v } as Partial<Prefs>),
      reset: () => set({ ...DEFAULT_PREFS }),
    }),
    {
      name: 'aarush-os:prefs',
      version: 2,
      // v2 introduced the Neon city wallpaper as the default look
      migrate: (state) => ({ ...(state as Prefs), wallpaper: 'city' as WallpaperId }),
    },
  ),
)

/* ------------------------------------------------------------------
   Notifications
------------------------------------------------------------------- */
export interface Notice { id: number; title: string; body?: string; tone?: 'info' | 'ok' | 'warn' }

export interface LoggedNotice extends Notice { at: number }

interface NoticeState {
  items: Notice[]
  /** Everything shown this session, newest first, for the control centre. */
  history: LoggedNotice[]
  unread: number
  markRead: () => void
  clearHistory: () => void
  push: (n: Omit<Notice, 'id'>, ttl?: number) => void
  dismiss: (id: number) => void
}

let noticeId = 0
export const useNotices = create<NoticeState>((set, get) => ({
  items: [],
  history: [],
  unread: 0,
  markRead: () => set({ unread: 0 }),
  clearHistory: () => set({ history: [], unread: 0 }),
  push: (n, ttl = 4800) => {
    const id = ++noticeId
    set((s) => ({
      items: [...s.items.slice(-3), { ...n, id }],
      history: [{ ...n, id, at: Date.now() }, ...s.history].slice(0, 12),
      unread: s.unread + 1,
    }))
    window.setTimeout(() => get().dismiss(id), ttl)
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}))

export const notify = (title: string, body?: string, tone: Notice['tone'] = 'info') =>
  useNotices.getState().push({ title, body, tone })

/* ------------------------------------------------------------------
   Shell UI state (launcher, boot)
------------------------------------------------------------------- */
interface ShellState {
  launcher: boolean
  booted: boolean
  setLauncher: (v: boolean) => void
  setBooted: (v: boolean) => void
}
export const useShell = create<ShellState>((set) => ({
  launcher: false,
  booted: false,
  setLauncher: (launcher) => set({ launcher }),
  setBooted: (booted) => set({ booted }),
}))
