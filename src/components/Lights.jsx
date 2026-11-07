// One U of wire, in viewBox units. CSS scales the whole strand to the screen via --swag.
const SWAG_WIDTH = 160
const SWAG_COUNT = 16
const STRAND_HEIGHT = 48
const ANCHOR_Y = 4
const SAG = 28
const BULBS_PER_SWAG = 5
const BULB_COUNT = SWAG_COUNT * BULBS_PER_SWAG
const TWINKLE_STEPS = 3

const WIRE = Array.from({ length: SWAG_COUNT }, (_, i) => {
  const control = SWAG_WIDTH * i + SWAG_WIDTH / 2
  return `Q${control} ${ANCHOR_Y + SAG * 2} ${SWAG_WIDTH * (i + 1)} ${ANCHOR_Y}`
}).join(' ')

const ANCHORS = Array.from({ length: SWAG_COUNT + 1 }, (_, i) => SWAG_WIDTH * i)

const BULBS = Array.from({ length: BULB_COUNT }, (_, i) => {
  const t = ((i % BULBS_PER_SWAG) + 0.5) / BULBS_PER_SWAG
  const swag = Math.floor(i / BULBS_PER_SWAG)
  return {
    x: SWAG_WIDTH * (swag + t),
    y: ANCHOR_Y + 4 * SAG * t * (1 - t),
    step: i % TWINKLE_STEPS,
    // Bulbs relight outward from the middle, so the wave is centred on any screen width.
    fromCentre: Math.abs(i - (BULB_COUNT - 1) / 2),
  }
})

// App remounts this with a new key on every theme change, which replays the relight wave.
export default function Lights() {
  return (
    <svg
      className="lights"
      viewBox={`0 0 ${SWAG_WIDTH * SWAG_COUNT} ${STRAND_HEIGHT}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bulb-glow">
          <stop offset="0" stopColor="#ffe9b0" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#ffc35c" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffb040" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path className="lights-wire" d={`M0 ${ANCHOR_Y} ${WIRE}`} />
      {ANCHORS.map((x) => (
        <circle key={x} className="lights-anchor" cx={x} cy={ANCHOR_Y} r="2" />
      ))}
      {BULBS.map(({ x, y, step, fromCentre }) => (
        <g key={x} transform={`translate(${x} ${y + 3})`}>
          <g className="bulb-on" style={{ '--from-centre': fromCentre }}>
            <g className="bulb" style={{ '--twinkle-step': step }}>
              <circle r="11" fill="url(#bulb-glow)" />
              <circle className="bulb-core" r="2.6" />
            </g>
          </g>
        </g>
      ))}
    </svg>
  )
}
