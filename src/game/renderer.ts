import type { GameState, Bird, Pipe, Particle, PowerUp, FloatingText, ActiveEffect } from './types.ts'
import { CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, PIPE_WIDTH, POWERUP_SIZE } from './types.ts'

const PIPE_BODY = '#43a047'
const PIPE_DARK = '#2e7d32'
const PIPE_LIGHT = '#66bb6a'
const PIPE_CAP_HEIGHT = 26

// ── Sky with level-based gradient ──

function drawSky(ctx: CanvasRenderingContext2D, level: number) {
  const skyH = CANVAS_HEIGHT - GROUND_HEIGHT
  const grad = ctx.createLinearGradient(0, 0, 0, skyH)

  if (level <= 3) {
    grad.addColorStop(0, '#4dc9f6')
    grad.addColorStop(1, '#87ceeb')
  } else if (level <= 5) {
    grad.addColorStop(0, '#f0a040')
    grad.addColorStop(0.5, '#f8c870')
    grad.addColorStop(1, '#87ceeb')
  } else if (level <= 7) {
    grad.addColorStop(0, '#e85050')
    grad.addColorStop(0.4, '#f0a040')
    grad.addColorStop(1, '#dda060')
  } else {
    grad.addColorStop(0, '#1a1a4e')
    grad.addColorStop(0.5, '#2a2a6e')
    grad.addColorStop(1, '#4a3060')
  }

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, CANVAS_WIDTH, skyH)

  // Stars at night levels
  if (level >= 8) {
    ctx.fillStyle = '#fff'
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137.5) % CANVAS_WIDTH
      const sy = (i * 97.3) % (skyH * 0.6)
      const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * 0.002 + i))
      ctx.globalAlpha = twinkle
      ctx.beginPath()
      ctx.arc(sx, sy, 1 + (i % 3) * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

// ── Clouds ──

const clouds = [
  { x: 50, y: 80, w: 80, h: 30 },
  { x: 200, y: 140, w: 100, h: 35 },
  { x: 320, y: 60, w: 70, h: 25 },
  { x: 140, y: 200, w: 60, h: 22 },
  { x: 380, y: 170, w: 90, h: 28 },
]

function drawClouds(ctx: CanvasRenderingContext2D, offset: number, level: number) {
  const alpha = level >= 8 ? 0.15 : 0.65
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
  for (const cloud of clouds) {
    const cx = ((cloud.x - offset * 0.15) % (CANVAS_WIDTH + cloud.w) + CANVAS_WIDTH + cloud.w) % (CANVAS_WIDTH + cloud.w) - cloud.w / 2
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

  ctx.fillStyle = '#4CAF50'
  ctx.fillRect(0, groundY, CANVAS_WIDTH, 12)
  ctx.fillStyle = '#388E3C'
  for (let i = 0; i < CANVAS_WIDTH; i += 14) {
    const gx = ((i - offset * 1.5) % CANVAS_WIDTH + CANVAS_WIDTH) % CANVAS_WIDTH
    ctx.beginPath()
    ctx.moveTo(gx, groundY + 12)
    ctx.lineTo(gx + 4, groundY)
    ctx.lineTo(gx + 8, groundY + 12)
    ctx.fill()
  }

  const dirtGrad = ctx.createLinearGradient(0, groundY + 12, 0, CANVAS_HEIGHT)
  dirtGrad.addColorStop(0, '#8B6914')
  dirtGrad.addColorStop(1, '#654321')
  ctx.fillStyle = dirtGrad
  ctx.fillRect(0, groundY + 12, CANVAS_WIDTH, GROUND_HEIGHT - 12)

  ctx.fillStyle = '#9B7924'
  for (let i = 0; i < CANVAS_WIDTH + 40; i += 40) {
    const sx = ((i - offset * 2) % (CANVAS_WIDTH + 40) + CANVAS_WIDTH + 40) % (CANVAS_WIDTH + 40) - 20
    ctx.fillRect(sx, groundY + 20, 20, 4)
    ctx.fillRect(sx + 20, groundY + 35, 20, 4)
  }
}

// ── Pipes ──

function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe) {
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT
  const gapBottom = pipe.gapY + pipe.gap

  const bodyGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0)
  bodyGrad.addColorStop(0, PIPE_DARK)
  bodyGrad.addColorStop(0.3, PIPE_LIGHT)
  bodyGrad.addColorStop(0.7, PIPE_BODY)
  bodyGrad.addColorStop(1, PIPE_DARK)

  const capGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0)
  capGrad.addColorStop(0, PIPE_DARK)
  capGrad.addColorStop(0.2, PIPE_LIGHT)
  capGrad.addColorStop(0.5, PIPE_BODY)
  capGrad.addColorStop(1, PIPE_DARK)

  // Top pipe
  ctx.fillStyle = bodyGrad
  ctx.fillRect(pipe.x + 4, 0, PIPE_WIDTH - 8, pipe.gapY)
  ctx.fillStyle = capGrad
  roundRect(ctx, pipe.x, pipe.gapY - PIPE_CAP_HEIGHT, PIPE_WIDTH, PIPE_CAP_HEIGHT, 4)
  ctx.fill()
  ctx.strokeStyle = '#1b5e20'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Bottom pipe
  ctx.fillStyle = bodyGrad
  ctx.fillRect(pipe.x + 4, gapBottom, PIPE_WIDTH - 8, groundY - gapBottom)
  ctx.fillStyle = capGrad
  roundRect(ctx, pipe.x, gapBottom, PIPE_WIDTH, PIPE_CAP_HEIGHT, 4)
  ctx.fill()
  ctx.strokeStyle = '#1b5e20'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Highlight
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

