import { useEffect, useRef, useState } from 'react'
import song from './assets/happy-diwali.mp3'
import MusicToggle from './components/MusicToggle.jsx'
import Dock from './components/Dock.jsx'
import Diya from './components/Diya.jsx'
import Fireworks from './components/Fireworks.jsx'
import Kandils from './components/Kandils.jsx'
import LightSwitch from './components/LightSwitch.jsx'
import Lights from './components/Lights.jsx'
import Rangoli from './components/Rangoli.jsx'
import { hasEncryptedWish, readPlainSharedWish, readSharedWish } from './wishes.js'

const DIYA_COUNT = 7
const THEMES = ['night', 'bronze', 'crimson'] // colours live in index.css

export default function App() {
  const fireworks = useRef(null)
  // Encrypted wishes are decrypted after the first render. The page starts dark, so
  // it's ready long before anyone sees it.
  const [shared, setShared] = useState(readPlainSharedWish)
  useEffect(() => {
    if (!hasEncryptedWish()) return undefined
    let isCurrent = true
    readSharedWish().then((wish) => {
      if (isCurrent) setShared(wish)
    })
    return () => {
      isCurrent = false
    }
  }, [])
  // Long enough that phones need the hint line's space for it (see .is-long-wish).
  const isLongWish = shared && shared.message.length + (shared.to ? 40 : 0) > 140
  // The middle diya starts lit, which hints that the row can be tapped.
  const [lit, setLit] = useState(() =>
    Array.from({ length: DIYA_COUNT }, (_, i) => i === Math.floor(DIYA_COUNT / 2)),
  )
  const litCount = lit.filter(Boolean).length
  // The page starts dark; the first press turns it on, later presses cycle the themes.
  const [presses, setPresses] = useState(0)
  const [showGuide, setShowGuide] = useState(false)
  const isOn = presses > 0
  const theme = isOn ? THEMES[(presses - 1) % THEMES.length] : 'off'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // The song tries to start on load. Most browsers block sound until the visitor does
  // something, so if it's blocked it starts on the first press of the lights switch.
  const music = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const hasTriedMusic = useRef(false)

  useEffect(() => {
    const audio = music.current
    audio.volume = 0.7
    audio.play().catch(() => {}) // blocked: wait for the switch
  }, [])

  const startMusicOnce = () => {
    if (hasTriedMusic.current) return
    hasTriedMusic.current = true
    if (music.current.paused) music.current.play().catch(() => {})
  }

  const toggleMusic = () => {
    hasTriedMusic.current = true
    if (music.current.paused) music.current.play().catch(() => {})
    else music.current.pause()
  }

  // Publishes scroll position to CSS; the per-layer speeds live in index.css.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = null
    const update = () => {
      frame = null
      const root = document.documentElement
      const max = root.scrollHeight - window.innerHeight
      const offset = Math.min(Math.max(window.scrollY, 0), max)
      root.style.setProperty('--scroll', offset)
      const progress = max > 0 ? offset / max : 0
      root.style.setProperty('--progress', progress)
      // Unseen diyas shouldn't take taps or keyboard focus before they've loaded in.
      root.classList.toggle('diyas-away', progress < 0.775)
      root.classList.toggle('kandils-away', progress < 0.325)
    }
    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])

  const toggleDiya = (index) => {
    const next = lit.map((value, i) => (i === index ? !value : value))
    setLit(next)
    if (next.every(Boolean)) fireworks.current?.finale()
  }

  const launchAtPointer = (event) => {
    if (event.target.closest('button, a')) return
    fireworks.current?.launch(event.clientX, event.clientY)
  }

  return (
    <>
      {isOn && <Fireworks ref={fireworks} />}
      <main className="scroll-track">
        <button
          className="share-info-button homepage-info-button"
          type="button"
          aria-label="Show interactive elements"
          aria-haspopup="dialog"
          aria-expanded={showGuide}
          onClick={() => setShowGuide(true)}
        >
          i
        </button>
        <section
          className={isLongWish ? 'hero is-long-wish' : 'hero'}
          style={{ '--lit': litCount / DIYA_COUNT }}
          onPointerDown={launchAtPointer}
        >
          <Rangoli className="hero-rangoli" />
          <Kandils />
          <Lights key={presses} />
          <LightSwitch
            isOn={isOn}
            swingKey={presses}
            onPress={() => {
              startMusicOnce()
              setPresses(presses + 1)
            }}
          />
          {isOn && <MusicToggle isPlaying={isPlaying} onToggle={toggleMusic} />}
          <div className="hero-copy">
            <h1>
              <span className="hero-hindi" lang="hi">
                <span className="hindi-left">शुभ</span> <span className="hindi-right">दीपावली</span>
              </span>
              <span className="hero-english">Happy Diwali</span>
            </h1>

            {shared ? (
              <div className="shared-wish">
                {shared.to && <p className="shared-to">{shared.to},</p>}
                <p className="shared-message">{shared.message}</p>
                {shared.from && <p className="shared-from">{shared.from}</p>}
              </div>
            ) : (
              <p className="hero-lede">May your home be full of light, sweets and good company.</p>
            )}
          </div>

          <div className="diya-area">
            <div className="diya-row">
              {lit.map((isLit, i) => (
                <Diya
                  key={i}
                  lit={isLit}
                  delay={i * -370}
                  label={`Diya ${i + 1} of ${DIYA_COUNT}`}
                  onToggle={() => toggleDiya(i)}
                />
              ))}
            </div>
            <p className="diya-hint" role="status">
              {litCount === DIYA_COUNT
                ? 'All seven are lit. May your year glow like this.'
                : `${litCount} of ${DIYA_COUNT} lit. Tap the diyas to light them all, or the sky for fireworks.`}
            </p>
          </div>
          <span className="scroll-cue" aria-hidden="true">
            Scroll
          </span>
        </section>
      </main>
      {showGuide && (
        <div className="share-guide" role="presentation" onClick={() => setShowGuide(false)}>
          <section
            className="share-guide-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="homepage-guide-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="share-guide-heading">
              <h2 id="homepage-guide-title">Interactive elements</h2>
              <button
                className="share-guide-close"
                type="button"
                aria-label="Close interactive elements guide"
                onClick={() => setShowGuide(false)}
              >
                ×
              </button>
            </div>
            <ul className="share-guide-list">
              <li><strong>Light switch</strong><span>Turn on the celebration and cycle the page themes.</span></li>
              <li><strong>Diyas</strong><span>Tap each diya to light it. Light all seven to trigger fireworks.</span></li>
              <li><strong>Akash Kandil</strong><span>Tap a hanging kandil to make it swing.</span></li>
              <li><strong>Sky</strong><span>Tap anywhere in the sky to launch a firework.</span></li>
              <li><strong>Music</strong><span>Use the music control after turning on the lights.</span></li>
              <li><strong>Scroll</strong><span>Scroll down to discover the full celebration.</span></li>
            </ul>
          </section>
        </div>
      )}
      {isOn && <Dock onFire={(kind) => fireworks.current?.fire(kind)} />}
      <audio
        ref={music}
        src={song}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </>
  )
}
