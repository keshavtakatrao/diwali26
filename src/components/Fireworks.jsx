import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  playBoom,
  playChakri,
  playFountain,
  playFuse,
  playPop,
  playSparkler,
  playWhistle,
} from '../sound.js'

const COLORS = ['#f7a823', '#ffd36b', '#e0457b', '#ff7a3d', '#3fd0c0', '#fff1cf']
const FOUNTAIN_COLORS = ['#ffd36b', '#fff1cf', '#ff9a3d', '#f7a823']
const SPARKLER_COLORS = ['#ffffff', '#fff1cf', '#ffd36b']
const CHAKRI_COLORS = ['#7dffb0', '#3fd0c0', '#ffd36b', '#ff7a3d']
const BLAST_COLORS = ['#ffffff', '#ffe29a', '#ff9a3d', '#ff5a2a', '#e0457b']

const AUTO_LAUNCH_MS = 2600
const ROCKET_FRAMES = 42
const SPARKS_PER_BURST = 70
const MAX_SPARKS = 3000
const MAX_ROCKETS = 25
const TAP_DEPTH = 0.5

const FOUNTAIN_SECONDS = 3.6
const SPARKLER_SECONDS = 6
const CHAKRI_SECONDS = 5
const FUSE_SECONDS = 0.8
const ATOM_COOLDOWN_MS = 3000 // also stops repeat presses turning the flash into a strobe
const MAX_FOUNTAINS = 4
const MAX_CHAKRIS = 3

// The opening stretch of the scroll belongs to the crackers; the page's other elements
// start loading where it ends (see --load in index.css, which uses the same 0.25).
const CRACKER_END = 0.25

// Each fires once as the scroll passes `at`. `x` and `y` are fractions of the screen.
// Depth sets size and parallax speed: 0 is far away and slow, 1 is near and fast.
const SCROLL_CRACKERS = [
  { at: 0.03, x: 0.22, y: 0.34, depth: 0.25 },
  { at: 0.07, x: 0.74, y: 0.22, depth: 0.9 },
  { at: 0.11, x: 0.48, y: 0.42, depth: 0.5 },
  { at: 0.15, x: 0.14, y: 0.18, depth: 0.9 },
  { at: 0.19, x: 0.86, y: 0.4, depth: 0.25 },
  { at: 0.23, x: 0.58, y: 0.16, depth: 0.7 },
]

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const between = (low, high) => low + Math.random() * (high - low)

const scrollProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight
  return max > 0 ? window.scrollY / max : 0
}

// Ground-level crackers sit just above the dock when it runs along the bottom of the screen.
const groundY = () => {
  const dock = document.querySelector('.cracker-dock')?.getBoundingClientRect()
  const isBottomDock = dock && dock.width > dock.height
  return (isBottomDock ? dock.top : window.innerHeight) - 14
}

