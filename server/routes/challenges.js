import { Router } from 'express'
import { findChallenge, modules } from '../data/mockData.js'

const router = Router()

/*
POST /api/challenge/validate
Request: { "challengeId": "tailwind-1", "code": "bg-blue-500" }
Response: { "success": true, "xpGained": 25, "message": "..." }
*/
router.post('/validate', (req, res) => {
  const { challengeId, code = '' } = req.body
  const challenge = findChallenge(challengeId)

  if (!challenge) {
    return res.status(404).json({ message: 'هذا التحدي غير متاح الآن.' })
  }

  const normalizedCode = String(code).toLowerCase()
  const success = challenge.solutionKeywords.every((keyword) =>
    normalizedCode.includes(String(keyword).toLowerCase()),
  )

  if (!success) {
    return res.json({
      success: false,
      xpGained: 0,
      hintLine: challenge.hintLine,
      message: `تقريباً! راجع السطر ${challenge.hintLine}.`,
    })
  }

  return res.json({
    success: true,
    xpGained: challenge.xpReward,
    message: 'نجحت! خطوة صغيرة صنعت فرقاً.',
  })
})

/*
GET /api/challenges/:moduleId
Request: /api/challenges/tailwind
Response: { "module": { ... }, "challenges": [ ... ] }
*/
router.get('/:moduleId', (req, res) => {
  const module = modules.find((item) => item.id === req.params.moduleId)
  if (!module) {
    return res.status(404).json({ message: 'هذه الوحدة غير متاحة الآن.' })
  }

  return res.json({ module, challenges: module.challenges })
})

export default router
