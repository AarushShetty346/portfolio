import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, Check, Copy, Mail, Send } from 'lucide-react'
import { profile } from '../data/profile'
import { GitHubMark, LinkedInMark, type IconType } from '../os/icons'
import { notify, usePrefs } from '../os/store'
import { useNow } from '../os/TopBar'

/* ------------------------------------------------------------------
   CONTACT: a short pitch and three ways to reach me on the left,
   a message composer on the right. Nothing is sent from this page:
   the composer hands the draft to the visitor's own mail app.
------------------------------------------------------------------- */

interface Channel { label: string; value: string; href: string; icon: IconType }

const channels: Channel[] = [
  { label: 'Email', value: profile.links.email, href: `mailto:${profile.links.email}`, icon: Mail },
  { label: 'LinkedIn', value: profile.links.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''), href: profile.links.linkedin, icon: LinkedInMark },
  { label: 'GitHub', value: profile.links.github.replace(/^https?:\/\//, ''), href: profile.links.github, icon: GitHubMark },
]

const ease = [0.16, 1, 0.3, 1] as const
const rise = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.04 + i * 0.05, duration: 0.5, ease },
})

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [touched, setTouched] = useState(false)
  const clock24 = usePrefs((s) => s.clock24)
  const now = useNow(30000)
  const homeTime = now.toLocaleTimeString([], { timeZone: profile.timezone, hour: 'numeric', minute: '2-digit', hour12: !clock24 })

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
    <div className="os-scroll @container h-full">
      <div className="grid min-h-full grid-cols-1 @2xl:grid-cols-[1fr_1.05fr]">
        {/* Pitch and channels */}
        <div
          className="flex flex-col p-8 @2xl:border-r @2xl:border-white/[0.07]"
          style={{ background: 'radial-gradient(90% 70% at 0% 0%, color-mix(in oklab, var(--accent-2) 11%, transparent), transparent 65%)' }}
        >
          <motion.div {...rise(0)} className="flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink/60">
            <span className="relative flex size-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-term opacity-60" />
              <span className="relative size-1.5 rounded-full bg-term" />
            </span>
            Open to summer 2027 internships
          </motion.div>
          <motion.h1 {...rise(1)} className="display mt-5 text-[40px] font-semibold leading-[1] tracking-[-0.015em] text-ink">
            Say hello.
          </motion.h1>
          <motion.p {...rise(2)} className="mt-3.5 max-w-[34ch] text-[14px] leading-relaxed text-ink/65">
            Internships, projects or a question about something here. Email is the fastest way to reach me.
          </motion.p>

          <motion.div {...rise(3)} className="mt-8 border-t border-white/[0.07]">
            {channels.map((c) => (
              <div key={c.label} className="group flex items-center gap-3.5 border-b border-white/[0.07] py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-ink/80 transition-colors group-hover:border-accent/50 group-hover:text-accent">
                  <c.icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-faint">{c.label}</div>
                  <div className="selectable mt-0.5 truncate text-[13.5px] text-ink">{c.value}</div>
                </div>
                {c.label === 'Email' && (
                  <button aria-label="Copy email address" title="Copy" onClick={copy} className="win-key !h-8 !w-8">
                    {copied ? <Check size={13} className="text-term" /> : <Copy size={13} />}
                  </button>
                )}
                <a aria-label={`Open ${c.label}`} title="Open" href={c.href} target={c.label === 'Email' ? undefined : '_blank'} rel="noreferrer" className="win-key !h-8 !w-8">
                  <ArrowUpRight size={14} />
                </a>
              </div>
            ))}
          </motion.div>

          <motion.div {...rise(4)} className="mt-auto pt-8 font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.14em] text-faint">
            {profile.location} · {homeTime} for me right now
          </motion.div>
        </div>

        {/* Composer */}
        <motion.form {...rise(2)} onSubmit={send} className="flex min-h-[420px] flex-col p-6" noValidate>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-white/[0.09] bg-black/30 shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]">
            <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
              <span className="label !text-ink/60">New message</span>
              <span className="font-mono text-[10px] text-faint">{message.length} chars</span>
            </div>
            <div className="flex h-11 shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 text-[13px]">
              <span className="w-14 text-faint">To</span>
              <span className="selectable rounded-full bg-white/[0.07] px-2.5 py-1 text-[12.5px] text-ink">{profile.name}</span>
            </div>
            <label className="flex h-11 shrink-0 items-center gap-3 border-b border-white/[0.07] px-4 text-[13px] transition-colors focus-within:bg-white/[0.02]">
              <span className="w-14 text-faint">Subject</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-faint"
                placeholder="Internship opportunity"
              />
            </label>
            <textarea
              aria-label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-invalid={touched && empty}
              className="os-scroll min-h-[140px] flex-1 resize-none bg-transparent p-4 text-[14px] leading-relaxed text-ink outline-none placeholder:text-faint"
              placeholder="Write your message here"
            />
            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-white/[0.07] px-4 py-3">
              <span className={touched && empty ? 'text-[12px] text-danger' : 'text-[11.5px] leading-snug text-faint'}>
                {touched && empty ? 'Add a message first.' : 'Opens in your own mail app. Nothing is stored here.'}
              </span>
              <button type="submit" className="btn btn-accent shrink-0"><Send size={13} /> Compose email</button>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
