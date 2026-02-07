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
  readonly width: number
  readonly scored: boolean
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
  readonly score: number
  readonly bestScore: number
  readonly phase: 'idle' | 'playing' | 'dying' | 'dead'
  readonly groundOffset: number
}

export const CANVAS_WIDTH = 400
export const CANVAS_HEIGHT = 700
export const GROUND_HEIGHT = 80
export const PIPE_WIDTH = 60
export const PIPE_GAP = 160
export const PIPE_SPEED = 2.5
export const GRAVITY = 0.45
export const FLAP_FORCE = -7.5
export const BIRD_SIZE = 28
export const PIPE_SPAWN_INTERVAL = 1600
