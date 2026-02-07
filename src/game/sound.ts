const audioCtx = () => {
  const ctx = new (window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext)()
  return ctx
}

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = audioCtx()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, c.currentTime)
  gain.gain.setValueAtTime(volume, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start()
  osc.stop(c.currentTime + duration)
}

export function playFlap() {
  playTone(400, 0.08, 'square', 0.12)
  setTimeout(() => playTone(500, 0.06, 'square', 0.1), 30)
}

export function playScore() {
  playTone(600, 0.1, 'square', 0.12)
  setTimeout(() => playTone(800, 0.1, 'square', 0.12), 80)
  setTimeout(() => playTone(1000, 0.15, 'square', 0.1), 160)
}

export function playHit() {
  playTone(200, 0.2, 'sawtooth', 0.15)
  setTimeout(() => playTone(100, 0.3, 'sawtooth', 0.12), 100)
}

export function playDie() {
  playTone(400, 0.1, 'square', 0.1)
  setTimeout(() => playTone(300, 0.15, 'square', 0.1), 100)
  setTimeout(() => playTone(200, 0.2, 'square', 0.1), 200)
  setTimeout(() => playTone(100, 0.4, 'sawtooth', 0.12), 300)
}

export function playPowerUp() {
  playTone(500, 0.08, 'sine', 0.15)
  setTimeout(() => playTone(700, 0.08, 'sine', 0.15), 60)
  setTimeout(() => playTone(900, 0.08, 'sine', 0.15), 120)
  setTimeout(() => playTone(1200, 0.15, 'sine', 0.12), 180)
}

export function playLevelUp() {
  playTone(400, 0.1, 'square', 0.1)
  setTimeout(() => playTone(500, 0.1, 'square', 0.1), 100)
  setTimeout(() => playTone(600, 0.1, 'square', 0.1), 200)
  setTimeout(() => playTone(800, 0.2, 'square', 0.12), 300)
}

export function playShieldHit() {
  playTone(300, 0.15, 'sine', 0.12)
  setTimeout(() => playTone(500, 0.1, 'sine', 0.1), 80)
}
