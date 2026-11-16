import { ArrowUpRight, Download, FileText } from 'lucide-react'
import { profile } from '../data/profile'
import { openApp } from '../os/apps'
import { LinkedInMark } from '../os/icons'

export default function Resume() {
  const file = profile.resume

  if (!file)
    return (
      <div className="grid h-full place-items-center p-8">
        <div className="max-w-sm text-center">
          <div className="relative mx-auto h-[132px] w-[104px]">
            <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-lg border border-line bg-white/[0.02]" />
            <div className="absolute inset-0 rounded-lg border border-line-strong bg-panel p-3.5">
              <FileText size={18} className="text-accent" />
              <div className="mt-3 space-y-1.5">
                <div className="h-1 w-3/4 rounded bg-white/15" />
                <div className="h-1 w-full rounded bg-white/8" />
                <div className="h-1 w-5/6 rounded bg-white/8" />
                <div className="h-1 w-2/3 rounded bg-white/8" />
                <div className="h-1 w-full rounded bg-white/8" />
              </div>
            </div>
          </div>
          <h1 className="mt-7 text-[16px] font-semibold text-ink">Resume not published yet</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-dim">
            The latest version will be available here to read and download. Until then, LinkedIn has the current picture.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <a className="btn btn-accent" href={profile.links.linkedin} target="_blank" rel="noreferrer"><LinkedInMark size={13} /> LinkedIn</a>
            <button className="btn" onClick={() => openApp('experience')}>See experience</button>
          </div>
          {import.meta.env.DEV && (
            <div className="mt-5 inline-block rounded-md border border-line bg-black/30 px-2.5 py-1.5 text-left font-mono text-[10.5px] leading-relaxed text-term">
              add public/resume.pdf, then set<br />src/data/profile.ts &gt; resume: './resume.pdf'
            </div>
          )}
        </div>
      </div>
    )

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-4">
        <FileText size={15} className="text-accent" />
        <span className="text-[13px] text-ink">{profile.name}, resume</span>
        <div className="ml-auto flex gap-2">
          <a className="btn !h-8" href={file} target="_blank" rel="noreferrer">Open in tab <ArrowUpRight size={13} /></a>
          <a className="btn btn-accent !h-8" href={file} download={`${profile.name.replace(/\s+/g, '_')}_Resume.pdf`}><Download size={13} /> Download</a>
        </div>
      </div>
      <iframe title="Resume" src={`${file}#view=FitH&toolbar=0`} className="min-h-0 flex-1 bg-[#1a1c24]" />
    </div>
  )
}
