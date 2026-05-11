import { AnimatePresence, motion } from 'framer-motion'
import { Trophy } from 'lucide-react'

interface CelebrationAnimationProps {
  show: boolean
  xpGained: number
  message: string
}

const sparks = ['top-4 right-8', 'top-10 left-8', 'bottom-8 right-12', 'bottom-5 left-12']

const CelebrationAnimation = ({ show, xpGained, message }: CelebrationAnimationProps) => (
  <AnimatePresence>
    {show ? (
      <motion.div
        className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-xs rounded-2xl border border-amber-100 bg-white p-5 text-center shadow-xl"
          initial={{ scale: 0.82, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 16 }}
        >
          {sparks.map((position) => (
            <motion.span
              key={position}
              className={`absolute h-3 w-3 rounded-sm bg-amber-300 ${position}`}
              animate={{ y: [-8, 8, -8], rotate: [0, 180, 360] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          ))}
          <Trophy className="mx-auto h-10 w-10 text-amber-500" />
          <p className="mt-3 text-2xl font-black text-slate-900">+{xpGained} XP</p>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
)

export default CelebrationAnimation
