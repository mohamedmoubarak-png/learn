import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const modulesPath = resolve(__dirname, '../../src/data/modules.json')

export const modules = JSON.parse(readFileSync(modulesPath, 'utf8'))

export const users = [
  {
    id: 'local-ahmed',
    name: 'أحمد',
    email: 'ahmed@example.com',
    xp: 50,
    streak: 1,
    completedChallengeIds: [],
    badges: [],
  },
]

export const getAllChallenges = () => modules.flatMap((module) => module.challenges)

export const findChallenge = (challengeId) =>
  getAllChallenges().find((challenge) => challenge.id === challengeId)

export const getOrCreateUser = (userId) => {
  let user = users.find((item) => item.id === userId)
  if (!user) {
    user = {
      id: userId,
      name: 'مطور جديد',
      email: `${userId}@local.dev`,
      xp: 50,
      streak: 1,
      completedChallengeIds: [],
      badges: [],
    }
    users.push(user)
  }
  return user
}
