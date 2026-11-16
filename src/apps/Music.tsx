import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Disc3, RefreshCw } from 'lucide-react'
import { profile } from '../data/profile'

/* ------------------------------------------------------------------
   MUSIC: what Aarush is listening to right now.
   The card is the same live Spotify widget that sits on his GitHub
   profile. Nothing here plays audio; it only reports.
------------------------------------------------------------------- */

const REFRESH_MS = 30000

export default function Music() {
  const [tick, setTick] = useState(0)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), REFRESH_MS)
    return () => window.clearInterval(t)
  }, [])

  const src = `${profile.spotifyWidget}&t=${tick}`

  return (
    <div className="os-scroll relative grid h-full place-items-center overflow-hidden p-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(70% 60% at 50% 38%, color-mix(in oklab, var(--color-term) 16%, transparent), transparent 70%)' }}
      />
      {/* slow turning record behind everything */}
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute text-term opacity-[0.07]"
      >
        <Disc3 size={520} strokeWidth={0.4} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[520px] text-center"
      >
        <div className="flex items-center justify-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink/60">
          <span className="flex h-3 items-end gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="w-[2.5px] rounded-full bg-term"
                animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
                transition={{ duration: 1.1 + i * 0.17, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
              />
            ))}
          </span>
          Live from Spotify
        </div>
        <h1 className="display mt-4 text-[26px] font-semibold leading-tight text-ink">What I am listening to</h1>

        <div className="glass mt-6 overflow-hidden rounded-[18px] p-3">
          {failed ? (
            <div className="px-4 py-9 text-[13px] text-ink/65">The Spotify card could not be loaded just now.</div>
          ) : (
            <>
              {!loaded && <div className="skeleton h-[118px]" />}
              <img
                src={src}
                alt="The track Aarush is playing on Spotify"
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
                className={loaded ? 'mx-auto block w-full rounded-[12px]' : 'hidden'}
                draggable={false}
              />
            </>
          )}
        </div>

        <p className="mx-auto mt-4 max-w-[44ch] text-[12.5px] leading-relaxed text-ink/60">
          This is the same card as on my GitHub profile. It refreshes every 30 seconds, and shows the last track when nothing is playing.
        </p>
        <button
          className="btn mt-4"
          onClick={() => { setFailed(false); setTick((n) => n + 1) }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </motion.div>
    </div>
  )
}
