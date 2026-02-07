import { useState, useCallback } from 'react'
import GameCanvas from './game/GameCanvas.tsx'
import styles from './App.module.css'

function getMedal(score: number): string {
  if (score >= 40) return '\uD83E\uDD47'
  if (score >= 30) return '\uD83E\uDD48'
  if (score >= 20) return '\uD83E\uDD49'
  if (score >= 10) return '\u2B50'
  return ''
}

export default function App() {
  const [phase, setPhase] = useState('idle')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)

  const handleScoreChange = useCallback((s: number, best: number) => {
    setScore(s)
    setBestScore(best)
  }, [])

  const handlePhaseChange = useCallback((p: string) => {
    setPhase(p)
  }, [])

  const medal = getMedal(score)
  const isNewBest = score > 0 && score >= bestScore

  return (
    <div className={styles.container}>
      <div className={styles.gameWrapper}>
        <GameCanvas
          onScoreChange={handleScoreChange}
          onPhaseChange={handlePhaseChange}
        />

        {/* Start Screen Overlay */}
        {phase === 'idle' && (
          <div className={styles.overlay}>
            <div className={styles.title}>FLAPPY BIRD</div>
            <div className={styles.subtitle}>
              {bestScore > 0 ? `Best: ${bestScore}` : 'Canvas Game'}
            </div>
            <div className={styles.tapHint}>TAP TO START</div>
          </div>
        )}

        {/* Game Over Overlay */}
        {phase === 'dead' && (
          <div className={styles.overlay}>
            <div className={styles.gameOverPanel}>
              <div className={styles.gameOverTitle}>GAME OVER</div>
              {medal && <div className={styles.medal}>{medal}</div>}
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>SCORE</span>
                <span className={styles.scoreValue}>{score}</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.scoreRow}>
                <span className={styles.scoreLabel}>BEST</span>
                <span className={`${styles.scoreValue} ${styles.bestValue}`}>{bestScore}</span>
              </div>
              {isNewBest && <div className={styles.newBest}>NEW BEST!</div>}
              <button className={styles.restartBtn}>PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
