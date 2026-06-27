'use client'

import { useState, useEffect } from 'react'
import { Settings, Operation, RangePair } from '@/lib/math'
import { loadHomeStats } from '@/lib/storage'

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
  onStart: () => void
}

const DURATIONS = [60, 120, 180]

const OPS: { key: Operation; label: string }[] = [
  { key: 'add', label: '+' },
  { key: 'sub', label: '−' },
  { key: 'mul', label: '×' },
  { key: 'div', label: '÷' },
  { key: 'sq',  label: 'x²' },
]

export default function HomeScreen({ settings, onChange, onStart }: Props) {
  const [userStats, setUserStats] = useState<{ streak: number; pb: number } | null>(null)

  useEffect(() => {
    setUserStats(loadHomeStats(settings.duration))
  }, [settings.duration])

  const toggleOp = (op: Operation) => {
    const active = settings.operations.includes(op)
    if (active && settings.operations.length === 1) return
    onChange({
      ...settings,
      operations: active
        ? settings.operations.filter(o => o !== op)
        : [...settings.operations, op],
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-slate-950">
      <div className="w-full max-w-sm flex flex-col gap-5">

        <div className="text-center mb-1">
          <div className="text-5xl mb-2">🧮</div>
          <h1 className="text-3xl font-bold text-white">MathBlitz</h1>
          <p className="text-slate-500 mt-1 text-sm">Mental math trainer</p>
        </div>

        {userStats && (userStats.streak > 0 || userStats.pb > 0) && (
          <div className="flex gap-3">
            {userStats.streak > 0 && (
              <div className="flex-1 bg-slate-900 rounded-xl p-3 flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="text-white font-bold text-lg leading-none">{userStats.streak}</p>
                  <p className="text-slate-500 text-xs">day streak</p>
                </div>
              </div>
            )}
            {userStats.pb > 0 && (
              <div className="flex-1 bg-slate-900 rounded-xl p-3 flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <div>
                  <p className="text-white font-bold text-lg leading-none">{userStats.pb}</p>
                  <p className="text-slate-500 text-xs">best ({settings.duration}s)</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-slate-500 text-xs mb-3 font-medium uppercase tracking-widest">Time Limit</p>
          <div className="flex gap-2">
            {DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => onChange({ ...settings, duration: d })}
                className={[
                  'flex-1 py-3 rounded-xl font-bold text-lg transition-colors',
                  settings.duration === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
                ].join(' ')}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-slate-500 text-xs mb-3 font-medium uppercase tracking-widest">Operations</p>
          <div className="grid grid-cols-5 gap-2">
            {OPS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleOp(key)}
                className={[
                  'py-4 rounded-xl text-2xl font-bold transition-colors',
                  settings.operations.includes(key)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-600 hover:bg-slate-700',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-slate-500 text-xs mb-4 font-medium uppercase tracking-widest">Number Ranges</p>
          <div className="flex flex-col gap-4">
            <RangeRow
              label="+"
              sublabel="− uses same range"
              range={settings.addRange}
              separator="+"
              onChange={r => onChange({ ...settings, addRange: r })}
            />
            <div className="border-t border-slate-800" />
            <RangeRow
              label="×"
              sublabel="÷ uses same range"
              range={settings.mulRange}
              separator="×"
              onChange={r => onChange({ ...settings, mulRange: r })}
            />
            {settings.operations.includes('sq') && (
              <>
                <div className="border-t border-slate-800" />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-mono font-bold text-lg w-4">x²</span>
                    <span className="text-slate-600 text-xs">squaring only</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-sm pl-6">
                    <span>1 to</span>
                    <NumInput
                      value={settings.sqMax}
                      onChange={v => onChange({ ...settings, sqMax: Math.max(1, v) })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-2xl text-xl font-bold text-white transition-colors"
        >
          Play
        </button>
      </div>
    </div>
  )
}

function RangeRow({
  label,
  sublabel,
  range,
  separator,
  onChange,
}: {
  label: string
  sublabel: string
  range: RangePair
  separator: string
  onChange: (r: RangePair) => void
}) {
  const update = (field: keyof RangePair, val: number) => {
    const updated = { ...range, [field]: val }
    // Keep min <= max
    if (field === 'min1' && updated.min1 > updated.max1) updated.max1 = updated.min1
    if (field === 'max1' && updated.max1 < updated.min1) updated.min1 = updated.max1
    if (field === 'min2' && updated.min2 > updated.max2) updated.max2 = updated.min2
    if (field === 'max2' && updated.max2 < updated.min2) updated.min2 = updated.max2
    onChange(updated)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-slate-300 font-mono font-bold text-lg w-4">{label}</span>
        <span className="text-slate-600 text-xs">{sublabel}</span>
      </div>
      <div className="flex items-center gap-1 text-slate-400 text-sm pl-6">
        <span>(</span>
        <NumInput value={range.min1} onChange={v => update('min1', v)} />
        <span>to</span>
        <NumInput value={range.max1} onChange={v => update('max1', v)} />
        <span className="px-0.5">) {separator} (</span>
        <NumInput value={range.min2} onChange={v => update('min2', v)} />
        <span>to</span>
        <NumInput value={range.max2} onChange={v => update('max2', v)} />
        <span>)</span>
      </div>
    </div>
  )
}

function NumInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [display, setDisplay] = useState(String(value))

  useEffect(() => {
    setDisplay(String(value))
  }, [value])

  return (
    <input
      type="number"
      value={display}
      onChange={e => setDisplay(e.target.value)}
      onBlur={() => {
        const n = parseInt(display, 10)
        if (!isNaN(n) && n >= 1) {
          onChange(n)
        } else {
          setDisplay(String(value))
        }
      }}
      className={[
        'w-12 bg-slate-800 border border-slate-700 rounded-lg',
        'px-1 py-1.5 text-center text-white text-sm',
        'focus:outline-none focus:border-indigo-500',
        '[appearance:textfield]',
        '[&::-webkit-outer-spin-button]:appearance-none',
        '[&::-webkit-inner-spin-button]:appearance-none',
      ].join(' ')}
      min={1}
    />
  )
}
