import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { users } from '../data/mockData.js'

const router = Router()

/*
POST /api/auth/signup
Request: { "name": "أحمد", "email": "a@test.com", "password": "secret" }
Response: { "user": { ... }, "token": "mock-token" }
*/
router.post('/signup', (req, res) => {
  const { name = 'أحمد', email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'أكمل البيانات البسيطة أولاً.' })
  }

  const user = {
    id: randomUUID(),
    name,
    email,
    xp: 50,
    streak: 1,
    completedChallengeIds: [],
    badges: [],
  }
  users.push(user)

  return res.status(201).json({ user, token: `mock-${user.id}` })
})

/*
POST /api/auth/login
Request: { "email": "a@test.com", "password": "secret" }
Response: { "user": { ... }, "token": "mock-token" }
*/
router.post('/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'أدخل البريد وكلمة المرور.' })
  }

  const user = users.find((item) => item.email === email) ?? users[0]
  return res.json({ user, token: `mock-${user.id}` })
})

export default router
