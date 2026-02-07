let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let isPlaying = false
let intervalId: number | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext)()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.06
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function getGain(): GainNode {
  getCtx()
  return masterGain!
}

function playNote(freq: number, start: number, duration: number, type: OscillatorType = 'square') {
  const c = getCtx()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0.12, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.01)
  osc.connect(gain)
  gain.connect(getGain())
  osc.start(start)
  osc.stop(start + duration)
}

// Chiptune melody pattern - 8-bar loop
const MELODY = [
  523, 587, 659, 587, 523, 440, 494, 523,
  587, 659, 784, 659, 587, 523, 494, 440,
  523, 659, 784, 880, 784, 659, 523, 587,
  494, 440, 392, 440, 494, 523, 587, 523,
]

const BASS = [
  262, 262, 330, 330, 220, 220, 247, 247,
  294, 294, 349, 349, 262, 262, 220, 220,
  262, 262, 392, 392, 349, 349, 330, 330,
  247, 247, 220, 220, 262, 262, 294, 294,
]

const NOTE_DURATION = 0.18
const BEAT_INTERVAL = 200

export function startBGM() {
  if (isPlaying) return
  isPlaying = true

  let noteIndex = 0

  const playBeat = () => {
    if (!isPlaying) return
    const c = getCtx()
    const now = c.currentTime

    const melodyNote = MELODY[noteIndex % MELODY.length]
    playNote(melodyNote, now, NOTE_DURATION, 'square')

    const bassNote = BASS[noteIndex % BASS.length]
    playNote(bassNote, now, NOTE_DURATION * 1.2, 'triangle')

    noteIndex++
  }

  playBeat()
  intervalId = window.setInterval(playBeat, BEAT_INTERVAL)
}

export function stopBGM() {
  isPlaying = false
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

export function setBGMVolume(volume: number) {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(0.15, volume))
  }
}

export function isBGMPlaying(): boolean {
  return isPlaying
}
