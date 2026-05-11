import { useMemo, useState } from 'react'
import type { DailyCommitment, GoalId, UserProfile } from '../types'

const authKey = 'learn-fun-auth'

const createProfile = (goal: GoalId, dailyCommitment: DailyCommitment): UserProfile => ({
  id: 'local-ahmed',
  name: 'أحمد',
  goal,
  dailyCommitment,
  xp: 50,
  streak: 1,
  completedChallengeIds: [],
  badges: [],
  lastActiveAt: new Date().toISOString(),
})

const readProfile = (): UserProfile | null => {
  const raw = localStorage.getItem(authKey)
  if (!raw) return null
  return JSON.parse(raw) as UserProfile
}

export const useAuth = () => {
  const [profile, setProfile] = useState<UserProfile | null>(() => readProfile())

  const isOnboarded = Boolean(profile)

  const start = (goal: GoalId, dailyCommitment: DailyCommitment) => {
    const nextProfile = createProfile(goal, dailyCommitment)
    localStorage.setItem(authKey, JSON.stringify(nextProfile))
    setProfile(nextProfile)
  }

  const updateProfile = (nextProfile: UserProfile) => {
    localStorage.setItem(authKey, JSON.stringify(nextProfile))
    setProfile(nextProfile)
  }

  const reset = () => {
    localStorage.removeItem(authKey)
    setProfile(null)
  }

  return useMemo(
    () => ({ profile, isOnboarded, start, updateProfile, reset }),
    [profile, isOnboarded],
  )
}
