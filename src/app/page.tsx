'use client'

import { useState, useEffect } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getProfile, getGroupById, saveSessionToDb, signOut, Profile, Group } from '@/lib/db'
import { Settings, Attempt, SessionStats, DEFAULT_SETTINGS, computeStats } from '@/lib/math'
import { StreakResult, saveSession as saveLocalSession, saveGroupDailyRecord } from '@/lib/storage'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import ResultsScreen from './components/ResultsScreen'
import AuthScreen from './components/AuthScreen'
import GroupsScreen from './components/GroupsScreen'
import LeaderboardScreen from './components/LeaderboardScreen'
import BottomNav from './components/BottomNav'

type PlayScreen = 'home' | 'playing' | 'results'
type Tab = 'play' | 'groups'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const [tab, setTab] = useState<Tab>('play')
  const [playScreen, setPlayScreen] = useState<PlayScreen>('home')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [streakResult, setStreakResult] = useState<StreakResult | null>(null)
  const [gameKey, setGameKey] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  // null = practice, group.id = daily for that group
  const [dailyGroupId, setDailyGroupId] = useState<string | null>(null)
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null)

  // Read ?group= deep link on mount
  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get('group')
    if (g) setPendingGroupId(g)
  }, [])

  // When auth settles and we have a pending group, navigate to it
  useEffect(() => {
    if (!authReady || !session || !pendingGroupId) return
    setPendingGroupId(null)
    getGroupById(pendingGroupId).then(group => {
      if (group) { setSelectedGroup(group); setTab('groups') }
    }).catch(() => {})
  }, [authReady, session, pendingGroupId])

  // Auth listener
  useEffect(() => {
    if (!supabase) { setAuthReady(true); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) { setProfile(null); setSelectedGroup(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      getProfile(session.user.id).then(setProfile).catch(() => {})
    }
  }, [session])

  const handleGameEnd = async (attempts: Attempt[]) => {
    const computed = computeStats(attempts)
    const result = saveLocalSession(computed.score, settings.duration)

    if (dailyGroupId) {
      saveGroupDailyRecord(computed.score, settings.duration, dailyGroupId)
    }

    if (session) {
      saveSessionToDb(
        session.user.id,
        computed.score,
        settings.duration,
        dailyGroupId !== null,
        dailyGroupId,
      ).catch(() => {})
    }

    setStats(computed)
    setStreakResult(result)
    setPlayScreen('results')
  }

  // groupId = null means practice; a group ID means daily for that group
  const startGame = (groupId: string | null = null) => {
    setDailyGroupId(groupId)
    setGameKey(k => k + 1)
    setPlayScreen('playing')
  }

  const handleTabChange = (t: Tab) => {
    setTab(t)
    if (t === 'play') setPlayScreen('home')
    if (t === 'groups') setSelectedGroup(null)
  }

  const isPlaying = playScreen === 'playing'
  const showNav = !isPlaying

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-700 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className={showNav ? 'pb-20' : ''}>

        {/* Play tab */}
        {(tab === 'play' || isPlaying) && (
          <>
            {playScreen === 'home' && (
              <HomeScreen settings={settings} onChange={setSettings} onStart={() => startGame(null)} />
            )}
            {playScreen === 'playing' && (
              <GameScreen key={gameKey} settings={settings} onGameEnd={handleGameEnd} />
            )}
            {playScreen === 'results' && stats && streakResult && (
              <ResultsScreen
                stats={stats}
                streakResult={streakResult}
                duration={settings.duration}
                isDaily={dailyGroupId !== null}
                shareGroupId={dailyGroupId ?? undefined}
                onPlayAgain={() => startGame(null)}
                onSettings={() => setPlayScreen('home')}
                onViewLeaderboard={selectedGroup ? () => {
                  setTab('groups')
                  setPlayScreen('home')
                } : undefined}
              />
            )}
          </>
        )}

        {/* Groups tab */}
        {tab === 'groups' && !isPlaying && (
          !supabase ? (
            <NotConfigured />
          ) : !session ? (
            <AuthScreen onAuth={(s) => setSession(s)} />
          ) : selectedGroup ? (
            <LeaderboardScreen
              group={selectedGroup}
              onBack={() => setSelectedGroup(null)}
              onPlayDaily={(groupId) => {
                setTab('play')
                startGame(groupId)
              }}
            />
          ) : (
            <GroupsScreen
              userId={session.user.id}
              username={profile?.username ?? session.user.email ?? ''}
              onSelectGroup={setSelectedGroup}
              onSignOut={() => { signOut(); setSession(null) }}
            />
          )
        )}
      </div>

      {showNav && (
        <BottomNav tab={tab} onTabChange={handleTabChange} />
      )}
    </div>
  )
}

function NotConfigured() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-slate-950">
      <div className="text-5xl mb-4">🔧</div>
      <h2 className="text-xl font-bold text-white mb-2">Multiplayer not set up</h2>
      <p className="text-slate-500 text-sm leading-relaxed">
        Add your Supabase credentials to{' '}
        <span className="font-mono text-slate-400">.env.local</span> and run the schema in{' '}
        <span className="font-mono text-slate-400">supabase/schema.sql</span>.
      </p>
    </div>
  )
}
