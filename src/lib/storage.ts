const KEY = 'mathblitz'
const GROUP_DAILY_PREFIX = 'mathblitz_gd_'

export interface StreakResult {
  streak: number
  isNewPB: boolean
  prevPB: number
  milestone: string | null
}

export interface DailyRecord {
  date: string
  score: number
  duration: number
}

interface StoredData {
  personalBests: Record<string, number>
  streak: number
  lastPlayedDate: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function read(): StoredData {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : empty()
  } catch {
    return empty()
  }
}

function empty(): StoredData {
  return { personalBests: {}, streak: 0, lastPlayedDate: '' }
}

function write(data: StoredData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function loadHomeStats(duration: number): { streak: number; pb: number } {
  const data = read()
  return {
    streak: data.streak,
    pb: data.personalBests[String(duration)] ?? 0,
  }
}

export function loadGroupDailyRecord(groupId: string): DailyRecord | null {
  try {
    const raw = localStorage.getItem(GROUP_DAILY_PREFIX + groupId)
    if (!raw) return null
    const record = JSON.parse(raw) as DailyRecord
    return record.date === today() ? record : null
  } catch {
    return null
  }
}

export function saveGroupDailyRecord(score: number, duration: number, groupId: string) {
  localStorage.setItem(
    GROUP_DAILY_PREFIX + groupId,
    JSON.stringify({ date: today(), score, duration })
  )
}

export function saveSession(score: number, duration: number): StreakResult {
  const data = read()
  const todayStr = today()

  let newStreak = data.streak
  if (data.lastPlayedDate === todayStr) {
    // Already played today — don't double-count
  } else if (data.lastPlayedDate === yesterday()) {
    newStreak += 1
  } else {
    newStreak = 1
  }

  const key = String(duration)
  const prevPB = data.personalBests[key] ?? 0
  const isNewPB = score > prevPB
  const milestone = checkMilestone(newStreak, score, prevPB)

  write({
    personalBests: { ...data.personalBests, [key]: Math.max(prevPB, score) },
    streak: newStreak,
    lastPlayedDate: todayStr,
  })

  return { streak: newStreak, isNewPB, prevPB, milestone }
}

function checkMilestone(streak: number, score: number, prevPB: number): string | null {
  if (streak === 3)  return '3-day streak'
  if (streak === 7)  return '7-day streak'
  if (streak === 14) return '14-day streak'
  if (streak === 30) return '30-day streak'
  if (prevPB < 10  && score >= 10)  return 'First 10!'
  if (prevPB < 25  && score >= 25)  return 'First 25!'
  if (prevPB < 50  && score >= 50)  return 'First 50!'
  if (prevPB < 100 && score >= 100) return 'Century!'
  return null
}