function drawBird(ctx: CanvasRenderingContext2D, bird: Bird, frame: number, effects: readonly ActiveEffect[]) {
  ctx.save()
  ctx.translate(bird.x, bird.y)

  const angle = Math.min(Math.max(bird.rotation, -30), 70) * (Math.PI / 180)
  ctx.rotate(angle)

  const r = bird.width / 2
  const hasShield = effects.some(e => e.kind === 'shield' && e.remaining > 0)
  const hasSuperWing = effects.some(e => e.kind === 'superWing' && e.remaining > 0)
  const hasScoreBang = effects.some(e => e.kind === 'scoreBang' && e.remaining > 0)

  // Shield aura
  if (hasShield) {
    const shimmer = 0.2 + Math.sin(frame * 0.15) * 0.1
    ctx.strokeStyle = `rgba(100, 181, 246, ${shimmer + 0.3})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, r + 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = `rgba(100, 181, 246, ${shimmer})`
    ctx.fill()
  }

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
  const wingSpeed = hasSuperWing ? 0.6 : 0.3
  const wingFlap = Math.sin(frame * wingSpeed) * (hasSuperWing ? 10 : 6)
  ctx.fillStyle = hasSuperWing ? '#E1BEE7' : '#FFB300'
  ctx.beginPath()
  ctx.ellipse(-4, 2 + wingFlap, hasSuperWing ? 14 : 10, 6, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = hasSuperWing ? '#7B1FA2' : '#E65100'
  ctx.lineWidth = 1
  ctx.stroke()

  // Sparkle trail for super wing
  if (hasSuperWing) {
    for (let i = 0; i < 3; i++) {
      const sx = -14 - i * 5 + Math.sin(frame * 0.2 + i) * 3
      const sy = 2 + wingFlap + Math.cos(frame * 0.3 + i) * 4
      ctx.fillStyle = `rgba(206, 147, 216, ${0.5 - i * 0.15})`
      ctx.beginPath()
      ctx.arc(sx, sy, 2 - i * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Eye
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(6, -5, 7, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.ellipse(8, -5, 3.5, 3.5, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.ellipse(9.5, -6.5, 1.5, 1.5, 0, 0, Math.PI * 2)
  ctx.fill()

  // Blush cheeks
  ctx.fillStyle = 'rgba(255, 150, 150, 0.4)'
  ctx.beginPath()
  ctx.ellipse(4, 4, 4, 3, 0, 0, Math.PI * 2)
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

  // Score bang crown
  if (hasScoreBang) {
    const bounce = Math.sin(frame * 0.2) * 2
    ctx.fillStyle = '#FFD54F'
    ctx.beginPath()
    ctx.moveTo(-8, -r - 4 + bounce)
    ctx.lineTo(-4, -r - 12 + bounce)
    ctx.lineTo(0, -r - 6 + bounce)
    ctx.lineTo(4, -r - 14 + bounce)
    ctx.lineTo(8, -r - 4 + bounce)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#F9A825'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  ctx.restore()
}

// ── Power-ups ──

function drawPowerUps(ctx: CanvasRenderingContext2D, powerUps: readonly PowerUp[], frame: number) {
  for (const pu of powerUps) {
    if (pu.collected) continue

    const bob = Math.sin(frame * 0.08 + pu.x) * 4
    const y = pu.y + bob
    const r = POWERUP_SIZE / 2

    // Glow
    const glowColors: Record<string, string> = {
      shield: 'rgba(100, 181, 246, 0.3)',
      superWing: 'rgba(206, 147, 216, 0.3)',
      scoreBang: 'rgba(255, 213, 79, 0.3)',
    }
    ctx.fillStyle = glowColors[pu.kind]
    ctx.beginPath()
    ctx.arc(pu.x, y, r + 6, 0, Math.PI * 2)
    ctx.fill()

    // Background circle
    const bgColors: Record<string, string> = {
      shield: '#42A5F5',
      superWing: '#AB47BC',
      scoreBang: '#FFC107',
    }
    ctx.fillStyle = bgColors[pu.kind]
    ctx.beginPath()
    ctx.arc(pu.x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()

    // Icon
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${r}px "Courier New", monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const icons: Record<string, string> = {
      shield: '\uD83D\uDEE1\uFE0F',
      superWing: '\uD83E\uDEB6',
      scoreBang: '\u2B50',
    }
    ctx.fillText(icons[pu.kind], pu.x, y + 1)

    // Rotation sparkle
    const sparkAngle = frame * 0.05
    for (let i = 0; i < 4; i++) {
      const a = sparkAngle + (Math.PI * 2 * i) / 4
      const sx = pu.x + Math.cos(a) * (r + 4)
      const sy = y + Math.sin(a) * (r + 4)
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.beginPath()
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
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

// ── Floating Text ──

function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: readonly FloatingText[]) {
  for (const t of texts) {
    const alpha = t.life / t.maxLife
    const scale = 0.8 + alpha * 0.4
    ctx.globalAlpha = alpha
    ctx.font = `bold ${16 * scale}px "Courier New", monospace`
    ctx.textAlign = 'center'

    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 3
    ctx.strokeText(t.text, t.x, t.y)

    ctx.fillStyle = t.color
    ctx.fillText(t.text, t.x, t.y)
  }
  ctx.globalAlpha = 1
}

// ── Score ──

function drawScore(ctx: CanvasRenderingContext2D, score: number, frame: number, hasScoreBang: boolean) {
  const text = String(score)
  const bounce = hasScoreBang ? Math.sin(frame * 0.15) * 3 : 0
  ctx.font = 'bold 48px "Courier New", monospace'
  ctx.textAlign = 'center'

  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.fillText(text, CANVAS_WIDTH / 2 + 2, 72 + bounce)

  ctx.strokeStyle = hasScoreBang ? '#F9A825' : '#553300'
  ctx.lineWidth = 5
  ctx.strokeText(text, CANVAS_WIDTH / 2, 70 + bounce)

  ctx.fillStyle = hasScoreBang ? '#FFD54F' : '#fff'
  ctx.fillText(text, CANVAS_WIDTH / 2, 70 + bounce)
}

// ── Level Badge ──

function drawLevelBadge(ctx: CanvasRenderingContext2D, level: number) {
  ctx.font = 'bold 12px "Courier New", monospace'
  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  roundRect(ctx, 8, 8, 60, 22, 6)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.fillText(`LV.${level}`, 16, 24)
}

// ── Active Effects HUD ──

function drawEffectsHUD(ctx: CanvasRenderingContext2D, effects: readonly ActiveEffect[], frame: number) {
  let x = CANVAS_WIDTH - 36
  for (const effect of effects) {
    if (effect.remaining <= 0) continue
    const ratio = effect.remaining / 180
    const flash = effect.remaining < 60 && Math.sin(frame * 0.3) > 0

    ctx.globalAlpha = flash ? 0.5 : 0.85
    const colors: Record<string, string> = {
      shield: '#42A5F5',
      superWing: '#AB47BC',
      scoreBang: '#FFC107',
    }
    ctx.fillStyle = colors[effect.kind] ?? '#888'
    roundRect(ctx, x - 2, 8, 28, 22, 6)
    ctx.fill()

    // Timer bar
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillRect(x, 26, 24, 3)
    ctx.fillStyle = '#fff'
    ctx.fillRect(x, 26, 24 * ratio, 3)

    // Icon
    ctx.fillStyle = '#fff'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    const icons: Record<string, string> = {
      shield: '\uD83D\uDEE1',
      superWing: '\uD83E\uDEB6',
      scoreBang: '\u2B50',
    }
    ctx.fillText(icons[effect.kind] ?? '?', x + 12, 22)
    ctx.globalAlpha = 1

    x -= 34
  }
}

// ── Screen Flash ──

function drawScreenFlash(ctx: CanvasRenderingContext2D, intensity: number) {
  if (intensity <= 0) return
  ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
}

// ── Main Render ──

export function render(ctx: CanvasRenderingContext2D, state: GameState, frame: number) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  drawSky(ctx, state.level)
  drawClouds(ctx, state.groundOffset, state.level)

  for (const pipe of state.pipes) {
    drawPipe(ctx, pipe)
  }

  drawPowerUps(ctx, state.powerUps, frame)
  drawBird(ctx, state.bird, frame, state.activeEffects)
  drawParticles(ctx, state.particles)
  drawFloatingTexts(ctx, state.floatingTexts)
  drawGround(ctx, state.groundOffset)

  if (state.phase === 'playing' || state.phase === 'dying' || state.phase === 'dead') {
    const hasScoreBang = state.activeEffects.some(e => e.kind === 'scoreBang' && e.remaining > 0)
    drawScore(ctx, state.score, frame, hasScoreBang)
    drawLevelBadge(ctx, state.level)
    drawEffectsHUD(ctx, state.activeEffects, frame)
  }

  drawScreenFlash(ctx, state.screenFlash)
}
