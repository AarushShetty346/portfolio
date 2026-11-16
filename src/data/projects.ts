/* ------------------------------------------------------------------
   PROJECTS - the single place to edit project content.

   Each entry becomes its own application (tile, icon, window).
   Text fields left as '' render a "write-up pending" slot in the UI,
   so fill them in whenever you are ready:

     overview      what it is and why it exists (plain paragraphs)
     technical     how it works, the interesting engineering
     architecture  system design, data flow, trade-offs

   Use a blank line between paragraphs. Screenshots are plain URLs
   (or files dropped into /public/projects/<slug>/ and referenced as
   './projects/<slug>/shot.png').
------------------------------------------------------------------- */

export type Motif = 'graph' | 'track' | 'pulse' | 'wave' | 'matrix' | 'rings'
export type Category = 'AI & Agents' | 'Web' | 'Data & Viz' | 'Systems' | 'Mobile'

export interface Shot { src: string; caption?: string }

export interface Project {
  slug: string
  /** Display name, also used for the "<NAME>.app" label. */
  name: string
  /** One line, shown on tiles and under the title. */
  tagline: string
  category: Category
  /** Event, course or "Personal project". */
  context?: string
  year?: string
  /** Lucide icon name from src/os/icons.tsx glyph map. */
  glyph: string
  /** Identity colours for this project's app. */
  accent: string
  accent2: string
  motif: Motif
  /** "owner/repo" on GitHub. Live stats are pulled from the public API. */
  repo?: string
  demo?: string
  video?: string
  stack: string[]
  featured?: boolean
  hero?: string
  shots: Shot[]
  overview: string
  technical: string
  architecture: string
}

const raw = (repo: string, path: string) => `https://raw.githubusercontent.com/${repo}/main/${path}`

