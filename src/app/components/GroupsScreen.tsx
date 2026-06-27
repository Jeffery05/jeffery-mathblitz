'use client'

import { useState, useEffect, useCallback } from 'react'
import { Group, getUserGroups, createGroup, joinGroup, leaveGroup } from '@/lib/db'
import { signOut } from '@/lib/db'

interface Props {
  userId: string
  username: string
  onSelectGroup: (g: Group) => void
  onSignOut: () => void
}

export default function GroupsScreen({ userId, username, onSelectGroup, onSignOut }: Props) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<null | 'create' | 'join'>(null)
  const [inputValue, setInputValue] = useState('')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const loadGroups = useCallback(async () => {
    try {
      setGroups(await getUserGroups(userId))
    } catch {
      // silently fail — groups just stay empty
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { loadGroups() }, [loadGroups])

  const handleCreate = async () => {
    if (!inputValue.trim()) return
    setWorking(true)
    setError(null)
    try {
      const group = await createGroup(inputValue.trim(), userId)
      setGroups(prev => [...prev, group])
      setAction(null)
      setInputValue('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create group')
    } finally {
      setWorking(false)
    }
  }

  const handleJoin = async () => {
    if (!inputValue.trim()) return
    setWorking(true)
    setError(null)
    try {
      const group = await joinGroup(inputValue.trim(), userId)
      setGroups(prev => [...prev, group])
      setAction(null)
      setInputValue('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join group')
    } finally {
      setWorking(false)
    }
  }

  const handleLeave = async (groupId: string) => {
    if (!confirm('Leave this group?')) return
    await leaveGroup(groupId, userId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 px-4 py-6">
      <div className="w-full max-w-sm mx-auto flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Groups</h2>
            <p className="text-slate-500 text-sm">@{username}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-600 hover:text-slate-400 text-sm transition-colors px-3 py-1.5 rounded-lg bg-slate-900"
          >
            Sign out
          </button>
        </div>

        {/* Group list */}
        {loading ? (
          <p className="text-slate-600 text-center py-8">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-slate-600 text-center py-8">
            No groups yet — create one or join with a code.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map(group => (
              <div key={group.id} className="bg-slate-900 rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-bold text-lg">{group.name}</p>
                    <button
                      onClick={() => copyCode(group.invite_code)}
                      className="flex items-center gap-1.5 mt-1 text-slate-500 hover:text-slate-300 transition-colors text-sm"
                    >
                      <span className="font-mono tracking-wider">{group.invite_code}</span>
                      <span>{copied === group.invite_code ? '✓' : '📋'}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handleLeave(group.id)}
                    className="text-slate-700 hover:text-red-400 text-xs transition-colors ml-2 mt-0.5"
                  >
                    Leave
                  </button>
                </div>
                <button
                  onClick={() => onSelectGroup(group)}
                  className="mt-3 w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400 text-sm font-medium transition-colors"
                >
                  View Leaderboard →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        {/* Inline action form */}
        {action && (
          <div className="bg-slate-900 rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-white font-medium">
              {action === 'create' ? 'Group name' : 'Invite code'}
            </p>
            <input
              type="text"
              autoFocus
              placeholder={action === 'create' ? 'e.g. Study group' : 'e.g. ABC123'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (action === 'create' ? handleCreate() : handleJoin())}
              className={[
                'w-full bg-slate-800 border border-slate-700 rounded-xl',
                'px-4 py-3 text-white placeholder-slate-600',
                'focus:outline-none focus:border-indigo-500 transition-colors',
                action === 'join' ? 'uppercase tracking-widest' : '',
              ].join(' ')}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setAction(null); setInputValue(''); setError(null) }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={action === 'create' ? handleCreate : handleJoin}
                disabled={working || !inputValue.trim()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-white text-sm font-medium transition-colors"
              >
                {working ? '...' : action === 'create' ? 'Create' : 'Join'}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!action && (
          <div className="flex gap-3">
            <button
              onClick={() => { setAction('create'); setError(null) }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white font-bold transition-colors"
            >
              + Create
            </button>
            <button
              onClick={() => { setAction('join'); setError(null) }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 font-bold transition-colors"
            >
              ↗ Join
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
