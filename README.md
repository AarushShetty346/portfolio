# AARUSH.OS

My portfolio, built as a desktop operating system: windows, a dock, a launcher, and every project as its own app.

## Run it

```bash
npm install
npm run dev
```

`npm run build` type-checks and writes the static site to `dist/`. It can be hosted anywhere that serves static files.

## Editing content

All content lives in three files. Components never hold copy.

| File | What it controls |
|---|---|
| `src/data/projects.ts` | Every project app: name, tagline, colours, icon, stack, links, screenshots, and the `overview`, `technical` and `architecture` write-ups |
| `src/data/profile.ts` | Name, headline, bio, skills, links, resume file |
| `src/data/experience.ts` | Internships, hackathons, open source, achievements |

A field left as `''` or `[]` shows a "coming soon" slot. While running `npm run dev`, each slot prints the exact field to fill in.

- **Add a project:** copy an entry in `projects.ts` and change the `slug`. It appears in the library, the launcher and search.
- **Add a resume:** put the PDF at `public/resume.pdf` and set `resume: './resume.pdf'` in `profile.ts`.
- **Add screenshots:** drop files in `public/projects/<slug>/` and reference them as `./projects/<slug>/name.png`.

## Shareable links

`/#project=astflow` opens straight into a project app. `/#app=github` opens a system app.

## This site is public

Everything in `src/` and `public/` ships to the browser. Keep phone numbers, grades, tokens and private repository details out. GitHub data is read from the public API without a token.

## Shortcuts

`Ctrl K` search, `Alt W` close, `Alt M` minimize, `Alt Enter` maximize, `Alt T` tidy, `` Alt ` `` next window, `Alt 1-8` dock apps.
