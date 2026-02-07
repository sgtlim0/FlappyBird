import type { GameState, Bird, Pipe, Particle } from './types.ts'
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, PIPE_WIDTH } from './types.ts'

// ── Colors ──

const SKY_GRADIENT_TOP = '#4dc9f6'
const SKY_GRADIENT_BOTTOM = '#87ceeb'
const GROUND_TOP = '#8B6914'
const GROUND_BOTTOM = '#654321'
const GROUND_STRIPE = '#9B7924'
const GRASS_COLOR = '#4CAF50'
const GRASS_DARK = '#388E3C'
const PIPE_BODY = '#43a047'
const PIPE_DARK = '#2e7d32'
const PIPE_LIGHT = '#66bb6a'
const PIPE_CAP_HEIGHT = 26

// ── Sky ──

function drawSky(ctx: CanvasRenderingContext2D) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT)
  grad.addColorStop(0, SKY_GRADIENT_TOP)
  grad.addColorStop(1, SKY_GRADIENT_BOTTOM)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT)
}

// ── Clouds ──

const clouds = [
  { x: 50, y: 80, w: 80, h: 30 },
  { x: 200, y: 140, w: 100, h: 35 },
  { x: 320, y: 60, w: 70, h: 25 },
  { x: 140, y: 200, w: 60, h: 22 },
]

