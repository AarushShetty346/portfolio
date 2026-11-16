import { useState } from 'react'
import { ArrowUpRight, Check, Copy, Mail, Send } from 'lucide-react'
import { profile } from '../data/profile'
import { GitHubMark, LinkedInMark, type IconType } from '../os/icons'
import { notify } from '../os/store'

interface Channel { label: string; value: string; href: string; icon: IconType; color: string }

const channels: Channel[] = [
  { label: 'Email', value: profile.links.email, href: `mailto:${profile.links.email}`, icon: Mail, color: '#ff5fd2' },
  { label: 'LinkedIn', value: profile.links.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), href: profile.links.linkedin, icon: LinkedInMark, color: '#5b9dff' },
  { label: 'GitHub', value: profile.links.github.replace(/^https?:\/\//, ''), href: profile.links.github, icon: GitHubMark, color: '#e9edf5' },
]

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.links.email)
      setCopied(true)
      notify('Email copied', profile.links.email, 'ok')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      notify('Could not copy', 'Select the address and copy it manually.', 'warn')
    }
  }

  const empty = !message.trim()
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (empty) return
    window.location.href = `mailto:${profile.links.email}?subject=${encodeURIComponent(subject || 'Hello from AARUSH.OS')}&body=${encodeURIComponent(message)}`
    notify('Opening your mail app', 'Your message is ready to send from there.')
  }

  return (
    <div className="os-scroll @container h-full"><div className="grid min-h-full grid-cols-1 @2xl:grid-cols-[1fr_1.1fr]">
      <div className="border-line bg-black/20 p-7 @2xl:border-r">
        <h1 className="display text-[26px] font-semibold leading-tight text-ink">Say hello</h1>
        <p className="mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-dim">
          Internships, projects or a question about something here. Email is the fastest way to reach me.
        </p>

        <div className="mt-6 space-y-2">
          {channels.map((c) => (
            <div key={c.label} className="group flex items-center gap-3 rounded-xl border border-line bg-black/20 p-3 transition-colors hover:border-line-strong">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line" style={{ color: c.color, background: `color-mix(in oklab, ${c.color} 10%, transparent)` }}>
                <c.icon size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] text-faint">{c.label}</div>
                <div className="selectable truncate text-[13px] text-ink">{c.value}</div>
              </div>
              {c.label === 'Email' && (
                <button aria-label="Copy email address" title="Copy" onClick={copy} className="grid size-8 place-items-center rounded-md text-dim hover:bg-white/10 hover:text-ink">
                  {copied ? <Check size={14} className="text-term" /> : <Copy size={14} />}
                </button>
              )}
              <a aria-label={`Open ${c.label}`} title="Open" href={c.href} target={c.label === 'Email' ? undefined : '_blank'} rel="noreferrer" className="grid size-8 place-items-center rounded-md text-dim hover:bg-white/10 hover:text-accent">
                <ArrowUpRight size={15} />
              </a>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={send} className="flex min-h-0 flex-col gap-4 p-7" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="c-subject" className="text-[12px] text-dim">Subject</label>
          <input
            id="c-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-10 rounded-lg border border-line bg-black/25 px-3 text-[13.5px] text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60"
            placeholder="Internship opportunity"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <label htmlFor="c-message" className="text-[12px] text-dim">Message</label>
          <textarea
            id="c-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={touched && empty}
            className="os-scroll min-h-[120px] flex-1 resize-none rounded-lg border border-line bg-black/25 p-3 text-[13.5px] leading-relaxed text-ink outline-none transition-colors placeholder:text-faint focus:border-accent/60 aria-[invalid=true]:border-danger/70"
            placeholder="Write your message here"
          />
          {touched && empty && <div className="text-[12px] text-danger">Add a message first.</div>}
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11.5px] leading-snug text-faint">Sends through your own mail app. Nothing is stored here.</span>
          <button type="submit" className="btn btn-accent shrink-0"><Send size={14} /> Compose email</button>
        </div>
      </form>
    </div></div>
  )
}
