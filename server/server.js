import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/auth.js'
import challengesRoutes from './routes/challenges.js'
import progressRoutes from './routes/progress.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT ?? 4000)

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'gamified-coding-platform' })
})

app.use('/api/auth', authRoutes)
app.use('/api/challenges', challengesRoutes)
app.use('/api/challenge', challengesRoutes)
app.use('/api', progressRoutes)

app.use((_req, res) => {
  res.status(404).json({ message: 'المسار غير متاح حالياً.' })
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'حدث خلل بسيط. حاول مرة أخرى.' })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API ready on http://localhost:${port}`)
  })
}

export default app
