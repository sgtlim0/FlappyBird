import { useRef, useCallback, useEffect } from 'react'
import type { GameState, Bird, Pipe, Particle, PowerUp, ActiveEffect, FloatingText, PowerUpKind } from './types.ts'
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT,
  PIPE_WIDTH, BASE_PIPE_GAP, MIN_PIPE_GAP,
  BASE_PIPE_SPEED, MAX_PIPE_SPEED,
  GRAVITY, FLAP_FORCE, BIRD_SIZE,
  BASE_PIPE_SPAWN_INTERVAL, MIN_PIPE_SPAWN_INTERVAL,
  POWERUP_SIZE, SHIELD_DURATION, SUPER_WING_DURATION, SCORE_BANG_DURATION,
} from './types.ts'
import { playFlap, playScore, playHit, playDie, playPowerUp, playLevelUp, playShieldHit } from './sound.ts'

const BEST_SCORE_KEY = 'flappy-best-score'

function loadBestScore(): number {
  try { return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0 }
  catch { return 0 }
}

function saveBestScore(score: number) {
  try { localStorage.setItem(BEST_SCORE_KEY, String(score)) }
  catch { /* ignore */ }
}

// ── Difficulty scaling ──

function getLevel(score: number): number {
  if (score >= 50) return 10
  if (score >= 40) return 9
  if (score >= 33) return 8
  if (score >= 27) return 7
  if (score >= 22) return 6
  if (score >= 17) return 5
  if (score >= 13) return 4
  if (score >= 9) return 3
  if (score >= 5) return 2
  return 1
}

function getPipeSpeed(level: number): number {
  const t = (level - 1) / 9
  return BASE_PIPE_SPEED + t * (MAX_PIPE_SPEED - BASE_PIPE_SPEED)
}

function getPipeGap(level: number): number {
  const t = (level - 1) / 9
  return BASE_PIPE_GAP - t * (BASE_PIPE_GAP - MIN_PIPE_GAP)
}

function getSpawnInterval(level: number): number {
  const t = (level - 1) / 9
  return BASE_PIPE_SPAWN_INTERVAL - t * (BASE_PIPE_SPAWN_INTERVAL - MIN_PIPE_SPAWN_INTERVAL)
}

// ── Helpers ──

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
    powerUps: [],
    activeEffects: [],
    floatingTexts: [],
    score: 0,
    bestScore: loadBestScore(),
    phase: 'idle',
    groundOffset: 0,
    level: 1,
    screenFlash: 0,
  }
}

function spawnPipe(gap: number): Pipe {
  const playArea = CANVAS_HEIGHT - GROUND_HEIGHT
  const minTop = 70
  const maxTop = playArea - gap - 70
  const gapY = minTop + Math.random() * (maxTop - minTop)

  return {
    x: CANVAS_WIDTH + 20,
    topHeight: gapY,
    gapY,
    gap,
    width: PIPE_WIDTH,
    scored: false,
  }
}

function maybeSpawnPowerUp(pipe: Pipe): PowerUp | null {
  if (Math.random() > 0.25) return null
  const kinds: PowerUpKind[] = ['shield', 'superWing', 'scoreBang']
  const kind = kinds[Math.floor(Math.random() * kinds.length)]
  return {
    x: pipe.x + PIPE_WIDTH / 2,
    y: pipe.gapY + pipe.gap / 2,
    kind,
    collected: false,
  }
}

function hasEffect(effects: readonly ActiveEffect[], kind: PowerUpKind): boolean {
  return effects.some(e => e.kind === kind && e.remaining > 0)
}

function createHitParticles(x: number, y: number): Particle[] {
  const colors = ['#FFE082', '#FFC107', '#FF9800', '#FF5722', '#fff']
  return Array.from({ length: 8 }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 6,
    vy: (Math.random() - 0.5) * 6 - 2,
    life: 1, maxLife: 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 3 + Math.random() * 4,
  }))
}

function createPowerUpParticles(x: number, y: number, kind: PowerUpKind): Particle[] {
  const colorMap: Record<PowerUpKind, string[]> = {
    shield: ['#64B5F6', '#42A5F5', '#90CAF9', '#fff'],
    superWing: ['#CE93D8', '#AB47BC', '#E1BEE7', '#fff'],
    scoreBang: ['#FFD54F', '#FFC107', '#FFE082', '#FF9800'],
  }
  return Array.from({ length: 12 }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.5) * 8,
    life: 1, maxLife: 1,
    color: colorMap[kind][Math.floor(Math.random() * colorMap[kind].length)],
    size: 2 + Math.random() * 5,
  }))
}

function createScoreParticles(x: number, y: number): Particle[] {
  return Array.from({ length: 5 }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 3,
    vy: -2 - Math.random() * 3,
    life: 1, maxLife: 1,
    color: ['#FFC107', '#FFE082', '#fff'][Math.floor(Math.random() * 3)],
    size: 2 + Math.random() * 3,
  }))
}

