import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { AtSign, Boxes, BriefcaseBusiness, FileText, Radar, SlidersHorizontal, UserRound } from 'lucide-react'
import { appLabel, projectBySlug } from '../data/projects'
import { GitHubMark, glyphFor, type IconType } from './icons'
import { useWM, type Win } from './store'

export interface AppProps { win: Win }

export interface AppDef {
  id: string
  name: string
  /** Short description for the launcher. */
  blurb: string
  icon: IconType
  color: string
  w: number
  h: number
  component: LazyExoticComponent<ComponentType<AppProps>>
}

export const APPS: AppDef[] = [
  { id: 'projects', name: 'Projects', blurb: 'Software library', icon: Boxes, color: '#3ee6ff', w: 1060, h: 660, component: lazy(() => import('../apps/Projects')) },
  { id: 'github', name: 'GitHub', blurb: 'Repositories and commits', icon: GitHubMark, color: '#e9edf5', w: 1000, h: 640, component: lazy(() => import('../apps/GitHub')) },
  { id: 'about', name: 'About', blurb: 'Profile', icon: UserRound, color: '#b07cff', w: 860, h: 600, component: lazy(() => import('../apps/About')) },
  { id: 'experience', name: 'Experience', blurb: 'Internships and hackathons', icon: BriefcaseBusiness, color: '#ffb657', w: 900, h: 620, component: lazy(() => import('../apps/Experience')) },
  { id: 'resume', name: 'Resume', blurb: 'View and download', icon: FileText, color: '#5b9dff', w: 820, h: 660, component: lazy(() => import('../apps/Resume')) },
  { id: 'contact', name: 'Contact', blurb: 'Get in touch', icon: AtSign, color: '#ff5fd2', w: 760, h: 520, component: lazy(() => import('../apps/Contact')) },
  { id: 'settings', name: 'Settings', blurb: 'Wallpaper, accent, preferences', icon: SlidersHorizontal, color: '#aab3c5', w: 820, h: 580, component: lazy(() => import('../apps/Settings')) },
  { id: 'monitor', name: 'System Monitor', blurb: 'Session status', icon: Radar, color: '#5dffa8', w: 780, h: 540, component: lazy(() => import('../apps/Monitor')) },
]

const ProjectApp = lazy(() => import('../apps/ProjectApp'))

export const appById = (id: string) => APPS.find((a) => a.id === id)

export interface ResolvedApp {
  title: string
  /** One short line of context shown beside the title in the window bar. */
  subtitle: string
  icon: IconType
  color: string
  color2?: string
  variant: 'system' | 'project'
  /** Overrides --accent inside the window, giving project apps their own identity. */
  accent?: string
  component: LazyExoticComponent<ComponentType<AppProps>>
}

/** Turn a window record into everything the shell needs to draw it. */
export function resolveApp(win: Pick<Win, 'appId' | 'payload'>): ResolvedApp | undefined {
  if (win.appId === 'project') {
    const p = projectBySlug(win.payload)
    if (!p) return undefined
    return {
      title: appLabel(p), subtitle: p.category, icon: glyphFor(p.glyph), color: p.accent, color2: p.accent2,
      variant: 'project', accent: p.accent, component: ProjectApp,
    }
  }
  const a = appById(win.appId)
  if (!a) return undefined
  return { title: a.name, subtitle: a.blurb, icon: a.icon, color: a.color, variant: 'system', component: a.component }
}

export function openApp(id: string) {
  const a = appById(id)
  if (a) useWM.getState().open(id, { w: a.w, h: a.h })
}

export function openProject(slug: string) {
  if (projectBySlug(slug)) useWM.getState().open('project', { id: `project:${slug}`, payload: slug, w: 1040, h: 660 })
}
