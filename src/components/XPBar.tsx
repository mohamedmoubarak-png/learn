import { Flame, Zap } from 'lucide-react'

interface XPBarProps {
  xp: number
  percent: number
  streak: number
}

const XPBar = ({ xp, percent, streak }: XPBarProps) => (
  <div className="rounded-2xl border border-sky-100 bg-sky-50 p-3">
    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-1 font-black text-sky-700">
        <Zap className="h-4 w-4" />
        {xp} XP
      </span>
      <span className="inline-flex items-center gap-1 font-bold text-rose-600">
        <Flame className="h-4 w-4" />
        {streak} يوم
      </span>
    </div>
    <div className="h-3 overflow-hidden rounded-full bg-white">
      <div
        className="h-full rounded-full bg-gradient-to-l from-sky-400 via-emerald-300 to-amber-300 transition-all duration-500"
        style={{ width: `${percent}%` }}
        aria-label={`التقدم ${percent}%`}
      />
    </div>
  </div>
)

export default XPBar
