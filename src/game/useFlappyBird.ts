import { useRef, useCallback, useEffect } from 'react'
import type { GameState, Bird, Pipe, Particle } from './types.ts'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT,
  PIPE_WIDTH, PIPE_GAP, PIPE_SPEED, GRAVITY, FLAP_FORCE,
  BIRD_SIZE, PIPE_SPAWN_INTERVAL,
} from './types.ts'
import { playFlap, playScore, playHit, playDie } from './sound.ts'

const BEST_SCORE_KEY = 'flappy-best-score'

function loadBestScore(): number {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0
  } catch {
    return 0
  }
}

function saveBestScore(score: number) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score))
  } catch { /* ignore */ }
}

function createInitialBird(): Bird {
  return {
    x: CANVAS_WIDTH * 0.28,
    y: CANVAS_HEIGHT * 0.4,
    velocity: 0,
    rotation: 0,
    width: BIRD_SIZE,
    height: BIRD_SIZE,
  }
}

function createInitialState(): GameState {
  return {
    bird: createInitialBird(),
    pipes: [],
    particles: [],
    score: 0,
    bestScore: loadBestScore(),
    phase: 'idle',
    groundOffset: 0,
  }
}

function spawnPipe(): Pipe {
  const playArea = CANVAS_HEIGHT - GROUND_HEIGHT
  const minTop = 80
  const maxTop = playArea - PIPE_GAP - 80
  const gapY = minTop + Math.random() * (maxTop - minTop)

  return {
    x: CANVAS_WIDTH + 20,
    topHeight: gapY,
    gapY,
    width: PIPE_WIDTH,
    scored: false,
  }
}

function createHitParticles(x: number, y: number): Particle[] {
  const colors = ['#FFE082', '#FFC107', '#FF9800', '#FF5722', '#fff']
  return Array.from({ length: 8 }, () => ({
    x,
    y,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6 - 2,
    life: 1,
    maxLife: 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 3 + Math.random() * 4,
  }))
}

function checkCollision(bird: Bird, pipes: readonly Pipe[]): boolean {
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT
  const birdR = bird.width / 2 - 3

  // Ground / ceiling
  if (bird.y + birdR > groundY || bird.y - birdR < 0) return true

  for (const pipe of pipes) {
    const pipeLeft = pipe.x
    const pipeRight = pipe.x + PIPE_WIDTH
    const birdLeft = bird.x - birdR
    const birdRight = bird.x + birdR

    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      const birdTop = bird.y - birdR
      const birdBottom = bird.y + birdR
      const gapTop = pipe.gapY
      const gapBottom = pipe.gapY + PIPE_GAP

      if (birdTop < gapTop || birdBottom > gapBottom) return true
    }
  }

  return false
}

function updateBird(bird: Bird, flapping: boolean): Bird {
  const newVelocity = flapping ? FLAP_FORCE : bird.velocity + GRAVITY
  const newY = bird.y + newVelocity
  const targetRotation = newVelocity < 0 ? -30 : Math.min(newVelocity * 6, 70)
  const newRotation = bird.rotation + (targetRotation - bird.rotation) * 0.15

  return {
    ...bird,
    y: newY,
    velocity: newVelocity,
    rotation: newRotation,
  }
}

function updatePipes(pipes: readonly Pipe[], birdX: number): { pipes: Pipe[]; scored: number } {
  let scored = 0
  const updated: Pipe[] = []

  for (const pipe of pipes) {
    const newX = pipe.x - PIPE_SPEED
    if (newX + PIPE_WIDTH < -10) continue

    let newScored = pipe.scored
    if (!pipe.scored && newX + PIPE_WIDTH < birdX) {
      newScored = true
      scored++
    }

    updated.push({ ...pipe, x: newX, scored: newScored })
  }

  return { pipes: updated, scored }
}

function updateParticles(particles: readonly Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15,
      life: p.life - 0.03,
    }))
    .filter(p => p.life > 0)
}

