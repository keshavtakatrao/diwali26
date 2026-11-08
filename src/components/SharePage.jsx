import { useEffect, useRef, useState } from 'react'
import copy from 'copy-to-clipboard'
import {
  DEFAULT_FROM,
  DEFAULT_WISH,
  MESSAGE_LIMIT,
  NAME_LIMIT,
  buildShareLink,
  canEncrypt,
  shortenShareLink,
} from '../wishes.js'
import Lights from './Lights.jsx'

const STARTERS = [
  { label: 'Warm', text: DEFAULT_WISH },
  {
    label: 'Family',
    text: 'Here’s to full plates, loud laughter and everyone under one roof. Wishing you and your family a joyful Diwali.',
  },
  {
    label: 'Far away',
    text: 'Miles between us, but I’m lighting one diya for you tonight. Happy Diwali, and see you soon.',
  },
  {
    label: 'Blessing',
    text: 'May Lakshmi walk through your door with good health, steady fortune and peace of mind. Shubh Deepavali.',
  },
  {
    label: 'Work',
    text: 'Wishing you and your loved ones a bright Diwali and a prosperous year ahead. Thank you for everything this year.',
  },
  {
    label: 'Funny',
    text: 'May your sweets be plentiful, your calories imaginary and your relatives’ questions brief. Happy Diwali!',
  },
]