// Full-page canvas. Parents use the ref: launch(x, y), finale() and fire(kind).
const Fireworks = forwardRef(function Fireworks(_props, ref) {
  const canvasRef = useRef(null)
  const engine = useRef(null)

  useImperativeHandle(ref, () => ({
    launch: (x, y) => engine.current?.launch(x, y, TAP_DEPTH, true),
    finale: () => {
      for (let i = 0; i < 7; i += 1) {
        engine.current?.later(() => {
          engine.current?.launch(
            window.innerWidth * between(0.1, 0.9),
            window.innerHeight * between(0.1, 0.5),
            Math.random(),
            true,
          )
        }, i * 260)
      }
    },
    fire: (kind) => engine.current?.fire(kind),
  }))

  useEffect(() => {
    // People who reduce motion still get what they press, minus the flash, shake and
    // anything that plays by itself.
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let rockets = []
    let sparks = []
    let emitters = []
    let rings = []
    let flash = 0
    let frame = null
    let last = 0
    let crackersFired = 0
    let lastAtom = -Infinity
    const timers = new Set()
    const pointer = { x: 0, y: 0, moved: false }

    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id)
        fn()
      }, ms)
      timers.add(id)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (props) => {
      if (sparks.length >= MAX_SPARKS) return
      sparks.push({
        life: 1,
        decay: 0.02,
        gravity: 0.035,
        drag: 0.985,
        size: 1.4,
        depth: 0,
        scrollAtLaunch: window.scrollY,
        ...props,
      })
    }

    const explode = ({ x, y, depth, scrollAtLaunch, sound }) => {
      if (sound) playPop(0.2 + depth * 0.35)
      const color = pick(COLORS)
      const accent = pick(COLORS)
      const reach = 0.6 + depth * 0.7
      for (let i = 0; i < SPARKS_PER_BURST; i += 1) {
        const angle = (i / SPARKS_PER_BURST) * Math.PI * 2
        const speed = between(1.2, 4.8) * reach
        spawn({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          decay: between(0.011, 0.023),
          color: i % 5 === 0 ? accent : color,
          size: 1 + depth * 1.2,
          depth,
          scrollAtLaunch,
        })
      }
    }

    const tick = (now) => {
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      // Everything drifts up as the page scrolls, nearer shells faster.
      const lift = (item) => (window.scrollY - item.scrollAtLaunch) * item.depth

      // Erase instead of painting black so the canvas stays transparent over the page.
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = `rgba(0, 0, 0, ${0.22 * dt})`
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.globalCompositeOperation = 'lighter'

      if (flash > 0.01) {
        ctx.fillStyle = `rgba(255, 236, 200, ${flash * 0.35})`
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
        flash *= 0.86 ** dt
      }

      emitters = emitters.filter((emitter) => {
        const progress = (now - emitter.start) / emitter.duration
        if (progress >= 1) {
          emitter.onEnd?.()
          return false
        }
        emitter.update(progress, dt, now)
        return true
      })

      rings = rings.filter((ring) => {
        ring.radius += 15 * dt
        const strength = 1 - ring.radius / ring.limit
        if (strength <= 0) return false
        ctx.strokeStyle = `rgba(255, 214, 150, ${strength * 0.5})`
        ctx.lineWidth = 15 * dt + 2 // at least the distance moved, so it leaves no stripes
        ctx.beginPath()
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2)
        ctx.stroke()
        return true
      })

      rockets = rockets.filter((rocket) => {
        rocket.x += rocket.vx * dt
        rocket.y += rocket.vy * dt
        rocket.frames -= dt
        ctx.fillStyle = '#ffd36b'
        ctx.fillRect(rocket.x - 1, rocket.y - lift(rocket) - 1, 2, 5)
        if (rocket.frames > 0) return true
        explode(rocket)
        return false
      })

      sparks = sparks.filter((spark) => {
        spark.vx *= spark.drag ** dt
        spark.vy = spark.vy * spark.drag ** dt + spark.gravity * dt
        spark.x += spark.vx * dt
        spark.y += spark.vy * dt
        spark.life -= spark.decay * dt
        if (spark.life <= 0) return false
        ctx.globalAlpha = spark.life
        ctx.fillStyle = spark.color
        ctx.beginPath()
        ctx.arc(spark.x, spark.y - lift(spark), spark.size, 0, Math.PI * 2)
        ctx.fill()
        return true
      })
      ctx.globalAlpha = 1

      if (rockets.length || sparks.length || emitters.length || rings.length || flash > 0.01) {
        frame = requestAnimationFrame(tick)
      } else {
        // Fading alone leaves faint ghost pixels, so finish with a real clear.
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        frame = null
      }
    }

    const wake = () => {
      if (frame === null) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      }
    }

    const addEmitter = (emitter) => {
      emitters.push({ start: performance.now(), ...emitter })
      wake()
    }

    const launch = (x, y, depth, sound = false) => {
      if (rockets.length >= MAX_ROCKETS) return
      const startX = x + (Math.random() - 0.5) * 120
      const startY = window.innerHeight
      if (sound) playWhistle()
      rockets.push({
        x: startX,
        y: startY,
        vx: (x - startX) / ROCKET_FRAMES,
        vy: (y - startY) / ROCKET_FRAMES,
        frames: ROCKET_FRAMES,
        depth,
        scrollAtLaunch: window.scrollY,
        sound,
      })
      wake()
    }

    const count = (kind) => emitters.filter((emitter) => emitter.kind === kind).length

    const crackers = {
      // A cone of sparks rising from a clay pot on the ground, swelling and dying away.
      flowerpot() {
        if (count('flowerpot') >= MAX_FOUNTAINS) return
        const x = window.innerWidth * between(0.15, 0.85)
        const y = groundY()
        const gravity = 0.06
        playFountain(FOUNTAIN_SECONDS)
        addEmitter({
          kind: 'flowerpot',
          duration: FOUNTAIN_SECONDS * 1000,
          update(progress, dt) {
            const swell = Math.sin(Math.PI * Math.min(progress * 1.15, 1)) ** 0.6
            const height = window.innerHeight * 0.5 * swell
            for (let i = Math.round(9 * dt * swell); i > 0; i -= 1) {
              const angle = -Math.PI / 2 + between(-0.26, 0.26)
              const speed = Math.sqrt(2 * gravity * height) * between(0.55, 1.05)
              spawn({
                x: x + between(-3, 3),
                y: y - 14,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity,
                drag: 0.997,
                decay: between(0.011, 0.02),
                color: pick(FOUNTAIN_COLORS),
                size: between(1, 1.9),
              })
            }
            // Painted normally, not added like light, so the clay keeps its colour.
            ctx.globalCompositeOperation = 'source-over'
            ctx.fillStyle = '#b5532a'
            ctx.beginPath()
            ctx.moveTo(x - 6, y - 16)
            ctx.lineTo(x + 6, y - 16)
            ctx.lineTo(x + 14, y)
            ctx.lineTo(x - 14, y)
            ctx.fill()
            ctx.globalCompositeOperation = 'lighter'
          },
        })
      },

      // A hand-held sparkler that follows the pointer, and waves about until it moves.
      sparkler() {
        if (count('sparkler')) return
        const startedAt = { x: pointer.x, y: pointer.y }
        const pos = { x: window.innerWidth / 2, y: window.innerHeight * 0.55 }
        playSparkler(SPARKLER_SECONDS)
        addEmitter({
          kind: 'sparkler',
          duration: SPARKLER_SECONDS * 1000,
          update(_progress, dt, now) {
            const following =
              pointer.moved &&
              Math.hypot(pointer.x - startedAt.x, pointer.y - startedAt.y) > 12
            const target = following
              ? pointer
              : {
                  x: window.innerWidth / 2 + Math.sin(now / 420) * 70,
                  y: window.innerHeight * 0.55 + Math.sin(now / 210) * 26,
                }
            if (following) {
              startedAt.x = -1e6 // once it has followed, it keeps following
            }
            pos.x += (target.x - pos.x) * Math.min(0.28 * dt, 1)
            pos.y += (target.y - pos.y) * Math.min(0.28 * dt, 1)

            ctx.strokeStyle = '#a08f78'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(pos.x, pos.y)
            ctx.lineTo(pos.x - 22, pos.y + 54)
            ctx.stroke()

            for (let i = Math.round(7 * dt); i > 0; i -= 1) {
              const angle = between(0, Math.PI * 2)
              const speed = between(0.8, 4.2)
              spawn({
                x: pos.x,
                y: pos.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.03,
                drag: 0.95,
                decay: between(0.035, 0.07),
                color: pick(SPARKLER_COLORS),
                size: between(0.7, 1.4),
              })
            }
          },
        })
      },

      // A wheel spinning on the ground, throwing sparks off its rim as it wanders.
      chakri() {
        if (count('chakri') >= MAX_CHAKRIS) return
        const home = window.innerWidth * between(0.2, 0.8)
        const y = groundY() - 6
        const wander = between(50, 110) * (Math.random() < 0.5 ? -1 : 1)
        let spin = 0
        playChakri(CHAKRI_SECONDS)
        addEmitter({
          kind: 'chakri',
          duration: CHAKRI_SECONDS * 1000,
          update(progress, dt) {
            spin += 0.5 * dt
            const x = home + Math.sin(progress * Math.PI * 2) * wander
            for (let arm = 0; arm < 2; arm += 1) {
              const angle = spin + arm * Math.PI
              for (let i = Math.round(3 * dt); i > 0; i -= 1) {
                const speed = between(2.5, 5)
                spawn({
                  x: x + Math.cos(angle) * 10,
                  y: y + Math.sin(angle) * 4,
                  vx: -Math.sin(angle) * speed,
                  vy: Math.cos(angle) * speed * 0.45 - 0.5,
                  gravity: 0.05,
                  decay: between(0.028, 0.05),
                  color: pick(CHAKRI_COLORS),
                  size: between(0.9, 1.6),
                })
              }
            }
            ctx.strokeStyle = '#ffd36b'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.ellipse(x, y, 10, 4, 0, 0, Math.PI * 2)
            ctx.stroke()
          },
        })
      },

      // Fuse, then flash, shockwave, shaking page, debris and a rising mushroom cloud.
      atom() {
        const now = performance.now()
        if (now - lastAtom < ATOM_COOLDOWN_MS) return
        lastAtom = now
        const x = window.innerWidth / 2
        const y = groundY()
        playFuse(FUSE_SECONDS)
        addEmitter({
          kind: 'fuse',
          duration: FUSE_SECONDS * 1000,
          update(_progress, dt) {
            for (let i = Math.round(2 * dt); i > 0; i -= 1) {
              spawn({
                x,
                y: y - 10,
                vx: between(-1.2, 1.2),
                vy: between(-2.2, -0.5),
                decay: 0.06,
                color: '#ff7a3d',
                size: 1.2,
              })
            }
            ctx.fillStyle = '#4d2415'
            ctx.beginPath()
            ctx.arc(x, y - 6, 9, 0, Math.PI * 2)
            ctx.fill()
          },
          onEnd() {
            playBoom()
            if (!calm) {
              flash = 1
              rings.push({ x, y, radius: 10, limit: Math.max(window.innerWidth, window.innerHeight) })
              // The lights and switch stay still, so only the page's content shakes.
              for (const el of document.querySelectorAll('.hero-copy, .diya-area, .hero-rangoli')) {
                el.animate(
                  [0, 1, 2, 3, 4, 5].map((step) => ({
                    transform: `translate(${step === 5 ? 0 : between(-9, 9) * (1 - step / 5)}px, ${
                      step === 5 ? 0 : between(-9, 9) * (1 - step / 5)
                    }px)`,
                  })),
                  { duration: 560, easing: 'ease-out' },
                )
              }
            }
            for (let i = 0; i < 260; i += 1) {
              const angle = between(-Math.PI, 0)
              const speed = between(2, 13)
              spawn({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                gravity: 0.08,
                decay: between(0.008, 0.02),
                color: pick(BLAST_COLORS),
                size: between(1, 2.6),
              })
            }
            const capY = window.innerHeight * 0.36
            const climb = Math.sqrt(2 * 0.05 * (y - capY))
            addEmitter({
              kind: 'stem',
              duration: 700,
              update(_p, dt2) {
                for (let i = Math.round(10 * dt2); i > 0; i -= 1) {
                  spawn({
                    x: x + between(-14, 14),
                    y,
                    vx: between(-0.5, 0.5),
                    vy: -climb * between(0.8, 1.05),
                    gravity: 0.05,
                    drag: 1,
                    decay: between(0.012, 0.022),
                    color: pick(BLAST_COLORS),
                    size: between(1.2, 2.4),
                  })
                }
              },
            })
            later(() => {
              for (let i = 0; i < 300; i += 1) {
                const angle = between(0, Math.PI * 2)
                const speed = between(1, 7.5)
                spawn({
                  x,
                  y: capY,
                  vx: Math.cos(angle) * speed * 1.35,
                  vy: Math.sin(angle) * speed * 0.7,
                  gravity: 0.02,
                  drag: 0.975,
                  decay: between(0.009, 0.018),
                  color: pick(BLAST_COLORS),
                  size: between(1.2, 2.8),
                })
              }
              wake()
            }, 650)
          },
        })
      },

      // A volley of whistling rockets across the sky.
      skyshots() {
        const shots = 5
        for (let i = 0; i < shots; i += 1) {
          later(() => {
            const lane = (i + between(0.2, 0.8)) / shots
            launch(
              window.innerWidth * (0.08 + lane * 0.84),
              window.innerHeight * between(0.1, 0.42),
              Math.random(),
              true,
            )
          }, i * 190)
        }
      },
    }

    engine.current = { launch, later, fire: (kind) => crackers[kind]?.() }

    // Scrolling back above a cracker re-arms it, so the opening replays.
    const onScroll = () => {
      const progress = scrollProgress()
      const reached = SCROLL_CRACKERS.filter(({ at }) => progress >= at).length
      for (const { x, y, depth } of SCROLL_CRACKERS.slice(crackersFired, reached)) {
        launch(window.innerWidth * x, window.innerHeight * y, depth)
      }
      crackersFired = reached
    }

    const onPointerMove = (event) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.moved = true
    }

    // Once the opening is over, the sky keeps going by itself.
    const auto = calm
      ? null
      : setInterval(() => {
          if (document.hidden || scrollProgress() < CRACKER_END) return
          launch(
            window.innerWidth * between(0.08, 0.92),
            window.innerHeight * between(0.08, 0.42),
            Math.random(),
          )
        }, AUTO_LAUNCH_MS)

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    if (!calm) window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      clearInterval(auto)
      timers.forEach(clearTimeout)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
      engine.current = null
    }
  }, [])

  return <canvas ref={canvasRef} className="fireworks" aria-hidden="true" />
})

export default Fireworks