function createFlapTrail(bird: Bird): Particle[] {
  return Array.from({ length: 3 }, () => ({
    x: bird.x - 8 + Math.random() * 4,
    y: bird.y + Math.random() * 6 - 3,
    vx: -1 - Math.random() * 2,
    vy: (Math.random() - 0.5) * 2,
    life: 0.6, maxLife: 0.6,
    color: 'rgba(255,255,255,0.6)',
    size: 2 + Math.random() * 2,
  }))
}

function checkCollision(bird: Bird, pipes: readonly Pipe[]): boolean {
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT
  const birdR = bird.width / 2 - 3

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
      const gapBottom = pipe.gapY + pipe.gap

      if (birdTop < gapTop || birdBottom > gapBottom) return true
    }
  }

  return false
}

function checkPowerUpCollision(bird: Bird, pu: PowerUp): boolean {
  const dx = bird.x - pu.x
  const dy = bird.y - pu.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  return dist < (bird.width / 2 + POWERUP_SIZE / 2)
}

function updateBird(bird: Bird, flapping: boolean, hasSuperWing: boolean): Bird {
  const gravity = hasSuperWing ? GRAVITY * 0.6 : GRAVITY
  const flapForce = hasSuperWing ? FLAP_FORCE * 1.15 : FLAP_FORCE
  const newVelocity = flapping ? flapForce : bird.velocity + gravity
  const newY = bird.y + newVelocity
  const targetRotation = newVelocity < 0 ? -30 : Math.min(newVelocity * 6, 70)
  const newRotation = bird.rotation + (targetRotation - bird.rotation) * 0.15

  return { ...bird, y: newY, velocity: newVelocity, rotation: newRotation }
}

function updatePipes(pipes: readonly Pipe[], birdX: number, speed: number): { pipes: Pipe[]; scored: number } {
  let scored = 0
  const updated: Pipe[] = []

  for (const pipe of pipes) {
    const newX = pipe.x - speed
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

function updatePowerUps(powerUps: readonly PowerUp[], speed: number): PowerUp[] {
  return powerUps
    .map(pu => ({ ...pu, x: pu.x - speed }))
    .filter(pu => !pu.collected && pu.x > -30)
}

function updateEffects(effects: readonly ActiveEffect[]): ActiveEffect[] {
  return effects
    .map(e => ({ ...e, remaining: e.remaining - 1 }))
    .filter(e => e.remaining > 0)
}

function updateParticles(particles: readonly Particle[]): Particle[] {
  return particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.12,
      life: p.life - 0.025,
    }))
    .filter(p => p.life > 0)
}

function updateFloatingTexts(texts: readonly FloatingText[]): FloatingText[] {
  return texts
    .map(t => ({ ...t, y: t.y - 1.2, life: t.life - 0.02 }))
    .filter(t => t.life > 0)
}

