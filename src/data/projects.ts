/* ------------------------------------------------------------------
   PROJECTS - the single place to edit project content.

   Each entry becomes its own application (tile, icon, window).
   Text fields left as '' render a "coming soon" slot in the UI.
   The three long fields are:

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
    overview: `ASTFLOW answers plain-English questions about a JavaScript codebase. Ask where something happens and it returns ranked source snippets, a static call graph around them, and a comparison between two Git versions of the repository.

It was built by Team ByteCoders for the Samsung PRISM GenAI Hackathon, which requires the system to run on CPU. Everything runs locally: there is no hosted model behind it.

My part was the evaluation and model selection, the speed work and the CI.`,
    technical: `Search is dense retrieval with one embedding model (Alibaba-NLP/gte-modernbert-base), cosine similarity and float32 vectors on CPU.

I chose that setup under a pre-registered protocol: tune on a dev split, then run the test set once. On the MTEB AppsRetrieval test set (3,765 queries, 8,765 documents) NDCG@10 went from 0.063 with a BM25 baseline to 0.551.

I also tested reranking, long-query windowing and hybrid BM25 fusion against accept/reject rules set in advance, with paired-bootstrap confidence intervals. Only changes that beat the baseline on held-out data shipped.

Raising the embedding model's CPU thread cap from 4 to 8 cut full-corpus indexing from 6,474 s to 3,968 s (39% less time), with identical top-10 results on every query.`,
    architecture: `A FastAPI backend indexes a repository into SQLite and serves search, the call graph and version comparison through a REST API. A React and TypeScript UI sits on top of it.

The project ships with a Docker build. GitHub Actions gates every change on pytest, lint, dependency audits (pip-audit, npm audit), the Docker build, and Playwright end-to-end and accessibility tests.`,
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
    overview: `RelayRoom is a real-time workspace where teammates and their local coding agents (Claude Code, Codex) work in one place. Everyone shares a chat, a task board with structured handoffs, and project memory.

I built it because agent work usually happens in one person's terminal where nobody else can see it. RelayRoom puts the requests, the handoffs and the results in a room the whole team can read.`,
    technical: `Agents run on the developer's own machine. A local adapter connects outbound to the server and runs each agent inside one registered directory.

The safety model is the core of the project: hashed, revocable agent tokens; at-most-once task dispatch with crash recovery; a local permission cap with commands that are always denied, such as git push; and opt-in human Approve or Deny for anything outside the policy.

114 tests cover it (Vitest with an in-process Postgres), plus smoke tests against the real providers. I verified the Claude Code integration end to end, including a file-editing task and the deny rules.`,
    architecture: `A Fastify server keeps state in PostgreSQL through Drizzle and pushes updates to clients over Socket.IO. The web client is React on Vite.

The adapter is a separate local process. It authenticates with an agent token, receives dispatched tasks, applies the permission cap before anything runs, and reports results back to the room.`,
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
    overview: `ACTIVA turns a first-person (egocentric) video into one JSON file. The file holds a label for the video such as cooking or skiing, every action found in it as verb, noun, time segment and confidence, and highlight segments that together stay within 15% of the video's length.

It was built by Team LensLog for the Samsung PRISM XR Hackathon 2026.`,
    technical: `Two branches read the same video. One samples frames at 2 fps and runs CLIP to get a zero-shot label and a per-frame importance score based on novelty. The other extracts SlowFast features at 30 fps and runs ActionFormer to detect verbs and nouns, which are paired and filtered with non-maximum suppression.

The highlight selector then packs segments greedily, rewarding coverage of distinct actions and importance while staying inside the time budget.

Labels, verbs and nouns come only from the organisers' class list; nothing is hardcoded.`,
    architecture: `A single entry point, run.sh, takes an input video and an output path and never touches the network. Model files are downloaded once by a setup script that verifies every file by SHA-256.

Each stage has a fallback: if one fails, the pipeline logs it and still writes a valid file, because a missing file scores zero. A strict mode turns any fallback into a hard failure, which the team uses to verify releases.`,
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
    overview: `Lap by Lap is a Formula 1 data platform. It stores a full season, 24 races and 26,657 laps with per-lap telemetry, and lets you explore it in the browser.

It doubles as a database project: the interesting queries are part of the product, and the app shows the query plan behind them.`,
    technical: `The backend exposes 50 REST endpoints, covered by 24 integration tests that run against a real MongoDB.

On the database side it uses 15 MongoDB features and 12 analytical queries: multi-document transactions, compound and text indexes, schema validation, aggregation pipelines, window functions and geospatial queries. Query plans (explain output) are shown in the UI so you can check that an index is actually used.`,
    architecture: `A Node.js and Express API sits on MongoDB. The frontend is React with Three.js. The stack runs in Docker and the live demo is hosted on Render.

The demo is on a free server, so the first load after it has been idle can take up to a minute.`,
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
    overview: `FutureFork compares popular US stocks using live market data and lets you try out investment strategies in a simulation. You pick an amount, a risk level and a time horizon, and it shows how the outcome could play out.

I built it for my Web Programming course at VIT Vellore.`,
    technical: `Live quotes for 10 US stocks come from the Finnhub API, with prices in USD or INR. Two stocks can be compared side by side, and the charts are custom SVG.

The simulator uses a simplified model meant for learning, not prediction, and the historical charts are generated for illustration.`,
    architecture: `It is a React app that runs entirely in the browser with no backend. The API key lives in a local config file that is kept out of git.

Next steps I have in mind: real historical candle data, a move to Vite, and a better simulation model.`,
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
    hero: './shots/shikshak-home.jpg',
    shots: [
      { src: './shots/shikshak-home.jpg', caption: 'Start screen' },
      { src: './shots/shikshak-onboarding.jpg', caption: 'Learner setup' },
    ],
    overview: `Shikshak is a voice maths tutor for school students in India, classes 8 to 12. You talk to it in Hindi, English, Tamil or Telugu, and it explains a topic out loud while writing on a shared chalkboard: headings, worked steps, graphs and diagrams, timed with its voice.

Then it is your turn. You solve the problem on the same board by hand, by typing or by sending a photo of your notebook. Shikshak reads your working, checks every line, circles the first step that went wrong and helps with hints rather than the answer.

It was built for the Bolna Buildathon at Symphony 2026. I wrote about two-thirds of the code and set up the live deployment.`,
    technical: `The voice runs on Bolna. When the tutor wants to write something, the voice agent makes a tool call, and a WebSocket server turns that call into a live update on the student's board.

Checking does not trust a language model with arithmetic. A vision model reads the handwriting, then an exact-arithmetic engine I wrote (BigInt fractions and sums of square roots) verifies each step and finds the first wrong line.

I measured an estimated 1.56 s median and 2.36 s p95 voice response time across 23 calls (201 turns), using a benchmark harness built on Bolna's per-component timings.`,
    architecture: `One Node.js process serves everything: the Express API, the tool-call endpoints the voice agent hits, and the WebSocket connection to each board. The client is React and TypeScript and runs in the browser on phones, tablets and computers.

Sessions are kept in the browser and re-sent to the server after a restart, and the server never routes a tool call to a session other than the one named in it. The project is tested with Vitest unit tests and Playwright browser tests on phone and desktop layouts.`,
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
    overview: `Cadence is a teaching lab for ICMP covert timing channels: hiding a message in the gaps between ping packets instead of in their contents. It shows how such a channel works and how to detect it.

It was a team project. My part was the Python detection package.`,
    technical: `The detector looks at inter-packet delays over sliding windows and computes four features: standard deviation, interquartile range, entropy and KS distance.

There are two detectors: one with fixed rules, and one calibrated on the 95th percentile of normal traffic. A benchmark measures detection rate against false-positive rate across covert gap sizes, network jitter and packet loss, so a detector only counts when it does not also flag normal traffic.

All results come from simulated traces, so I do not quote accuracy numbers for real networks.`,
    architecture: `The Python package is split into small modules for simulation, capture, features, detection, benchmarking and metrics. It is tested with pytest.

My teammates built the browser UI in React and TypeScript, including the encryption scene.`,
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
    overview: `Compiler Visualizer walks through compiler-design algorithms one step at a time. Type a regular expression and watch it become a DFA.

It exists because these algorithms are much easier to follow when you can see every intermediate step.`,
    technical: `The regex to DFA conversion uses the direct method: build the augmented syntax tree, compute nullable, firstpos and lastpos, then followpos, then the DFA. There is also an operator-precedence parser.

Each algorithm is a pure function, separate from the UI. Together they are covered by 113 unit and randomized tests.`,
    architecture: `It is a React and TypeScript app on Vite with no backend, hosted on GitHub Pages. The UI steps through each algorithm with automatic graph layout and animated transitions between states.

Animations respect the reduced-motion setting on your device.`,
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
    hero: './shots/scamlingo-live.jpg',
    shots: [
      { src: './shots/scamlingo-live.jpg', caption: 'Live risk score and transcript' },
      { src: './shots/scamlingo-alert.jpg', caption: 'Scam alert' },
      { src: './shots/scamlingo-demos.jpg', caption: 'Demo calls' },
      { src: './shots/scamlingo-home.jpg', caption: 'Home' },
    ],
    overview: `ScamLingo is a live scam-call shield for Indian phone users. If a call feels off, you put it on speaker. ScamLingo listens for the language scammers use, such as "digital arrest" or "share the OTP", and warns you out loud in your own language before you share a code or send money.

When the call ends you get a plain-language summary you can forward to family on WhatsApp. It handles calls in 10 Indian languages and code-mixed Hinglish.`,
    technical: `Detection is rules first. Every utterance is scanned for 8 scam signals, including OTP requests, impersonation, digital-arrest threats, payment requests and remote-access apps. Signals combine: authority plus a request for an OTP, money or an app means danger. Safety advice such as "the bank never asks for your OTP" is recognised as advice, so genuine calls stay safe.

An optional language model rereads the recent transcript as a second opinion. It can raise the risk, but it cannot label a call a scam on its own without a rule hit.

The app also avoids hearing itself: it sends silence while its own warning plays, and the server drops any transcript that matches a warning it just spoke.`,
    architecture: `The browser streams microphone audio over a WebSocket to a FastAPI session, which forwards it to Gnani's realtime speech-to-text. Transcripts go through the detector, which keeps a risk score from 0 to 100. When the risk rises, the warning is spoken with Gnani's text-to-speech, with the browser's own voice as a fallback if the clip is slow.

Besides live calls there are scripted demo calls and a mode that checks an uploaded recording.`,
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
    hero: './shots/stock-predict-home.jpg',
    shots: [{ src: './shots/stock-predict-home.jpg', caption: 'Watchlist' }],
    overview: `Stock Predict is a Flutter mobile app that shows company profiles, closing-price history and a 30-day price projection for US stocks.

I built it as the sole developer during my internship at Applied Cloud Computing in summer 2025, learning Flutter and Dart from scratch along the way, with mentorship from the ACC team.`,
    technical: `The projection is simple and explainable. It averages the news-sentiment scores for a ticker, turns that average into a daily percentage change, and compounds it over 30 days from the last close.

Price charts cover 4 ranges: 1W, 1M, 1Y and MAX.`,
    architecture: `The app uses 3 Financial Modeling Prep REST endpoints: company profile, historical prices and news sentiment. Sign-in is Google through Firebase Authentication.`,
  },
]

export const projectBySlug = (slug?: string) => projects.find((p) => p.slug === slug)
export const appLabel = (p: Project) => `${p.name.toUpperCase().replace(/\s+/g, '')}.app`
export const categories: Category[] = ['AI & Agents', 'Web', 'Data & Viz', 'Systems', 'Mobile']
