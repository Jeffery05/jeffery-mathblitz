'use client'

import { useState, useEffect, useCallback } from 'react'
import { Group, LeaderboardEntry, getLeaderboard } from '@/lib/db'
import { loadGroupDailyRecord, DailyRecord } from '@/lib/storage'

interface Props {
  group: Group
  onBack: () => void
  onPlayDaily: (groupId: string) => void
}

const DURATIONS = [60, 120, 180]
const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardScreen({ group, onBack, onPlayDaily }: Props) {
  const [duration, setDuration] = useState(120)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [dailyRecord, setDailyRecord] = useState<DailyRecord | null>(null)

  useEffect(() => {
    setDailyRecord(loadGroupDailyRecord(group.id))
  }, [group.id])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setEntries(await getLeaderboard(group.id, duration))
    } catch {
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [group.id, duration])

  useEffect(() => { load() }, [load])

  const copyCode = async () => {
    await navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 px-4 py-6">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* Header */}
        <div>
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors mb-3 flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="flex items-start justify-between">
            <h2 className="text-2xl font-bold text-white">{group.name}</h2>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 bg-slate-900 rounded-xl px-3 py-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              <span className="font-mono tracking-wider">{group.invite_code}</span>
              <span>{copied ? '✓' : '📋'}</span>
            </button>
          </div>
          <p className="text-slate-600 text-xs mt-1">Share the code above to invite friends</p>
        </div>

        {/* Duration tabs */}
        <div className="flex gap-2">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={[
                'flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors',
                duration === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              {d}s
            </button>
          ))}
        </div>

        {/* Rankings */}
        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-slate-600 text-center py-8">Loading...</p>
          ) : entries.length === 0 ? (
            <p className="text-slate-600 text-center py-8">
              No scores yet for {duration}s — play a game!
            </p>
          ) : (
            entries.map((entry, i) => (
              <div
                key={entry.username}
                className={[
                  'flex items-center gap-3 rounded-2xl px-4 py-3',
                  i === 0 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-900',
                ].join(' ')}
              >
                <span className="text-xl w-7 text-center shrink-0">
                  {MEDALS[i] ?? <span className="text-slate-600 text-sm font-bold">#{i + 1}</span>}
                </span>
                <span className={[
                  'flex-1 font-medium truncate',
                  i === 0 ? 'text-amber-300' : 'text-white',
                ].join(' ')}>
                  {entry.username}
                </span>
                <div className="text-right shrink-0">
                  <p className={[
                    'font-black text-xl tabular-nums',
                    i === 0 ? 'text-amber-300' : 'text-white',
                  ].join(' ')}>
                    {entry.best_score}
                  </p>
                  <p className="text-slate-600 text-xs">
                    {entry.session_count} {Number(entry.session_count) === 1 ? 'game' : 'games'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Daily game */}
        {dailyRecord ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl">✅</span>
            <div>
              <p className="text-emerald-400 font-bold text-sm">Daily complete</p>
              <p className="text-slate-500 text-xs">Score: {dailyRecord.score} — {dailyRecord.duration}s</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onPlayDaily(group.id)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold transition-colors"
          >
            Play Daily
          </button>
        )}

        {/* Refresh */}
        {!loading && (
          <button
            onClick={load}
            className="text-slate-600 hover:text-slate-400 text-sm text-center transition-colors py-1"
          >
            ↻ Refresh
          </button>
        )}
      </div>
    </div>
  )
}
