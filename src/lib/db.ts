import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface Profile {
  id: string
  username: string
}

export interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
}

export interface LeaderboardEntry {
  username: string
  best_score: number
  session_count: number
}

function client() {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

function randomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, username: string): Promise<Session> {
  const db = client()
  const { data, error } = await db.auth.signUp({ email, password })
  if (error) throw error
  if (!data.user) throw new Error('Sign up failed')

  const { error: profileError } = await db
    .from('profiles')
    .insert({ id: data.user.id, username })
  if (profileError) throw new Error(profileError.message)

  if (!data.session) throw new Error('Check your email to confirm your account')
  return data.session
}

export async function signIn(email: string, password: string): Promise<Session> {
  const { data, error } = await client().auth.signInWithPassword({ email, password })
  if (error) throw error
  if (!data.session) throw new Error('Sign in failed')
  return data.session
}

export async function signOut() {
  await client().auth.signOut()
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await client()
    .from('profiles')
    .select('id, username')
    .eq('id', userId)
    .single()
  return data
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export async function createGroup(name: string, userId: string): Promise<Group> {
  const db = client()
  const { data: group, error } = await db
    .from('groups')
    .insert({ name, invite_code: randomCode(), created_by: userId })
    .select()
    .single()
  if (error) throw new Error(error.message)

  await db.from('group_members').insert({ group_id: group.id, user_id: userId })
  return group
}

export async function joinGroup(inviteCode: string, userId: string): Promise<Group> {
  const db = client()
  const { data: group, error: findError } = await db
    .from('groups')
    .select()
    .eq('invite_code', inviteCode.toUpperCase().trim())
    .single()
  if (findError || !group) throw new Error('Invalid invite code')

  const { error: joinError } = await db
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId })
  if (joinError) {
    if (joinError.code === '23505') throw new Error('Already in this group')
    throw joinError
  }
  return group
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const { data } = await client()
    .from('groups')
    .select('id, name, invite_code, created_by')
    .eq('id', groupId)
    .single()
  return data ?? null
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  const { data, error } = await client()
    .from('group_members')
    .select('groups(id, name, invite_code, created_by)')
    .eq('user_id', userId)
  if (error) throw error
  return (data ?? [])
    .map((row: Record<string, unknown>) => row.groups as Group)
    .filter(Boolean)
}

export async function leaveGroup(groupId: string, userId: string) {
  await client()
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export async function getLeaderboard(groupId: string, duration: number): Promise<LeaderboardEntry[]> {
  const { data, error } = await client().rpc('get_leaderboard', {
    p_group_id: groupId,
    p_duration: duration,
  })
  if (error) throw error
  return data ?? []
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function saveSessionToDb(
  userId: string,
  score: number,
  duration: number,
  isDaily: boolean,
  groupId?: string | null,
) {
  await client()
    .from('sessions')
    .insert({ user_id: userId, score, duration, is_daily: isDaily, group_id: groupId ?? null })
}
