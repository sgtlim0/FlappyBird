export interface Bird {
  readonly x: number
  readonly y: number
  readonly velocity: number
  readonly rotation: number
  readonly width: number
  readonly height: number
}

export interface Pipe {
  readonly x: number
  readonly topHeight: number
  readonly gapY: number
  readonly gap: number
  readonly width: number
  readonly scored: boolean
}

export type PowerUpKind = 'shield' | 'superWing' | 'scoreBang'

export interface PowerUp {
  readonly x: number
  readonly y: number
  readonly kind: PowerUpKind
  readonly collected: boolean
}

export interface ActiveEffect {
  readonly kind: PowerUpKind
  readonly remaining: number
}

export interface FloatingText {
  readonly x: number
  readonly y: number
  readonly text: string
  readonly color: string
  readonly life: number
  readonly maxLife: number
}

export interface Particle {
  readonly x: number
  readonly y: number
  readonly vx: number
  readonly vy: number
  readonly life: number
  readonly maxLife: number
  readonly color: string
  readonly size: number
}

export interface GameState {
  readonly bird: Bird
  readonly pipes: readonly Pipe[]
  readonly particles: readonly Particle[]
  readonly powerUps: readonly PowerUp[]
  readonly activeEffects: readonly ActiveEffect[]
  readonly floatingTexts: readonly FloatingText[]
  readonly score: number
  readonly bestScore: number
  readonly phase: 'idle' | 'playing' | 'dying' | 'dead'
  readonly groundOffset: number
  readonly level: number
  readonly screenFlash: number
}

export const CANVAS_WIDTH = 400
export const CANVAS_HEIGHT = 700
export const GROUND_HEIGHT = 80
export const PIPE_WIDTH = 60
export const BASE_PIPE_GAP = 200
export const MIN_PIPE_GAP = 145
export const BASE_PIPE_SPEED = 2.0
export const MAX_PIPE_SPEED = 4.0
export const GRAVITY = 0.35
export const FLAP_FORCE = -7.8
export const BIRD_SIZE = 26
export const BASE_PIPE_SPAWN_INTERVAL = 2000
export const MIN_PIPE_SPAWN_INTERVAL = 1100
export const POWERUP_SIZE = 22
export const SHIELD_DURATION = 180
export const SUPER_WING_DURATION = 200
export const SCORE_BANG_DURATION = 240
