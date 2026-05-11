import modulesJson from '../data/modules.json'
import type { Badge, Challenge, CompletionResult, LearningModule, UserProfile } from '../types'

export const modules = modulesJson as LearningModule[]

export const getAllChallenges = () => modules.flatMap((module) => module.challenges)

export const findNextChallenge = (profile: UserProfile): Challenge =>
  getAllChallenges().find((challenge) => !profile.completedChallengeIds.includes(challenge.id)) ??
  modules[0].challenges[0]

export const getVisibleChallenges = (profile: UserProfile): Challenge[] => {
  const all = getAllChallenges()
  const nextIndex = all.findIndex((challenge) => !profile.completedChallengeIds.includes(challenge.id))
  const startIndex = Math.max(nextIndex === -1 ? all.length - 3 : nextIndex, 0)
  return all.slice(startIndex, startIndex + 3)
}

export const getRecommendedChallenges = (profile: UserProfile): Challenge[] => {
  const next = findNextChallenge(profile)
  const reactModule = modules.find((module) => module.id === next.moduleId) ?? modules[0]
  return reactModule.challenges.slice(0, 3)
}

export const getProgressPercent = (profile: UserProfile): number => {
  const completedBoost = profile.completedChallengeIds.length * 5
  return Math.min(15 + completedBoost, 95)
}

export const validateChallenge = (challenge: Challenge, code: string): CompletionResult => {
  const normalizedCode = code.toLowerCase()
  const success = challenge.solutionKeywords.every((keyword) =>
    normalizedCode.includes(keyword.toLowerCase()),
  )

  if (!success) {
    return {
      success: false,
      message: `تقريباً! راجع السطر ${challenge.hintLine} وخذ نفساً صغيراً.`,
      xpGained: 0,
    }
  }

  return {
    success: true,
    message: 'ممتاز! فهمت الفكرة ونفذتها بنفسك.',
    xpGained: challenge.xpReward,
  }
}

export const completeChallenge = (
  profile: UserProfile,
  challenge: Challenge,
  code: string,
): { profile: UserProfile; result: CompletionResult } => {
  const result = validateChallenge(challenge, code)
  if (!result.success || profile.completedChallengeIds.includes(challenge.id)) {
    return { profile, result }
  }

  const module = modules.find((item) => item.id === challenge.moduleId)
  const completedChallengeIds = [...profile.completedChallengeIds, challenge.id]
  const moduleCompleted =
    module?.challenges.every((item) => completedChallengeIds.includes(item.id)) ?? false
  const alreadyHasBadge = profile.badges.some((badge) => badge.moduleId === challenge.moduleId)
  const badge: Badge | undefined =
    moduleCompleted && module && !alreadyHasBadge
      ? {
          id: `${module.id}-${Date.now()}`,
          name: module.badge,
          moduleId: module.id,
          earnedAt: new Date().toISOString(),
        }
      : undefined

  const bonusXp = completedChallengeIds.length % 3 === 0 ? 15 : 0
  const nextProfile: UserProfile = {
    ...profile,
    xp: profile.xp + result.xpGained + bonusXp,
    streak: profile.streak + 1,
    completedChallengeIds,
    badges: badge ? [...profile.badges, badge] : profile.badges,
    lastActiveAt: new Date().toISOString(),
  }

  return {
    profile: nextProfile,
    result: {
      ...result,
      message: bonusXp > 0 ? 'جميل! أنهيت ثلاث خطوات وحصلت على XP إضافي.' : result.message,
      xpGained: result.xpGained + bonusXp,
      badge,
    },
  }
}
