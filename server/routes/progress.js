import { Router } from 'express'
import { getOrCreateUser, users } from '../data/mockData.js'

const router = Router()

/*
GET /api/user/:id/progress
Request: /api/user/local-ahmed/progress
Response: { "xp": 50, "streak": 1, "completedChallengeIds": [] }
*/
router.get('/user/:id/progress', (req, res) => {
  const user = getOrCreateUser(req.params.id)
  return res.json({
    xp: user.xp,
    streak: user.streak,
    completedChallengeIds: user.completedChallengeIds,
    badges: user.badges,
  })
})

/*
POST /api/user/:id/xp
Request: { "amount": 25, "challengeId": "tailwind-1" }
Response: { "xp": 75, "completedChallengeIds": ["tailwind-1"] }
*/
router.post('/user/:id/xp', (req, res) => {
  const user = getOrCreateUser(req.params.id)
  const amount = Number(req.body.amount ?? 0)
  const challengeId = req.body.challengeId

  user.xp += Number.isFinite(amount) ? amount : 0
  user.streak += 1
  if (challengeId && !user.completedChallengeIds.includes(challengeId)) {
    user.completedChallengeIds.push(challengeId)
  }

  return res.json({
    xp: user.xp,
    streak: user.streak,
    completedChallengeIds: user.completedChallengeIds,
  })
})

/*
POST /api/user/:id/badge
Request: { "badgeName": "مصمم مبتدئ", "moduleId": "tailwind" }
Response: { "badge": { ... } }
*/
router.post('/user/:id/badge', (req, res) => {
  const user = getOrCreateUser(req.params.id)
  const badge = {
    id: `${req.params.id}-${Date.now()}`,
    name: req.body.badgeName ?? 'شارة جديدة',
    moduleId: req.body.moduleId ?? 'general',
    earnedAt: new Date().toISOString(),
  }
  user.badges.push(badge)
  return res.status(201).json({ badge })
})

/*
GET /api/leaderboard
Request: /api/leaderboard
Response: { "leaders": [{ "name": "أحمد", "xp": 50 }] }
*/
router.get('/leaderboard', (_req, res) => {
  const leaders = [...users]
    .sort((first, second) => second.xp - first.xp)
    .slice(0, 10)
    .map(({ id, name, xp, streak }) => ({ id, name, xp, streak }))

  return res.json({ leaders })
})

export default router
