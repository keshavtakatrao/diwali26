const BAND_DOTS = [24, 32, 40, 48, 56]

export default function Diya({ lit, label, delay, onToggle }) {
  return (
    <button
      type="button"
      className={`diya${lit ? ' is-lit' : ''}`}
      aria-pressed={lit}
      aria-label={label}
      style={{ '--flicker-delay': `${delay}ms` }}
      onClick={onToggle}
    >
      <svg viewBox="0 0 80 90" aria-hidden="true">
        <g className="diya-flame">
          <path d="M40 8c11 15 14 27 0 42C26 35 29 23 40 8Z" fill="#f7a823" />
          <path d="M40 26c5 7 6 13 0 22-6-9-5-15 0-22Z" fill="#fff1cf" />
        </g>
        <path d="M40 48v10" stroke="#3a2a22" strokeWidth="3" strokeLinecap="round" />
        <path d="M6 58c2 19 20 26 34 26s32-7 34-26c-10 6-58 6-68 0Z" fill="#b5532a" />
        <ellipse cx="40" cy="58" rx="34" ry="6" fill="#4d2415" />
        {BAND_DOTS.map((cx) => (
          <circle key={cx} cx={cx} cy="74" r="1.8" fill="#f7a823" />
        ))}
      </svg>
    </button>
  )
}
