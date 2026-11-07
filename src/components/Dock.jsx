import { useState } from 'react'
import { setMuted } from '../sound.js'

const SPARKS = 'M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5 19 19M19 5l-3.5 3.5M8.5 15.5 5 19'

const CRACKERS = [
  {
    id: 'flowerpot',
    label: 'Flower Pot',
    icon: (
      <>
        <path d="M9 14h6l3 8H6l3-8Z" fill="currentColor" stroke="none" />
        <path d="M12 11V3M9 11 6.5 5M15 11l2.5-6" />
      </>
    ),
  },
  {
    id: 'sparkler',
    label: 'Sparkles',
    icon: (
      <>
        <path d="m5 21 8-10" />
        <path d="M16 2v3M16 11v3M10.5 8h3M18.5 8h3M12.2 4.2l1.8 1.8M18 10l1.8 1.8M12.2 11.8 14 10M18 6l1.8-1.8" />
      </>
    ),
  },
  {
    id: 'chakri',
    label: 'Zameen Chakri',
    icon: (
      <>
        <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
        <path d="M12 6.5a5.5 5.5 0 0 1 5.5 5.5M12 17.5A5.5 5.5 0 0 1 6.5 12M12 2.5A9.5 9.5 0 0 1 21.5 12M12 21.5A9.5 9.5 0 0 1 2.5 12" />
      </>
    ),
  },
  {
    id: 'atom',
    label: 'Atom Bomb',
    icon: (
      <>
        <circle cx="10.5" cy="14" r="7.5" fill="currentColor" stroke="none" />
        <path d="M15.5 8.5 18 6c1-1 2.5-.5 3 1M21 3v1M18 2.5l.5 1M21.5 9l-1-.5" />
      </>
    ),
  },
  {
    id: 'skyshots',
    label: 'Sky Shots',
    icon: (
      <>
        <path d="M12 2c2.5 2 3.5 4.5 3.5 8v5h-7v-5c0-3.5 1-6 3.5-8Z" fill="currentColor" stroke="none" />
        <path d="M12 18v4M8 18l-1.5 3M16 18l1.5 3" />
      </>
    ),
  },
]

export default function Dock({ onFire }) {
  const [isOpen, setIsOpen] = useState(false)
  // Only move keyboard focus after someone has used the dock, not when it first appears.
  const [hasOpened, setHasOpened] = useState(false)
  const [muted, setMutedState] = useState(false)

  const open = () => {
    setIsOpen(true)
    setHasOpened(true)
  }

  const toggleMute = () => {
    setMuted(!muted)
    setMutedState(!muted)
  }

  return (
    <div className="cracker-dock">
      {isOpen ? (
        <div className="cracker-panel" role="group" aria-label="Burst crackers">
          {CRACKERS.map(({ id, label, icon }, index) => (
            <button
              key={id}
              type="button"
              className="cracker"
              data-kind={id}
              autoFocus={index === 0}
              onClick={() => onFire(id)}
            >
              <svg className="cracker-icon" viewBox="0 0 24 24" aria-hidden="true">
                {icon}
              </svg>
              <span>{label}</span>
            </button>
          ))}
          <div className="cracker-side">
            <button
              type="button"
              className="cracker-small cracker-mute"
              aria-label="Mute sounds"
              aria-pressed={muted}
              onClick={toggleMute}
            >
              <svg className="cracker-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4Z" fill="currentColor" stroke="none" />
                {muted ? (
                  <path d="m16 9.5 5 5M21 9.5l-5 5" />
                ) : (
                  <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />
                )}
              </svg>
            </button>
            <button
              type="button"
              className="cracker-small cracker-close"
              aria-label="Close cracker options"
              onClick={() => setIsOpen(false)}
            >
              <svg className="cracker-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="dock-buttons">
          <button type="button" className="cracker-toggle" autoFocus={hasOpened} onClick={open}>
            <svg className="cracker-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d={SPARKS} />
            </svg>
            Burst Crackers
          </button>
          {/* Hidden for now: the share page is reached only by its link, /#share.
          <a className="cracker-toggle" href="#share">
            <svg className="cracker-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17 8a3 3 0 1 0-2.8-4M17 8 7 12m10 4L7 12m10 4a3 3 0 1 1-2.8 4M7 12a3 3 0 1 1 0-.01" />
            </svg>
            Share a Wish
          </a>
          */}
        </div>
      )}
    </div>
  )
}