export interface FlappyBirdAPI {
  readonly state: React.RefObject<GameState>
  readonly frame: React.RefObject<number>
  readonly start: () => void
  readonly flap: () => void
  readonly restart: () => void
}

export function useFlappyBird(): FlappyBirdAPI {
  const stateRef = useRef<GameState>(createInitialState())
  const frameRef = useRef(0)
  const animFrameRef = useRef(0)
  const lastPipeTimeRef = useRef(0)
  const flapQueueRef = useRef(false)
  const onUpdateRef = useRef<(() => void) | null>(null)

  const tick = useCallback(() => {
    const state = stateRef.current
    frameRef.current++

    if (state.phase === 'idle') {
      // Idle bobbing
      const bobY = CANVAS_HEIGHT * 0.4 + Math.sin(frameRef.current * 0.05) * 10
      stateRef.current = {
        ...state,
        bird: { ...state.bird, y: bobY },
        groundOffset: state.groundOffset + 1,
      }
    } else if (state.phase === 'playing') {
      const shouldFlap = flapQueueRef.current
      flapQueueRef.current = false

      const newBird = updateBird(state.bird, shouldFlap)
      const { pipes: newPipes, scored } = updatePipes(state.pipes, newBird.x)

      // Spawn pipes
      const now = performance.now()
      if (now - lastPipeTimeRef.current > PIPE_SPAWN_INTERVAL) {
        newPipes.push(spawnPipe())
        lastPipeTimeRef.current = now
      }

      if (scored > 0) playScore()

      const newScore = state.score + scored
      const newBest = Math.max(newScore, state.bestScore)
      const newParticles = updateParticles(state.particles)

      if (checkCollision(newBird, newPipes)) {
        playHit()
        const hitParticles = [...newParticles, ...createHitParticles(newBird.x, newBird.y)]
        saveBestScore(newBest)
        stateRef.current = {
          ...state,
          bird: newBird,
          pipes: newPipes,
          particles: hitParticles,
          score: newScore,
          bestScore: newBest,
          phase: 'dying',
          groundOffset: state.groundOffset + 1,
        }
        setTimeout(() => {
          playDie()
          stateRef.current = { ...stateRef.current, phase: 'dead' }
        }, 500)
      } else {
        stateRef.current = {
          ...state,
          bird: newBird,
          pipes: newPipes,
          particles: newParticles,
          score: newScore,
          bestScore: newBest,
          groundOffset: state.groundOffset + 1,
        }
      }
    } else if (state.phase === 'dying') {
      const newBird = {
        ...state.bird,
        velocity: state.bird.velocity + GRAVITY,
        y: Math.min(state.bird.y + state.bird.velocity, CANVAS_HEIGHT - GROUND_HEIGHT - state.bird.height / 2),
        rotation: Math.min(state.bird.rotation + 5, 90),
      }
      stateRef.current = {
        ...state,
        bird: newBird,
        particles: updateParticles(state.particles),
      }
    }

    onUpdateRef.current?.()
    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(() => {
    if (stateRef.current.phase !== 'idle') return
    stateRef.current = {
      ...stateRef.current,
      phase: 'playing',
      bird: { ...stateRef.current.bird, velocity: FLAP_FORCE },
    }
    lastPipeTimeRef.current = performance.now() + 800
    playFlap()
  }, [])

  const flap = useCallback(() => {
    const phase = stateRef.current.phase
    if (phase === 'idle') {
      start()
    } else if (phase === 'playing') {
      flapQueueRef.current = true
      playFlap()
    } else if (phase === 'dead') {
      restart()
    }
  }, [start])

  const restart = useCallback(() => {
    stateRef.current = {
      ...createInitialState(),
      bestScore: stateRef.current.bestScore,
    }
    flapQueueRef.current = false
    lastPipeTimeRef.current = 0
  }, [])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [tick])

  return {
    state: stateRef,
    frame: frameRef,
    start,
    flap,
    restart,
  }
}