// ── API ──

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
  const prevLevelRef = useRef(1)

  const tick = useCallback(() => {
    const state = stateRef.current
    frameRef.current++

    if (state.phase === 'idle') {
      const bobY = CANVAS_HEIGHT * 0.4 + Math.sin(frameRef.current * 0.05) * 10
      stateRef.current = {
        ...state,
        bird: { ...state.bird, y: bobY },
        groundOffset: state.groundOffset + 1,
      }
    } else if (state.phase === 'playing') {
      const shouldFlap = flapQueueRef.current
      flapQueueRef.current = false

      const level = getLevel(state.score)
      const speed = getPipeSpeed(level)
      const gap = getPipeGap(level)
      const spawnInterval = getSpawnInterval(level)
      const hasSuperWing = hasEffect(state.activeEffects, 'superWing')
      const hasShield = hasEffect(state.activeEffects, 'shield')
      const hasScoreBang = hasEffect(state.activeEffects, 'scoreBang')

      const newBird = updateBird(state.bird, shouldFlap, hasSuperWing)
      const { pipes: newPipes, scored } = updatePipes(state.pipes, newBird.x, speed)

      // Spawn pipes + power-ups
      let spawnedPowerUps: PowerUp[] = []
      const now = performance.now()
      if (now - lastPipeTimeRef.current > spawnInterval) {
        const pipe = spawnPipe(gap)
        newPipes.push(pipe)
        const pu = maybeSpawnPowerUp(pipe)
        if (pu) spawnedPowerUps = [pu]
        lastPipeTimeRef.current = now
      }

      // Score
      const scoreMultiplier = hasScoreBang ? 3 : 1
      const pointsGained = scored * scoreMultiplier
      if (scored > 0) playScore()

      const newScore = state.score + pointsGained
      const newBest = Math.max(newScore, state.bestScore)
      let newParticles = updateParticles(state.particles)
      let newFloatingTexts = updateFloatingTexts(state.floatingTexts)
      let newEffects = updateEffects(state.activeEffects)
      let newPowerUps = [...updatePowerUps(state.powerUps, speed), ...spawnedPowerUps]
      let screenFlash = Math.max(state.screenFlash - 0.05, 0)

      // Flap trail
      if (shouldFlap) {
        newParticles = [...newParticles, ...createFlapTrail(newBird)]
      }

      // Score floating text
      if (scored > 0) {
        newParticles = [...newParticles, ...createScoreParticles(CANVAS_WIDTH / 2, 80)]
        if (hasScoreBang) {
          newFloatingTexts = [...newFloatingTexts, {
            x: newBird.x + 20, y: newBird.y - 20,
            text: `+${pointsGained}`, color: '#FFD54F',
            life: 1, maxLife: 1,
          }]
        }
      }

      // Level up
      const newLevel = getLevel(newScore)
      if (newLevel > prevLevelRef.current) {
        prevLevelRef.current = newLevel
        playLevelUp()
        screenFlash = 0.4
        newFloatingTexts = [...newFloatingTexts, {
          x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.35,
          text: `LEVEL ${newLevel}`, color: '#fff',
          life: 1.2, maxLife: 1.2,
        }]
      }

      // Power-up collision
      for (let i = 0; i < newPowerUps.length; i++) {
        const pu = newPowerUps[i]
        if (!pu.collected && checkPowerUpCollision(newBird, pu)) {
          newPowerUps = newPowerUps.map((p, j) => j === i ? { ...p, collected: true } : p)
          newParticles = [...newParticles, ...createPowerUpParticles(pu.x, pu.y, pu.kind)]
          playPowerUp()
          screenFlash = 0.3

          const durationMap: Record<string, number> = {
            shield: SHIELD_DURATION,
            superWing: SUPER_WING_DURATION,
            scoreBang: SCORE_BANG_DURATION,
          }
          newEffects = [...newEffects, { kind: pu.kind, remaining: durationMap[pu.kind] }]

          const labelMap: Record<string, string> = {
            shield: 'SHIELD!',
            superWing: 'SUPER WING!',
            scoreBang: 'SCORE x3!',
          }
          const colorMap: Record<string, string> = {
            shield: '#64B5F6',
            superWing: '#CE93D8',
            scoreBang: '#FFD54F',
          }
          newFloatingTexts = [...newFloatingTexts, {
            x: pu.x, y: pu.y - 15,
            text: labelMap[pu.kind], color: colorMap[pu.kind],
            life: 1, maxLife: 1,
          }]
        }
      }

      // Collision
      if (checkCollision(newBird, newPipes)) {
        if (hasShield) {
          playShieldHit()
          screenFlash = 0.3
          newEffects = newEffects.filter(e => e.kind !== 'shield')
          newFloatingTexts = [...newFloatingTexts, {
            x: newBird.x, y: newBird.y - 20,
            text: 'SHIELD BREAK!', color: '#64B5F6',
            life: 1, maxLife: 1,
          }]
          // Push bird to safe position
          const safeBird = { ...newBird, y: newBird.y - 15, velocity: FLAP_FORCE * 0.5 }
          stateRef.current = {
            ...state,
            bird: safeBird, pipes: newPipes, particles: newParticles,
            powerUps: newPowerUps, activeEffects: newEffects,
            floatingTexts: newFloatingTexts,
            score: newScore, bestScore: newBest,
            groundOffset: state.groundOffset + 1,
            level: newLevel, screenFlash,
          }
        } else {
          playHit()
          const hitParticles = [...newParticles, ...createHitParticles(newBird.x, newBird.y)]
          saveBestScore(newBest)
          stateRef.current = {
            ...state,
            bird: newBird, pipes: newPipes,
            particles: hitParticles, powerUps: newPowerUps,
            activeEffects: [], floatingTexts: newFloatingTexts,
            score: newScore, bestScore: newBest,
            phase: 'dying', groundOffset: state.groundOffset + 1,
            level: newLevel, screenFlash: 0.6,
          }
          setTimeout(() => {
            playDie()
            stateRef.current = { ...stateRef.current, phase: 'dead' }
          }, 500)
        }
      } else {
        stateRef.current = {
          ...state,
          bird: newBird, pipes: newPipes, particles: newParticles,
          powerUps: newPowerUps, activeEffects: newEffects,
          floatingTexts: newFloatingTexts,
          score: newScore, bestScore: newBest,
          groundOffset: state.groundOffset + 1,
          level: newLevel, screenFlash,
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
        floatingTexts: updateFloatingTexts(state.floatingTexts),
        screenFlash: Math.max(state.screenFlash - 0.05, 0),
      }
    }

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
    prevLevelRef.current = 1
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
    prevLevelRef.current = 1
  }, [])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [tick])

  return { state: stateRef, frame: frameRef, start, flap, restart }
}
