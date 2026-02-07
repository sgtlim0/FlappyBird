import { useState, useCallback, useEffect } from 'react'
import GameCanvas from './game/GameCanvas.tsx'
import { startBGM, stopBGM, isBGMPlaying } from './game/bgm.ts'
import { getLeaderboard, addLeaderboardEntry, getCoins, addCoins, calculateCoins } from './game/leaderboard.ts'
import type { LeaderboardEntry } from './game/leaderboard.ts'
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

type View = 'game' | 'leaderboard'

export default function App() {
  const [phase, setPhase] = useState('idle')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [coins, setCoins] = useState(getCoins())
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [bgmOn, setBgmOn] = useState(false)
  const [view, setView] = useState<View>('game')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(getLeaderboard())

  const handleScoreChange = useCallback((s: number, best: number, lv: number) => {
    setScore(s)
    setBestScore(best)
    setLevel(lv)
  }, [])

  const handlePhaseChange = useCallback((p: string) => {
    setPhase(prev => {
      if (prev === 'playing' && p === 'dying') {
        stopBGM()
        setBgmOn(false)
      }
      return p
    })
  }, [])

  // Save to leaderboard on death
  useEffect(() => {
    if (phase === 'dead' && score > 0) {
      const earned = calculateCoins(score, level)
      setEarnedCoins(earned)
      const newTotal = addCoins(earned)
      setCoins(newTotal)
      const board = addLeaderboardEntry({
        score, level, coins: earned,
        date: new Date().toLocaleDateString('ko-KR'),
      })
      setLeaderboard(board)
    }
  }, [phase, score, level])

  const toggleBGM = useCallback(() => {
    if (isBGMPlaying()) {
      stopBGM()
      setBgmOn(false)
    } else {
      startBGM()
      setBgmOn(true)
    }
  }, [])

  const medal = getMedal(score)
  const isNewBest = score > 0 && score >= bestScore

  if (view === 'leaderboard') {
    return (
      <div className={styles.container}>
        <div className={styles.leaderboardPanel}>
          <div className={styles.lbTitle}>LEADERBOARD</div>
          <div className={styles.lbCoins}>{'\uD83E\uDE99'} {coins} coins</div>
          <div className={styles.lbList}>
            {leaderboard.length === 0 && (
              <div className={styles.lbEmpty}>No records yet</div>
            )}
            {leaderboard.map((entry, i) => (
              <div key={i} className={styles.lbRow}>
                <span className={styles.lbRank}>
                  {i === 0 ? '\uD83E\uDD47' : i === 1 ? '\uD83E\uDD48' : i === 2 ? '\uD83E\uDD49' : `#${i + 1}`}
                </span>
                <span className={styles.lbScore}>{entry.score}</span>
                <span className={styles.lbLevel}>Lv.{entry.level}</span>
                <span className={styles.lbDate}>{entry.date}</span>
              </div>
            ))}
          </div>
          <button className={styles.backBtn} onClick={() => setView('game')}>BACK</button>
        </div>
      </div>
    )
  }

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
            <div className={styles.coinDisplay}>{'\uD83E\uDE99'} {coins}</div>
            <div className={styles.subtitle}>
              {bestScore > 0 ? `Best: ${bestScore}` : 'Tap to Play'}
            </div>
            <div className={styles.features}>
              <span className={styles.featureTag}>{'\uD83D\uDEE1\uFE0F'} Shield</span>
              <span className={styles.featureTag}>{'\uD83E\uDEB6'} Super Wing</span>
              <span className={styles.featureTag}>{'\u2B50'} Score x3</span>
            </div>
            <div className={styles.tapHint}>TAP TO START</div>
            <div className={styles.bottomBtns}>
              <button className={styles.iconBtn} onClick={toggleBGM}>
                {bgmOn ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
              </button>
              <button className={styles.iconBtn} onClick={() => setView('leaderboard')}>
                {'\uD83C\uDFC6'}
              </button>
            </div>
          </div>
        )}

        {phase === 'playing' && (
          <div className={styles.overlayTop}>
            <button className={styles.bgmToggleSmall} onClick={toggleBGM}>
              {bgmOn ? '\uD83D\uDD0A' : '\uD83D\uDD07'}
            </button>
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
              <div className={styles.divider} />
              <div className={styles.coinReward}>
                <span>{'\uD83E\uDE99'} +{earnedCoins} coins</span>
                <span className={styles.coinTotal}>Total: {coins}</span>
              </div>
              <button className={styles.restartBtn}>TAP TO RETRY</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