export const projects: Project[] = [
  {
    slug: 'astflow',
    name: 'ASTFLOW',
    tagline: 'Local, CPU-based code retrieval and repository investigation engine.',
    category: 'AI & Agents',
    context: 'Samsung PRISM GenAI Hackathon 2026',
    year: '2026',
    glyph: 'Workflow',
    accent: '#3ee6ff',
    accent2: '#5dffa8',
    motif: 'graph',
    repo: 'ANUJ-DESHPANDE/ASTFLOW',
    video: 'https://www.youtube.com/watch?v=zBjj9Nmn_7I',
    stack: ['Python', 'FastAPI', 'PyTorch', 'SQLite', 'React', 'TypeScript', 'Docker', 'GitHub Actions'],
    featured: true,
    hero: raw('ANUJ-DESHPANDE/ASTFLOW', 'audit/evidence/ui-crawl/desktop-map_overview.png'),
    shots: [
      { src: raw('ANUJ-DESHPANDE/ASTFLOW', 'audit/evidence/ui-crawl/desktop-map_overview.png'), caption: 'Repository map' },
      { src: raw('ANUJ-DESHPANDE/ASTFLOW', 'audit/evidence/ui-crawl/desktop-code_after_search.png'), caption: 'Code search' },
      { src: raw('ANUJ-DESHPANDE/ASTFLOW', 'audit/evidence/ui-crawl/desktop-map_node_selected.png'), caption: 'Call graph node' },
      { src: raw('ANUJ-DESHPANDE/ASTFLOW', 'audit/evidence/ui-crawl/desktop-compare_after_run_.png'), caption: 'Snapshot compare' },
    ],
    overview: '',
    technical: '',
    architecture: '',
  },
  {
    slug: 'relayroom',
    name: 'RelayRoom',
    tagline: 'Shared workspace for humans and local coding agents.',
    category: 'AI & Agents',
    context: 'Personal project',
    year: '2026',
    glyph: 'MessagesSquare',
    accent: '#a98bff',
    accent2: '#ff5fd2',
    motif: 'rings',
    repo: 'AarushShetty346/relayroom',
    video: 'https://youtu.be/BA5JB0wk3IE',
    stack: ['TypeScript', 'Node.js', 'Fastify', 'Socket.IO', 'PostgreSQL', 'Drizzle', 'React', 'Vite', 'Vitest'],
    featured: true,
    hero: raw('AarushShetty346/relayroom', 'docs/images/room-chat.png'),
    shots: [
      { src: raw('AarushShetty346/relayroom', 'docs/images/room-chat.png'), caption: 'Room chat' },
      { src: raw('AarushShetty346/relayroom', 'docs/images/handoff.png'), caption: 'Handoff: observed vs reported' },
      { src: raw('AarushShetty346/relayroom', 'docs/images/handoff-blocked-command.png'), caption: 'Blocked command' },
    ],
    overview: '',
    technical: '',
    architecture: '',
  },
  {
    slug: 'activa',
    name: 'ACTIVA',
    tagline: 'Egocentric video in, actions and highlights out.',
    category: 'AI & Agents',
    context: 'Samsung PRISM XR Hackathon 2026',
    year: '2026',
    glyph: 'Aperture',
    accent: '#ff8a4c',
    accent2: '#ffd166',
    motif: 'matrix',
    repo: 'harshjha15335/ACTIVA',
    stack: ['Python', 'PyTorch', 'FFmpeg', 'Jupyter'],
    featured: true,
    shots: [],
    overview: '',
    technical: '',
    architecture: '',
  },
  {
    slug: 'lapbylap',
    name: 'Lap by Lap',
    tagline: 'Every lap of the 2025 Formula 1 season, explorable in the browser.',
    category: 'Data & Viz',
    year: '2026',
    glyph: 'Gauge',
    accent: '#ff4d5e',
    accent2: '#ffb657',
    motif: 'track',
    repo: 'AarushShetty346/motorsport-viz',
    demo: 'https://lap-by-lap.onrender.com',
    stack: ['React', 'Vite', 'three.js', 'Node.js', 'Express', 'MongoDB', 'Docker'],
    featured: true,
    hero: raw('AarushShetty346/motorsport-viz', 'docs/screenshots/home.png'),
    shots: [
      { src: raw('AarushShetty346/motorsport-viz', 'docs/screenshots/home.png'), caption: 'Season' },
      { src: raw('AarushShetty346/motorsport-viz', 'docs/screenshots/race.png'), caption: 'Race' },
      { src: raw('AarushShetty346/motorsport-viz', 'docs/screenshots/driver.png'), caption: 'Driver' },
      { src: raw('AarushShetty346/motorsport-viz', 'docs/screenshots/team.png'), caption: 'Team' },
      { src: raw('AarushShetty346/motorsport-viz', 'docs/screenshots/compare.png'), caption: 'Head to head' },
    ],
    overview: '',
    technical: '',
    architecture: '',
  },
  {
    slug: 'futurefork',
    name: 'FutureFork',
    tagline: 'Stock comparison and investment strategy simulator.',
    category: 'Web',
    context: 'Web Programming coursework, VIT Vellore',
    glyph: 'Split',
    accent: '#5dffa8',
    accent2: '#3ee6ff',
    motif: 'wave',
    repo: 'AarushShetty346/futurefork',
    stack: ['React', 'JavaScript', 'HTML', 'CSS', 'Finnhub API', 'SVG'],
    hero: raw('AarushShetty346/futurefork', 'assets/landing.png'),
    shots: [
      { src: raw('AarushShetty346/futurefork', 'assets/landing.png'), caption: 'Landing' },
      { src: raw('AarushShetty346/futurefork', 'assets/stocks-dashboard.png'), caption: 'Stocks' },
      { src: raw('AarushShetty346/futurefork', 'assets/comparison.png'), caption: 'Comparison' },
      { src: raw('AarushShetty346/futurefork', 'assets/simulation.png'), caption: 'Simulation' },
      { src: raw('AarushShetty346/futurefork', 'assets/results.png'), caption: 'Results' },
    ],
    overview: '',
    technical: '',
    architecture: '',
  },
  {
    slug: 'shikshak',
    name: 'Shikshak',
    tagline: 'A voice maths tutor that teaches on a shared chalkboard.',
    category: 'AI & Agents',
    context: 'Bolna Buildathon, Symphony 2026',
    year: '2026',
    glyph: 'GraduationCap',
    accent: '#ffc857',
    accent2: '#ff8a4c',
    motif: 'wave',
    repo: 'AarushShetty346/Shikshak',
    demo: 'https://shikshak-o0l8.onrender.com',
    stack: ['TypeScript', 'React', 'Node.js', 'Express', 'WebSockets', 'Bolna', 'Vitest', 'Playwright'],
    shots: [],
    overview: '',
    technical: '',
    architecture: '',
  },
  {
    slug: 'cadence',
    name: 'Cadence',
    tagline: 'Teaching lab for ICMP covert timing channels and how to detect them.',
    category: 'Systems',
    glyph: 'Activity',
    accent: '#5b9dff',
    accent2: '#3ee6ff',
    motif: 'pulse',
    repo: 'AarushShetty346/icmp_traffic_analysis',
    demo: 'https://aarushshetty346.github.io/icmp_traffic_analysis',
    stack: ['Python', 'NumPy', 'pytest', 'React', 'TypeScript'],
    hero: raw('AarushShetty346/icmp_traffic_analysis', 'docs-ui/screens/signal-light-1440.png'),
    shots: [
      { src: raw('AarushShetty346/icmp_traffic_analysis', 'docs-ui/screens/signal-light-1440.png'), caption: 'Signal' },
      { src: raw('AarushShetty346/icmp_traffic_analysis', 'docs-ui/screens/detectors-light-1440.png'), caption: 'Detectors' },
      { src: raw('AarushShetty346/icmp_traffic_analysis', 'docs-ui/screens/runs-light-1440.png'), caption: 'Runs' },
      { src: raw('AarushShetty346/icmp_traffic_analysis', 'docs-ui/screens/decode-light-1440.png'), caption: 'Decode' },
    ],
    overview: '',
    technical: '',
    architecture: '',
  },
  {
    slug: 'compiler-visualizer',
    name: 'Compiler Visualizer',
    tagline: 'Compiler-design algorithms, walked through one step at a time.',
    category: 'Web',
    glyph: 'Regex',
    accent: '#ff5fd2',
    accent2: '#a98bff',
    motif: 'graph',
    repo: 'AarushShetty346/regex2dfa',
    demo: 'https://aarushshetty346.github.io/regex2dfa',
    stack: ['React', 'TypeScript', 'Vite', 'Vitest', 'GSAP', 'dagre'],
    hero: raw('AarushShetty346/regex2dfa', 'audit/screenshots/after/home-1440.jpg'),
    shots: [
      { src: raw('AarushShetty346/regex2dfa', 'audit/screenshots/after/home-1440.jpg'), caption: 'Regex to DFA' },
      { src: raw('AarushShetty346/regex2dfa', 'audit/screenshots/after/bottom-up-1440.jpg'), caption: 'Bottom-up parsing' },
    ],
    overview: '',
    technical: '',
    architecture: '',
  },
  {
    slug: 'scamlingo',
    name: 'ScamLingo',
    tagline: 'A live scam-call shield that warns you out loud, in your language.',
    category: 'AI & Agents',
    year: '2026',
    glyph: 'ShieldAlert',
    accent: '#2ee6c0',
    accent2: '#ffc857',
    motif: 'pulse',
    repo: 'AarushShetty346/gnani-voice-app',
    video: 'https://youtu.be/DQaPu_4Ylbc',
    stack: ['Python', 'FastAPI', 'WebSockets', 'Gnani STT', 'Gnani TTS', 'JavaScript'],
    shots: [],
    overview: '',
    technical: '',
    architecture: '',
  },
  {
    slug: 'stock-predict',
    name: 'Stock Predict',
    tagline: 'Flutter app with price history and a sentiment-based 30-day projection.',
    category: 'Mobile',
    context: 'Internship project, Applied Cloud Computing',
    year: '2025',
    glyph: 'TrendingUp',
    accent: '#b9f24a',
    accent2: '#5dffa8',
    motif: 'matrix',
    repo: 'AarushShetty346/stock-prediction-app',
    stack: ['Flutter', 'Dart', 'Firebase Auth', 'REST APIs', 'fl_chart'],
    shots: [],
    overview: '',
    technical: '',
    architecture: '',
  },
]

export const projectBySlug = (slug?: string) => projects.find((p) => p.slug === slug)
export const appLabel = (p: Project) => `${p.name.toUpperCase().replace(/\s+/g, '')}.app`
export const categories: Category[] = ['AI & Agents', 'Web', 'Data & Viz', 'Systems', 'Mobile']
