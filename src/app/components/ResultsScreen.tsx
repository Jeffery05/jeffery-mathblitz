'use client'

import { useState } from 'react'
import { SessionStats, Operation } from '@/lib/math'
import { StreakResult } from '@/lib/storage'

interface Props {
  stats: SessionStats
  streakResult: StreakResult
  duration: number
  isDaily: boolean
  onPlayAgain: () => void
  onSettings: () => void
  onViewLeaderboard?: () => void
}

const OP_LABELS: Record<Operation, string> = {
  add: '+',
  sub: '−',
  mul: '×',
  div: '÷',
  sq:  'x²',
}

const OP_NAMES: Record<Operation, string> = {
  add: 'addition',
  sub: 'subtraction',
  mul: 'multiplication',
  div: 'division',
  sq:  'squares',
}

const TRASH_TALK = [
  (s: number, d: number) => `🧮 Just dropped ${s} correct in ${d}s on MathBlitz. Your move.`,
  (s: number, d: number) => `${s} in ${d}s 🔥 Can you beat it?`,
  (s: number, d: number) => `Scored ${s} on MathBlitz today 💀 Don't embarrass yourself.`,
  (s: number, d: number) => `${s} correct answers in ${d}s 📈 Touch grass or touch the leaderboard.`,
  (s: number, d: number) => `MathBlitz daily: ${s}/${d}s ⚡ I'm not saying I'm better at math than you... actually yes I am.`,
  (s: number, d: number) => `Just got ${s} on MathBlitz (${d}s mode) 🧠 Think you can keep up?`,
  (s: number, d: number) => `${s} in ${d}s. Zetamac could never. 😤`,
]

export default function ResultsScreen({ stats, streakResult, duration, isDaily, onPlayAgain, onSettings, onViewLeaderboard }: Props) {
  const [copied, setCopied] = useState(false)

  const avgSec = (stats.avgTimeMs / 1000).toFixed(1)
  const { streak, isNewPB, prevPB, milestone } = streakResult

  const activeOps = (Object.keys(stats.byOp) as Operation[]).filter(
    op => stats.byOp[op].total > 0
  )

  const slowest = activeOps
    .map(op => ({ op, ...stats.byOp[op] }))
    .filter(x => x.correct >= 2)
    .sort((a, b) => b.totalMs / b.correct - a.totalMs / a.correct)[0]

  const handleShare = async () => {
    const fn = TRASH_TALK[Math.floor(Math.random() * TRASH_TALK.length)]
    const msg = fn(stats.score, duration)
    await navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-slate-950">
      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* Milestone banner */}
        {milestone && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3 text-center">
            <p className="text-amber-400 font-bold text-sm">{milestone} 🎉</p>
          </div>
        )}

        {/* Score */}
        <div className="text-center">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">
            {isDaily ? 'Daily Complete ✓' : 'Practice Session'}
          </p>
          <div className="text-8xl font-black text-white tabular-nums">{stats.score}</div>
          <p className="text-slate-400 mt-1">correct answers</p>
        </div>

        {/* New PB callout */}
        {isNewPB && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-amber-300 font-bold">New personal best!</p>
              <p className="text-slate-500 text-xs">
                {prevPB > 0 ? `Previous best: ${prevPB} (${duration}s)` : `First session (${duration}s)`}
              </p>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-900 rounded-xl p-3 text-center flex flex-col items-center">
            <p className="text-xl">🔥</p>
            <p className="text-white font-bold text-lg tabular-nums leading-tight">{streak}</p>
            <p className="text-slate-500 text-xs">{streak === 1 ? 'day' : 'days'}</p>
          </div>
          <StatCard label="Questions" value={String(stats.total)} />
          <StatCard label="Avg" value={`${avgSec}s`} />
        </div>

        {/* Per-operation breakdown */}
        {activeOps.length > 0 && (
          <div className="bg-slate-900 rounded-2xl p-4">
            <p className="text-slate-500 text-xs mb-4 font-medium uppercase tracking-widest">
              By Operation
            </p>
            <div className="flex flex-col gap-3">
              {activeOps.map(op => {
                const { correct, totalMs } = stats.byOp[op]
                const avgMs = correct > 0 ? totalMs / correct : 0
                return (
                  <div key={op} className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-lg w-5 shrink-0">
                      {OP_LABELS[op]}
                    </span>
                    <span className="flex-1 text-slate-500 text-sm tabular-nums">
                      {correct} correct
                    </span>
                    <span className="text-slate-400 text-sm tabular-nums">
                      {(avgMs / 1000).toFixed(1)}s avg
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Slowest operation tip */}
        {slowest && (
          <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">
              Slowest
            </p>
            <p className="text-slate-300 text-sm">
              Your {OP_NAMES[slowest.op]} averaged{' '}
              {(slowest.totalMs / slowest.correct / 1000).toFixed(1)}s — keep drilling it.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-1">
          {isDaily && (
            <button
              onClick={handleShare}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold text-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? '✓ Copied!' : '📤 Share Score'}
            </button>
          )}
          {isDaily && onViewLeaderboard && (
            <button
              onClick={onViewLeaderboard}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-2xl text-xl font-bold text-white transition-colors"
            >
              View Leaderboard
            </button>
          )}
          <button
            onClick={onPlayAgain}
            className={[
              'w-full py-5 rounded-2xl text-xl font-bold transition-colors',
              isDaily
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white',
            ].join(' ')}
          >
            Play Again
          </button>
          <button
            onClick={onSettings}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 rounded-2xl text-lg font-bold text-slate-400 transition-colors"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-white tabular-nums">{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  )
}
