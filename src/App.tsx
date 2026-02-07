import { useState, useCallback } from 'react'
import GameCanvas from './game/GameCanvas.tsx'
import styles from './App.module.css'

function getMedal(score: number): string {
  if (score >= 50) return '\uD83D\uDC51'
  if (score >= 40) return '\uD83E\uDD47'
  if (score >= 30) return '\uD83E\uDD48'
  if (score >= 20) return '\uD83E\uDD49'
  if (score >= 10) return '\u2B50'
  return ''
}

function getLevelName(level: number): string {
  const names = ['', 'Beginner', 'Easy', 'Normal', 'Tricky', 'Hard', 'Expert', 'Master', 'Night', 'Insane', 'Legend']
  return names[level] ?? 'Legend'
}

export default function App() {
  const [phase, setPhase] = useState('idle')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [level, setLevel] = useState(1)

  const handleScoreChange = useCallback((s: number, best: number, lv: number) => {
    setScore(s)
    setBestScore(best)
    setLevel(lv)
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

        {phase === 'idle' && (
          <div className={styles.overlay}>
            <div className={styles.title}>FLAPPY BIRD</div>
            <div className={styles.subtitle}>
              {bestScore > 0 ? `Best: ${bestScore}` : 'Tap to Play'}
            </div>
            <div className={styles.features}>
              <span className={styles.featureTag}>{'\uD83D\uDEE1\uFE0F'} Shield</span>
              <span className={styles.featureTag}>{'\uD83E\uDEB6'} Super Wing</span>
              <span className={styles.featureTag}>{'\u2B50'} Score x3</span>
            </div>
            <div className={styles.tapHint}>TAP TO START</div>
          </div>
        )}

        {phase === 'dead' && (
          <div className={styles.overlay}>
            <div className={styles.gameOverPanel}>
              <div className={styles.gameOverTitle}>GAME OVER</div>
              {medal && <div className={styles.medal}>{medal}</div>}
              <div className={styles.levelTag}>{getLevelName(level)} (Lv.{level})</div>
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
              <button className={styles.restartBtn}>TAP TO RETRY</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
