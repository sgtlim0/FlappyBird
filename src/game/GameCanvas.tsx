import { useRef, useEffect, useCallback } from 'react'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './types.ts'
import { render } from './renderer.ts'
import { useFlappyBird } from './useFlappyBird.ts'

interface Props {
  readonly onScoreChange: (score: number, best: number) => void
  readonly onPhaseChange: (phase: string) => void
}

export default function GameCanvas({ onScoreChange, onPhaseChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { state: stateRef, frame: frameRef, flap } = useFlappyBird()
  const prevScoreRef = useRef(0)
  const prevPhaseRef = useRef('')

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const s = stateRef.current
    render(ctx, s, frameRef.current)

    if (s.score !== prevScoreRef.current || s.bestScore !== prevScoreRef.current) {
      prevScoreRef.current = s.score
      onScoreChange(s.score, s.bestScore)
    }
    if (s.phase !== prevPhaseRef.current) {
      prevPhaseRef.current = s.phase
      onPhaseChange(s.phase)
    }

    requestAnimationFrame(draw)
  }, [stateRef, frameRef, onScoreChange, onPhaseChange])

  useEffect(() => {
    const animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [draw])

  // Keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        flap()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [flap])

  // Touch / click input
  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    flap()
  }, [flap])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        imageRendering: 'auto',
        cursor: 'pointer',
      }}
    />
  )
}
