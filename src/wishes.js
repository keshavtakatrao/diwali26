export const NAME_LIMIT = 40
export const MESSAGE_LIMIT = 280
export const DEFAULT_WISH =
  'May the light of every diya find its way into your home, and stay long after the last one burns out. Happy Diwali.'
// Signs the wish whenever a link doesn't say who it's from.
export const DEFAULT_FROM = 'Keshav'

/*
 * Share links carry the wish encrypted: ?w=<iv + ciphertext>#k=<key>.
 *
 * Each link gets its own random AES-GCM key, kept after the "#". Browsers never send
 * that part to a server, so hosting logs and anyone seeing only the address see no
 * names or message. Anyone with the whole link can still read the wish; that's how
 * the recipient reads it. GCM also rejects a link whose payload has been altered.
 */
const KEY_BITS = 128
const IV_BYTES = 12

// Needs a secure context: https, or localhost while developing.
export const canEncrypt = () => Boolean(window.crypto?.subtle)

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

const fromBase64Url = (text) => {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
}

// Applies the length limits and the fallbacks to whatever a link supplied.
function shape({ to = '', from, message = '' }) {
  const wish = {
    to: to.slice(0, NAME_LIMIT),
    from: (from ?? DEFAULT_FROM).slice(0, NAME_LIMIT),
    message: message.slice(0, MESSAGE_LIMIT),
  }
  if (!wish.to && !wish.from && !wish.message) return null
  return { ...wish, message: wish.message || DEFAULT_WISH }
}

// Links made before encryption: ?to=&from=&msg= in plain text. Still honoured.
function readPlainWish(params) {
  return shape({
    to: params.get('to') ?? '',
    from: params.get('from') ?? undefined,
    message: params.get('msg') ?? '',
  })
}

async function decryptWish(payload, keyText) {
  const bytes = fromBase64Url(payload)
  const key = await crypto.subtle.importKey('raw', fromBase64Url(keyText), 'AES-GCM', false, [
    'decrypt',
  ])
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, IV_BYTES) },
    key,
    bytes.slice(IV_BYTES),
  )
  const { t, f, m } = JSON.parse(new TextDecoder().decode(plain))
  return shape({ to: t ?? '', from: f, message: m ?? '' })
}

// Whether the page address holds an encrypted wish, which has to be read asynchronously.
export const hasEncryptedWish = () => new URLSearchParams(window.location.search).has('w')

// The wish carried by the page address, or null on a plain visit.
export async function readSharedWish() {
  const params = new URLSearchParams(window.location.search)
  const payload = params.get('w')
  if (!payload) return readPlainWish(params)

  const keyText = new URLSearchParams(window.location.hash.slice(1)).get('k')
  try {
    if (!keyText || !canEncrypt()) throw new Error('missing key or Web Crypto')
    return await decryptWish(payload, keyText)
  } catch {
    // A cut-off, altered or keyless link can't be read: treat it as a plain visit.
    return readPlainWish(new URLSearchParams())
  }
}

// Plain-text wish for the first render, before any decryption has finished.
export const readPlainSharedWish = () =>
  hasEncryptedWish() ? null : readPlainWish(new URLSearchParams(window.location.search))

let hasWarnedAboutBase = false

// Where share links point: VITE_SHARE_BASE_URL when it's set to a valid http(s) address
// (see vite.config.js), otherwise the address of the page making the link.
function shareBase() {
  const configured = import.meta.env.VITE_SHARE_BASE_URL
  if (configured) {
    try {
      const url = new URL(configured)
      if (url.protocol === 'https:' || url.protocol === 'http:') return `${url.origin}${url.pathname}`
    } catch {
      // Falls through to the warning below.
    }
    if (!hasWarnedAboutBase) {
      hasWarnedAboutBase = true
      console.warn(`VITE_SHARE_BASE_URL "${configured}" isn't a valid web address; using this page's address.`)
    }
  }
  return `${window.location.origin}${window.location.pathname}`
}

// A link to this page carrying the wish, encrypted. Blank fields are left out, so a
// blank "from" signs it with the default name and a blank message uses the default wish.
export async function buildShareLink({ to, from, message }) {
  const wish = {}
  if (to.trim()) wish.t = to.trim()
  if (from.trim()) wish.f = from.trim()
  if (message.trim()) wish.m = message.trim()

  const keyBytes = crypto.getRandomValues(new Uint8Array(KEY_BITS / 8))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt'])
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(JSON.stringify(wish)),
    ),
  )
  const payload = new Uint8Array(IV_BYTES + cipher.length)
  payload.set(iv)
  payload.set(cipher, IV_BYTES)

  return `${shareBase()}?w=${toBase64Url(payload)}#k=${toBase64Url(keyBytes)}`
}

// The URL is encoded so the encrypted payload and its fragment key are both retained
// as the shortening service's destination.
export async function shortenShareLink(link) {
  const endpoint = new URL('https://tinyurl.com/api-create.php')
  endpoint.searchParams.set('url', link)

  const response = await fetch(endpoint)
  if (!response.ok) throw new Error(`URL shortener returned ${response.status}`)

  const shortened = (await response.text()).trim()
  const url = new URL(shortened)
  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    (url.hostname !== 'tinyurl.com' && url.hostname !== 'www.tinyurl.com')
  ) {
    throw new Error('URL shortener returned an invalid URL')
  }
  return url.href
}
