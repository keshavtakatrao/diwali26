import { playChime } from '../sound.js'

const RIM = '#ffd36b'
const ORANGE = '#ff8a2a'
const PINK = '#e0457b'
const AMBER = '#ffc24d'
const LIT = '#ffe9b0' // the panels nearest the flame inside

// Upper and lower rows of paper panels, left to right.
const PANELS = [
  ['28,6 6,34 24,34', ORANGE],
  ['28,6 40,6 40,34 24,34', PINK],
  ['40,6 52,6 56,34 40,34', LIT],
  ['52,6 74,34 56,34', ORANGE],
  ['6,34 28,62 24,34', PINK],
  ['24,34 40,34 40,62 28,62', LIT],
  ['40,34 56,34 52,62 40,62', AMBER],
  ['56,34 74,34 52,62', PINK],
]

const TAILS = [
  [26, 44, PINK],
  [32, 54, AMBER],
  [38, 60, ORANGE],
  [44, 56, PINK],
  [50, 46, AMBER],
]

function swing({ currentTarget }) {
  playChime(0.5)
  const glow = [{ filter: 'brightness(1.6)' }, { filter: 'brightness(1)' }]
  currentTarget.querySelector('svg').animate(glow, { duration: 1200, easing: 'ease-out' })
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  currentTarget.animate(
    { rotate: ['0deg', '15deg', '-11deg', '7deg', '-4deg', '2deg', '0deg'] },
    { duration: 1800, easing: 'ease-out' },
  )
}

function Kandil({ className }) {
  return (
    <button type="button" className={`kandil ${className}`} aria-label="Swing the kandil" onClick={swing}>
      <svg viewBox="0 0 80 130" aria-hidden="true">
        {TAILS.map(([x, length, color]) => (
          <path key={x} d={`M${x} 66h5v${length}l-2.500 4-2.500-4Z`} fill={color} />
        ))}
        <g stroke={RIM} strokeWidth="0.9" strokeLinejoin="round">
          {PANELS.map(([points, color]) => (
            <polygon key={points} points={points} fill={color} />
          ))}
        </g>
        <rect x="29" y="1" width="22" height="5" rx="1.500" fill={RIM} />
        <rect x="27" y="62" width="26" height="5" rx="1.500" fill={RIM} />
      </svg>
    </button>
  )
}

// Which ones show depends on the screen width; see .kandil in index.css.
export default function Kandils() {
  return (
    <>
      <Kandil className="kandil-main" />
      <Kandil className="kandil-second" />
      <Kandil className="kandil-third" />
    </>
  )
}
