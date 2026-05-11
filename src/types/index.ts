export type GoalId = 'job' | 'project' | 'tech'

export type DailyCommitment = '10' | '20' | '30'

export type Screen = 'onboarding' | 'dashboard' | 'challenge' | 'guide'

export interface Challenge {
  id: string
  moduleId: string
  title: string
  concept: string
  lesson: string
  task: string
  steps: string[]
  description: string[]
  socialProof: string
  starterCode: string
  solutionCode: string
  solutionKeywords: string[]
  hintLine: number
  xpReward: number
  difficulty: string
}

export interface LearningModule {
  id: string
  title: string
  subtitle: string
  badge: string
  accent: string
  challenges: Challenge[]
}

export interface GuideStep {
  id: string
  title: string
  image: string
  description: string[]
  code?: string
}

export interface Badge {
  id: string
  name: string
  moduleId: string
  earnedAt: string
}

export interface UserProfile {
  id: string
  name: string
  goal: GoalId
  dailyCommitment: DailyCommitment
  xp: number
  streak: number
  completedChallengeIds: string[]
  badges: Badge[]
  lastActiveAt: string
}

export interface CompletionResult {
  success: boolean
  message: string
  xpGained: number
  badge?: Badge
}
