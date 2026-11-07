const RINGS = [
  { count: 8, petal: 'M0 -48 C 16 -72, 16 -100, 0 -124 C -16 -100, -16 -72, 0 -48 Z' },
  { count: 16, petal: 'M0 -132 C 12 -150, 12 -170, 0 -188 C -12 -170, -12 -150, 0 -132 Z' },
  { count: 32, petal: 'M0 -196 C 7 -208, 7 -222, 0 -234 C -7 -222, -7 -208, 0 -196 Z' },
]

export default function Rangoli({ className }) {
  return (
    <svg className={className} viewBox="-250 -250 500 500" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.25">
        <circle r="40" />
        <circle r="128" />
        <circle r="192" />
        <circle r="240" />
        {RINGS.map(({ count, petal }) =>
          Array.from({ length: count }, (_, i) => (
            <path key={`${count}-${i}`} d={petal} transform={`rotate(${(360 / count) * i})`} />
          )),
        )}
      </g>
      <g fill="currentColor">
        {Array.from({ length: 16 }, (_, i) => (
          <circle key={i} cy="-30" r="2.5" transform={`rotate(${22.5 * i})`} />
        ))}
      </g>
    </svg>
  )
}