function drawClouds(ctx: CanvasRenderingContext2D, offset: number) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  for (const cloud of clouds) {
    const cx = ((cloud.x - offset * 0.2) % (CANVAS_WIDTH + cloud.w) + CANVAS_WIDTH + cloud.w) % (CANVAS_WIDTH + cloud.w) - cloud.w / 2
    ctx.beginPath()
    ctx.ellipse(cx, cloud.y, cloud.w / 2, cloud.h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx - cloud.w * 0.25, cloud.y + 5, cloud.w * 0.3, cloud.h * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + cloud.w * 0.25, cloud.y + 3, cloud.w * 0.35, cloud.h * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ── Ground ──

function drawGround(ctx: CanvasRenderingContext2D, offset: number) {
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT

  // Grass strip
  ctx.fillStyle = GRASS_COLOR
  ctx.fillRect(0, groundY, CANVAS_WIDTH, 12)
  // Grass tufts
  ctx.fillStyle = GRASS_DARK
  for (let i = 0; i < CANVAS_WIDTH; i += 14) {
    const gx = ((i - offset * 1.5) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH
    ctx.beginPath()
    ctx.moveTo(gx, groundY + 12)
    ctx.lineTo(gx + 4, groundY)
    ctx.lineTo(gx + 8, groundY + 12)
    ctx.fill()
  }

  // Dirt
  const dirtGrad = ctx.createLinearGradient(0, groundY + 12, 0, CANVAS_HEIGHT)
  dirtGrad.addColorStop(0, GROUND_TOP)
  dirtGrad.addColorStop(1, GROUND_BOTTOM)
  ctx.fillStyle = dirtGrad
  ctx.fillRect(0, groundY + 12, CANVAS_WIDTH, GROUND_HEIGHT - 12)

  // Stripe pattern
  ctx.fillStyle = GROUND_STRIPE
  for (let i = 0; i < CANVAS_WIDTH + 40; i += 40) {
    const sx = ((i - offset * 2) % (CANVAS_WIDTH + 40) + CANVAS_WIDTH + 40) % (CANVAS_WIDTH + 40) - 20
    ctx.fillRect(sx, groundY + 20, 20, 4)
    ctx.fillRect(sx + 20, groundY + 35, 20, 4)
  }
}

// ── Pipes ──

function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe) {
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT
  const gapBottom = pipe.gapY + pipe.topHeight

  // Top pipe body
  const topBodyGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0)
  topBodyGrad.addColorStop(0, PIPE_DARK)
  topBodyGrad.addColorStop(0.3, PIPE_LIGHT)
  topBodyGrad.addColorStop(0.7, PIPE_BODY)
  topBodyGrad.addColorStop(1, PIPE_DARK)
  ctx.fillStyle = topBodyGrad
  ctx.fillRect(pipe.x + 4, 0, PIPE_WIDTH - 8, pipe.gapY)

  // Top pipe cap
  const capGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0)
  capGrad.addColorStop(0, PIPE_DARK)
  capGrad.addColorStop(0.2, PIPE_LIGHT)
  capGrad.addColorStop(0.5, PIPE_BODY)
  capGrad.addColorStop(1, PIPE_DARK)
  ctx.fillStyle = capGrad
  roundRect(ctx, pipe.x, pipe.gapY - PIPE_CAP_HEIGHT, PIPE_WIDTH, PIPE_CAP_HEIGHT, 4)
  ctx.fill()
  ctx.strokeStyle = '#1b5e20'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Bottom pipe body
  ctx.fillStyle = topBodyGrad
  ctx.fillRect(pipe.x + 4, gapBottom, PIPE_WIDTH - 8, groundY - gapBottom)

  // Bottom pipe cap
  ctx.fillStyle = capGrad
  roundRect(ctx, pipe.x, gapBottom, PIPE_WIDTH, PIPE_CAP_HEIGHT, 4)
  ctx.fill()
  ctx.strokeStyle = '#1b5e20'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Highlight line
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(pipe.x + 10, 0, 4, pipe.gapY - PIPE_CAP_HEIGHT)
  ctx.fillRect(pipe.x + 10, gapBottom + PIPE_CAP_HEIGHT, 4, groundY - gapBottom - PIPE_CAP_HEIGHT)
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ── Bird ──

function drawBird(ctx: CanvasRenderingContext2D, bird: Bird, frame: number) {
  ctx.save()
  ctx.translate(bird.x, bird.y)

  // Rotation based on velocity
  const angle = Math.min(Math.max(bird.rotation, -30), 70) * (Math.PI / 180)
  ctx.rotate(angle)

  const r = bird.width / 2

  // Body
  const bodyGrad = ctx.createRadialGradient(0, -2, 2, 0, 0, r)
  bodyGrad.addColorStop(0, '#FFE082')
  bodyGrad.addColorStop(0.6, '#FFC107')
  bodyGrad.addColorStop(1, '#FF9800')
  ctx.fillStyle = bodyGrad
  ctx.beginPath()
  ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#E65100'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Wing
  const wingFlap = Math.sin(frame * 0.3) * 6
  ctx.fillStyle = '#FFB300'
  ctx.beginPath()
  ctx.ellipse(-4, 2 + wingFlap, 10, 6, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#E65100'
  ctx.lineWidth = 1
  ctx.stroke()

  // Eye (white)
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(6, -5, 7, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.stroke()

  // Pupil
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.ellipse(8, -5, 3.5, 3.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Eye highlight
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(9.5, -6.5, 1.5, 1.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Beak
  ctx.fillStyle = '#FF5722'
  ctx.beginPath()
  ctx.moveTo(12, -1)
  ctx.lineTo(22, 1)
  ctx.lineTo(12, 4)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = '#BF360C'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.restore()
}

// ── Particles ──

function drawParticles(ctx: CanvasRenderingContext2D, particles: readonly Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// ── Score ──

function drawScore(ctx: CanvasRenderingContext2D, score: number) {
  const text = String(score)
  ctx.font = 'bold 48px "Courier New", monospace'
  ctx.textAlign = 'center'

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillText(text, CANVAS_WIDTH / 2 + 2, 72)

  // Outline
  ctx.strokeStyle = '#553300'
  ctx.lineWidth = 5
  ctx.strokeText(text, CANVAS_WIDTH / 2, 70)

  // Fill
  ctx.fillStyle = '#fff'
  ctx.fillText(text, CANVAS_WIDTH / 2, 70)
}

// ── Main Render ──

export function render(ctx: CanvasRenderingContext2D, state: GameState, frame: number) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  drawSky(ctx)
  drawClouds(ctx, state.groundOffset)

  for (const pipe of state.pipes) {
    drawPipe(ctx, pipe)
  }

  drawBird(ctx, state.bird, frame)
  drawParticles(ctx, state.particles)
  drawGround(ctx, state.groundOffset)

  if (state.phase === 'playing' || state.phase === 'dying' || state.phase === 'dead') {
    drawScore(ctx, state.score)
  }
}
