export type Operation = 'add' | 'sub' | 'mul' | 'div'

export interface RangePair {
  min1: number
  max1: number
  min2: number
  max2: number
}

export interface Settings {
  duration: number
  operations: Operation[]
  addRange: RangePair
  mulRange: RangePair
}

export interface Question {
  a: number
  b: number
  op: Operation
  answer: number
  display: string
}

export interface Attempt {
  question: Question
  userAnswer: number
  correct: boolean
  elapsed: number
}

export interface SessionStats {
  score: number
  total: number
  attempts: Attempt[]
  byOp: Record<Operation, { correct: number; total: number; totalMs: number }>
  avgTimeMs: number
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateQuestion(settings: Settings): Question {
  const ops = settings.operations
  const op = ops[Math.floor(Math.random() * ops.length)]
  const { addRange, mulRange } = settings

  switch (op) {
    case 'add': {
      const a = randInt(addRange.min1, addRange.max1)
      const b = randInt(addRange.min2, addRange.max2)
      return { a, b, op, answer: a + b, display: `${a} + ${b}` }
    }
    case 'sub': {
      // "Addition in reverse": generate an addition problem, ask for the missing addend
      const x = randInt(addRange.min1, addRange.max1)
      const y = randInt(addRange.min2, addRange.max2)
      const total = x + y
      if (Math.random() < 0.5) {
        return { a: total, b: x, op, answer: y, display: `${total} − ${x}` }
      } else {
        return { a: total, b: y, op, answer: x, display: `${total} − ${y}` }
      }
    }
    case 'mul': {
      const a = randInt(mulRange.min1, mulRange.max1)
      const b = randInt(mulRange.min2, mulRange.max2)
      return { a, b, op, answer: a * b, display: `${a} × ${b}` }
    }
    case 'div': {
      // "Multiplication in reverse": generate a × b, ask for a missing factor
      const x = randInt(mulRange.min1, mulRange.max1)
      const y = randInt(mulRange.min2, mulRange.max2)
      const product = x * y
      if (Math.random() < 0.5) {
        return { a: product, b: x, op, answer: y, display: `${product} ÷ ${x}` }
      } else {
        return { a: product, b: y, op, answer: x, display: `${product} ÷ ${y}` }
      }
    }
  }
}

export function computeStats(attempts: Attempt[]): SessionStats {
  const score = attempts.filter(a => a.correct).length
  const byOp: Record<Operation, { correct: number; total: number; totalMs: number }> = {
    add: { correct: 0, total: 0, totalMs: 0 },
    sub: { correct: 0, total: 0, totalMs: 0 },
    mul: { correct: 0, total: 0, totalMs: 0 },
    div: { correct: 0, total: 0, totalMs: 0 },
  }
  let totalTime = 0
  for (const a of attempts) {
    byOp[a.question.op].total++
    if (a.correct) byOp[a.question.op].correct++
    byOp[a.question.op].totalMs += a.elapsed
    totalTime += a.elapsed
  }
  return {
    score,
    total: attempts.length,
    attempts,
    byOp,
    avgTimeMs: attempts.length > 0 ? totalTime / attempts.length : 0,
  }
}

// Matches Zetamac defaults exactly
export const DEFAULT_SETTINGS: Settings = {
  duration: 120,
  operations: ['add', 'sub', 'mul', 'div'],
  addRange: { min1: 2, max1: 100, min2: 2, max2: 100 },
  mulRange: { min1: 2, max1: 12, min2: 2, max2: 100 },
}
