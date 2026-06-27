'use client'

import { useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { signIn, signUp } from '@/lib/db'

interface Props {
  onAuth: (session: Session) => void
}

type Mode = 'signin' | 'signup'

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      let session: Session
      if (mode === 'signup') {
        if (!username.trim()) throw new Error('Username is required')
        if (username.length < 3) throw new Error('Username must be at least 3 characters')
        session = await signUp(email, password, username.trim())
      } else {
        session = await signIn(email, password)
      }
      onAuth(session)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submit()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-950">
      <div className="w-full max-w-sm flex flex-col gap-4">

        <div className="text-center mb-2">
          <div className="text-5xl mb-2">👥</div>
          <h2 className="text-2xl font-bold text-white">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">to join and compete with groups</p>
        </div>

        <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-3">
          {mode === 'signup' && (
            <Input
              placeholder="Username"
              value={username}
              onChange={setUsername}
              onKeyDown={handleKey}
              autoComplete="username"
            />
          )}
          <Input
            placeholder="Email"
            type="email"
            value={email}
            onChange={setEmail}
            onKeyDown={handleKey}
            autoComplete="email"
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={setPassword}
            onKeyDown={handleKey}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 rounded-2xl text-lg font-bold text-white transition-colors"
        >
          {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null) }}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors text-center py-1"
        >
          {mode === 'signin'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}

function Input({
  placeholder,
  value,
  onChange,
  onKeyDown,
  type = 'text',
  autoComplete,
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  type?: string
  autoComplete?: string
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      autoComplete={autoComplete}
      className={[
        'w-full bg-slate-800 border border-slate-700 rounded-xl',
        'px-4 py-3 text-white placeholder-slate-600',
        'focus:outline-none focus:border-indigo-500 transition-colors',
      ].join(' ')}
    />
  )
}
