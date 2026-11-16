/* ------------------------------------------------------------------
   PROFILE - edit your personal details, links and About copy here.
   This site is public: keep phone numbers, grades and anything
   private out of this file.
------------------------------------------------------------------- */

export const profile = {
  name: 'Aarush Shetty',
  handle: 'AarushShetty346',
  role: 'Computer Science student',
  school: 'VIT Vellore',
  degree: 'B.Tech, Computer Science and Engineering',
  gradYear: '2028',
  location: 'India',
  timezone: 'Asia/Kolkata',

  /** Short line under the name. */
  headline: 'I build full-stack products, AI agents and tools that make data easy to see.',

  /** About paragraphs. Leave empty to show the "write-up pending" slot. */
  bio: [
    'I am a Computer Science student at VIT Vellore, graduating in 2028. I like building things end to end: the server, the interface, the tests and the deployment.',
    'Most of what I have built sits in three areas: tools for AI agents and code (ASTFLOW, RelayRoom), voice products for India (Shikshak, ScamLingo), and software that makes data easy to explore (Lap by Lap, Compiler Visualizer).',
    'I care about measuring things properly. If I say something got faster or more accurate, there is a benchmark behind it. I also contribute to open source, with 12 pull requests merged into Checkstyle.',
    'I am looking for a software engineering internship for summer 2027.',
  ] as string[],

  interests: ['Full-stack web', 'Voice AI', 'AI agents', 'Data visualisation', 'Networks'],

  buildingNow: [
    { name: 'Shikshak', note: 'a voice tutor', project: 'shikshak' },
    { name: 'RelayRoom', note: 'one workspace for devs and their AI agents', project: 'relayroom' },
  ],

  skills: [
    { group: 'Languages', items: ['C++', 'Java', 'Python', 'TypeScript', 'JavaScript', 'SQL', 'Dart', 'C'] },
    { group: 'Frontend', items: ['React', 'Vite', 'three.js', 'Motion', 'Flutter', 'HTML', 'CSS'] },
    { group: 'Backend', items: ['Node.js', 'Express', 'Fastify', 'FastAPI', 'Socket.IO', 'WebSockets'] },
    { group: 'Data', items: ['PostgreSQL', 'MongoDB', 'SQLite', 'Firebase', 'PyTorch', 'NumPy'] },
    { group: 'Tooling', items: ['Git', 'GitHub Actions', 'Docker', 'Vitest', 'Playwright', 'pytest'] },
  ],

  links: {
    github: 'https://github.com/AarushShetty346',
    linkedin: 'https://www.linkedin.com/in/aarush-shetty3/',
    email: 'aarushshetty3@gmail.com',
  },

  /**
   * Resume file. Put a PDF at /public/resume.pdf and set this to './resume.pdf'.
   * While it is empty, the Resume app shows an empty state instead of a broken viewer.
   * The file is public once deployed, so use a version without your phone number.
   */
  resume: '',
}
