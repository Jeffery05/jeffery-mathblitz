'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, Question, Attempt, generateQuestion } from '@/lib/math'
import NumberPad from './NumberPad'

interface Props {
  settings: Settings
  onGameEnd: (attempts: Attempt[]) => void
}

export default function GameScreen({ settings, onGameEnd }: Props) {
  const [timeLeft, setTimeLeft] = useState(settings.duration)
  const [question, setQuestion] = useState<Question>(() => generateQuestion(settings))
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)

  const inputRef = useRef('')
  const questionRef = useRef(question)
  const attemptsRef = useRef<Attempt[]>([])
  const questionStartRef = useRef(Date.now())
  const gameEndedRef = useRef(false)
  const onGameEndRef = useRef(onGameEnd)
  onGameEndRef.current = onGameEnd

  useEffect(() => {
    const endAt = Date.now() + settings.duration * 1000
    const tick = setInterval(() => {
      const remaining = (endAt - Date.now()) / 1000
      if (remaining <= 0) {
        clearInterval(tick)
        if (!gameEndedRef.current) {
          gameEndedRef.current = true
          onGameEndRef.current(attemptsRef.current)
        }
      } else {
        setTimeLeft(remaining)
      }
    }, 100)
    return () => clearInterval(tick)
  }, [settings.duration])

  const advance = () => {
    const elapsed = Date.now() - questionStartRef.current
    attemptsRef.current = [
      ...attemptsRef.current,
      { question: questionRef.current, userAnswer: parseInt(inputRef.current, 10), correct: true, elapsed },
    ]
    setScore(s => s + 1)
    inputRef.current = ''
    setInput('')
    const next = generateQuestion(settings)
    questionRef.current = next
    setQuestion(next)
    questionStartRef.current = Date.now()
  }

  const addDigit = (digit: string) => {
    if (inputRef.current.length >= 6) return
    const next = inputRef.current + digit
    inputRef.current = next
    setInput(next)
    if (parseInt(next, 10) === questionRef.current.answer) {
      advance()
    }
  }

  const removeDigit = () => {
    const next = inputRef.current.slice(0, -1)
    inputRef.current = next
    setInput(next)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') addDigit(e.key)
      else if (e.key === 'Backspace') removeDigit()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handlePad = (key: string) => {
    if (key === 'backspace') removeDigit()
    else if (key !== 'submit') addDigit(key)
  }

  const pct = (timeLeft / settings.duration) * 100
  const mins = Math.floor(timeLeft / 60)
  const secs = Math.floor(timeLeft % 60)
  const timeDisplay = `${mins}:${secs.toString().padStart(2, '0')}`
  const isUrgent = timeLeft <= 10

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <div className="h-1.5 bg-slate-800">
        <div
          className={`h-full transition-none ${isUrgent ? 'bg-red-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex justify-between items-center px-6 pt-4 pb-2">
        <span className={`font-mono text-xl font-bold tabular-nums ${isUrgent ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
          {timeDisplay}
        </span>
        <span className="text-emerald-400 font-bold text-xl tabular-nums">{score} ✓</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <p className="text-5xl sm:text-6xl font-bold text-white tracking-tight text-center leading-tight">
          {question.display} = ?
        </p>

        <div className="min-w-48 h-20 px-6 rounded-2xl border-2 border-slate-700 flex items-center justify-center font-mono text-5xl font-bold text-white">
          {input || <span className="text-slate-800 select-none">—</span>}
        </div>
      </div>

      <div className="px-4 pb-6 pt-2">
        <NumberPad onKey={handlePad} disabled={false} />
      </div>
    </div>
  )
}