export default function SharePage() {
  const [to, setTo] = useState('')
  const [from, setFrom] = useState('')
  const [message, setMessage] = useState(DEFAULT_WISH)
  const [status, setStatus] = useState('')
  const [shortLink, setShortLink] = useState('')
  const [isShortening, setIsShortening] = useState(false)
  const [showInteractionGuide, setShowInteractionGuide] = useState(false)
  const resetStatus = useRef(null)
  const latestLink = useRef('')

  useEffect(() => {
    document.documentElement.dataset.theme = 'night'
    return () => clearTimeout(resetStatus.current)
  }, [])

  // Encrypting is asynchronous, so the link follows the form a moment behind.
  const [link, setLink] = useState('')
  const isSecure = canEncrypt()
  useEffect(() => {
    if (!isSecure) return undefined
    let isCurrent = true
    buildShareLink({ to, from, message }).then((next) => {
      if (isCurrent) setLink(next)
    })
    return () => {
      isCurrent = false
    }
  }, [to, from, message, isSecure])

  useEffect(() => {
    latestLink.current = link
    setShortLink('')
  }, [link])

  // What the recipient will see: an empty "from" falls back to the default signature.
  const signedBy = from.trim() || DEFAULT_FROM
  const shownMessage = message.trim() || DEFAULT_WISH
  // No names here: this text travels unencrypted alongside the link.
  const shareText = 'A Diwali wish for you:'
  const canShareNatively = typeof navigator.share === 'function'

  const flash = (text) => {
    setStatus(text)
    clearTimeout(resetStatus.current)
    resetStatus.current = setTimeout(() => setStatus(''), 3500)
  }

  const copyLink = async () => {
    const url = await getShortLink()
    if (!url) return
    try {
      const copied = copy(url)
      if (!copied) throw new Error('Clipboard copy was rejected')
      flash('Short link copied. Paste it anywhere to share.')
    } catch {
      flash('Couldn’t copy automatically. Select the link above and copy it.')
    }
  }

  const shareNatively = async () => {
    const url = await getShortLink()
    if (!url) return
    try {
      await navigator.share({ title: 'Happy Diwali', text: shareText, url })
    } catch {
      // Closing the share sheet counts as an error; nothing to do.
    }
  }

  const getShortLink = async () => {
    if (!link) return null
    if (shortLink) return shortLink

    const linkToShorten = link
    setIsShortening(true)
    try {
      const shortened = await shortenShareLink(linkToShorten)
      if (latestLink.current !== linkToShorten) return null
      setShortLink(shortened)
      return shortened
    } catch {
      flash('Couldn’t shorten the link. Please try again.')
      return null
    } finally {
      setIsShortening(false)
    }
  }

  const shareOnWhatsApp = async () => {
    if (!link) return

    const shareWindow = window.open('', '_blank')
    if (!shareWindow) {
      flash('Your browser blocked the WhatsApp window. Please allow pop-ups and try again.')
      return
    }

    const url = await getShortLink()
    if (!url) {
      shareWindow.close()
      return
    }

    shareWindow.opener = null
    shareWindow.location.replace(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
    )
  }

  return (
    <div className="share-page">
      <Lights />
      <a className="share-back" href="#">
        <svg className="cracker-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5 8 12l7 7" />
        </svg>
        Back to the celebration
      </a>

      <header className="share-header">
        <div className="share-header-row">
          <div>
            <p className="share-hindi" lang="hi">
              शुभ दीपावली
            </p>
            <h1 className="share-title">Share a Diwali wish</h1>
          </div>
          <button
            type="button"
            className="share-info-button"
            aria-label="Show interactive elements"
            aria-expanded={showInteractionGuide}
            onClick={() => setShowInteractionGuide(true)}
          >
            i
          </button>
        </div>
        <p className="share-lede">
          Write a wish and send the link. It opens the celebration with your words on it.
        </p>
      </header>

      {showInteractionGuide && (
        <div className="share-guide" role="presentation" onClick={() => setShowInteractionGuide(false)}>
          <section
            className="share-guide-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interaction-guide-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="share-guide-heading">
              <h2 id="interaction-guide-title">What you can do</h2>
              <button
                type="button"
                className="share-guide-close"
                aria-label="Close interactive elements"
                onClick={() => setShowInteractionGuide(false)}
              >
                ×
              </button>
            </div>
            <ul className="share-guide-list">
              <li><strong>Personalize</strong><span>Enter names and write a custom wish.</span></li>
              <li><strong>Quick start</strong><span>Choose a starter chip to fill in a message.</span></li>
              <li><strong>Share</strong><span>Copy the short link, send it on WhatsApp, or use more sharing options.</span></li>
              <li><strong>Preview</strong><span>Open the recipient&apos;s celebration before sharing.</span></li>
              <li><strong>Lights</strong><span>Use the celebration controls to turn lights and effects on or off.</span></li>
            </ul>
          </section>
        </div>
      )}

      <div className="share-grid">
        <form className="share-form" onSubmit={(event) => event.preventDefault()}>
          <div className="share-names">
            <label className="share-field">
              <span>Their name</span>
              <input
                value={to}
                maxLength={NAME_LIMIT}
                placeholder="Asha"
                autoComplete="off"
                onChange={(event) => setTo(event.target.value)}
              />
            </label>
            <label className="share-field">
              <span>Your name</span>
              <input
                value={from}
                maxLength={NAME_LIMIT}
                placeholder={DEFAULT_FROM}
                autoComplete="name"
                onChange={(event) => setFrom(event.target.value)}
              />
            </label>
          </div>

          <fieldset className="share-starters">
            <legend>Start from</legend>
            {STARTERS.map(({ label, text }) => (
              <button
                key={label}
                type="button"
                className="share-chip"
                aria-pressed={message === text}
                onClick={() => setMessage(text)}
              >
                {label}
              </button>
            ))}
          </fieldset>

          <label className="share-field">
            <span>Your wish</span>
            <textarea
              rows={4}
              value={message}
              maxLength={MESSAGE_LIMIT}
              onChange={(event) => setMessage(event.target.value)}
            />
            <small className="share-count">
              {message.length} / {MESSAGE_LIMIT}
            </small>
          </label>
        </form>

        <div className="share-output">
          <article className="share-preview" aria-label="Preview of the wish">
            <p className="share-preview-hindi" lang="hi">
              शुभ दीपावली
            </p>
            {to.trim() && <p className="shared-to">{to.trim()},</p>}
            <p className="share-preview-message">{shownMessage}</p>
            <p className="shared-from">{signedBy}</p>
          </article>

          {!isSecure && (
            <p className="share-warning" role="alert">
              Secure links need the site on https. Open it over https (or on localhost) to
              create one.
            </p>
          )}

          <label className="share-field">
            <span>Your link</span>
            <input
              readOnly
              value={shortLink || link}
              placeholder={isSecure ? 'Preparing your link…' : ''}
              onFocus={(event) => event.target.select()}
            />
            <small className="share-note">
              Names and message are encrypted. Sharing creates a short link with TinyURL.
            </small>
          </label>

          <div className="share-actions" aria-disabled={!link}>
            <button
              type="button"
              className="share-button share-button-primary"
              disabled={isShortening}
              onClick={copyLink}
            >
              {isShortening ? 'Shortening link…' : 'Copy link'}
            </button>
            <button
              type="button"
              className="share-button"
              disabled={isShortening}
              onClick={shareOnWhatsApp}
            >
              Send on WhatsApp
            </button>
            {canShareNatively && (
              <button
                type="button"
                className="share-button"
                disabled={isShortening}
                onClick={shareNatively}
              >
                More ways to share
              </button>
            )}
            <a className="share-button" href={link} target="_blank" rel="noreferrer">
              Preview
            </a>
          </div>
          <p className="share-status" role="status">
            {status}
          </p>
        </div>
      </div>
    </div>
  )
}
