const LEADERBOARD_KEY = 'flappy-leaderboard'
const COINS_KEY = 'flappy-coins'
const MAX_ENTRIES = 10

export interface LeaderboardEntry {
  readonly score: number
  readonly level: number
  readonly coins: number
  readonly date: string
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY)
    if (!raw) return []
    return JSON.parse(raw) as LeaderboardEntry[]
  } catch {
    return []
  }
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const board = getLeaderboard()
  board.push(entry)
  board.sort((a, b) => b.score - a.score)
  const trimmed = board.slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed))
  } catch { /* ignore */ }
  return trimmed
}

export function getCoins(): number {
  try {
    return Number(localStorage.getItem(COINS_KEY)) || 0
  } catch {
    return 0
  }
}

export function addCoins(amount: number): number {
  const current = getCoins()
  const next = current + amount
  try {
    localStorage.setItem(COINS_KEY, String(next))
  } catch { /* ignore */ }
  return next
}

export function calculateCoins(score: number, level: number): number {
  const base = score * 2
  const levelBonus = level * 5
  const milestoneBonus = score >= 10 ? 20 : 0
  const highBonus = score >= 30 ? 50 : 0
  return base + levelBonus + milestoneBonus + highBonus
}
