// Cracker sounds, synthesised with the Web Audio API so there are no files to load.
// Browsers only allow audio after a user gesture, and every sound here follows one.

let ctx = null
let master = null
let noise = null
let muted = false

const MASTER_LEVEL = 0.8

function audio() {
  if (!ctx) {
    const Context = window.AudioContext || window.webkitAudioContext
    if (!Context) return null
    ctx = new Context()

    master = ctx.createGain()
    master.gain.value = muted ? 0 : MASTER_LEVEL
    // Keeps stacked crackers from clipping.
    const limiter = ctx.createDynamicsCompressor()
    master.connect(limiter)
    limiter.connect(ctx.destination)

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const samples = noise.getChannelData(0)
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function setMuted(value) {
  muted = value
  if (master) master.gain.value = muted ? 0 : MASTER_LEVEL
}

// Filtered noise running for `duration` seconds; returns its gain so callers can shape it.
function noiseVoice({ type, frequency, q = 1, duration, start = 0 }) {
  const at = ctx.currentTime + start
  const source = ctx.createBufferSource()
  source.buffer = noise
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(frequency, at)
  filter.Q.value = q
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, at)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  source.start(at, Math.random() * 2)
  source.stop(at + duration)
  return { gain: gain.gain, filter: filter.frequency, at }
}

function toneVoice({ type, from, to, duration, level, start = 0 }) {
  const at = ctx.currentTime + start
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(from, at)
  osc.frequency.exponentialRampToValueAtTime(to, at + duration)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(level, at)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(gain)
  gain.connect(master)
  osc.start(at)
  osc.stop(at + duration)
}

// Random jumps in level are what make a hiss sound like crackling sparks.
function crackle(gain, at, duration, level) {
  for (let t = 0; t < duration - 0.1; t += 0.035) {
    gain.setValueAtTime(level * (0.25 + Math.random() * 0.75), at + t)
  }
  gain.linearRampToValueAtTime(0, at + duration)
}

export function playPop(level = 0.6) {
  if (!audio()) return
  const crack = noiseVoice({ type: 'lowpass', frequency: 2400, duration: 0.3 })
  crack.gain.setValueAtTime(level, crack.at)
  crack.gain.exponentialRampToValueAtTime(0.0001, crack.at + 0.28)
  toneVoice({ type: 'sine', from: 150, to: 45, duration: 0.22, level: level * 0.9 })
}

export function playWhistle() {
  if (!audio()) return
  const at = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.frequency.setValueAtTime(800, at)
  osc.frequency.exponentialRampToValueAtTime(2400, at + 0.7)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.07, at + 0.12)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.72)
  osc.connect(gain)
  gain.connect(master)
  osc.start(at)
  osc.stop(at + 0.75)
}

// A rising run of small bell notes.
export function playChime(level = 1) {
  if (!audio()) return
  ;[784, 988, 1175, 1568].forEach((note, i) => {
    toneVoice({ type: 'sine', from: note, to: note, duration: 0.9, level: 0.1 * level, start: i * 0.085 })
  })
}

export function playFuse(duration) {
  if (!audio()) return
  const hiss = noiseVoice({ type: 'bandpass', frequency: 5200, q: 1.2, duration })
  crackle(hiss.gain, hiss.at, duration, 0.14)
}

export function playBoom() {
  if (!audio()) return
  // Sharp crack, then a long rumble falling away underneath it.
  const crack = noiseVoice({ type: 'highpass', frequency: 900, duration: 0.25 })
  crack.gain.setValueAtTime(0.6, crack.at)
  crack.gain.exponentialRampToValueAtTime(0.0001, crack.at + 0.22)

  const rumble = noiseVoice({ type: 'lowpass', frequency: 420, q: 0.7, duration: 3.6 })
  rumble.filter.exponentialRampToValueAtTime(50, rumble.at + 3.2)
  rumble.gain.setValueAtTime(0.9, rumble.at)
  rumble.gain.exponentialRampToValueAtTime(0.0001, rumble.at + 3.5)

  toneVoice({ type: 'sine', from: 85, to: 24, duration: 1.8, level: 0.7 })
}

export function playFountain(duration) {
  if (!audio()) return
  const hiss = noiseVoice({ type: 'bandpass', frequency: 3200, q: 0.6, duration })
  hiss.gain.linearRampToValueAtTime(0.2, hiss.at + 0.4)
  hiss.gain.setValueAtTime(0.2, hiss.at + duration - 0.7)
  hiss.gain.linearRampToValueAtTime(0, hiss.at + duration)
}

export function playSparkler(duration) {
  if (!audio()) return
  const hiss = noiseVoice({ type: 'highpass', frequency: 6000, duration })
  crackle(hiss.gain, hiss.at, duration, 0.12)
}

export function playChakri(duration) {
  if (!audio()) return
  const at = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(150, at)
  osc.frequency.linearRampToValueAtTime(320, at + duration * 0.4)
  osc.frequency.linearRampToValueAtTime(110, at + duration)
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1100
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.linearRampToValueAtTime(0.09, at + 0.3)
  gain.gain.setValueAtTime(0.09, at + duration - 0.6)
  gain.gain.linearRampToValueAtTime(0.0001, at + duration)
  // The wobble gives the spinning whirr.
  const wobble = ctx.createOscillator()
  wobble.frequency.value = 16
  const depth = ctx.createGain()
  depth.gain.value = 40
  wobble.connect(depth)
  depth.connect(osc.frequency)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  osc.start(at)
  wobble.start(at)
  osc.stop(at + duration)
  wobble.stop(at + duration)

  const hiss = noiseVoice({ type: 'bandpass', frequency: 4200, q: 0.8, duration })
  crackle(hiss.gain, hiss.at, duration, 0.1)
}
