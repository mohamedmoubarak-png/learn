import { Medal } from 'lucide-react'
import type { Badge } from '../types'

interface BadgeCardProps {
  badge: Badge
}

const BadgeCard = ({ badge }: BadgeCardProps) => (
  <article className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-right">
    <div className="flex items-center gap-2 text-amber-900">
      <Medal className="h-5 w-5 text-amber-500" />
      <h3 className="text-sm font-black">{badge.name}</h3>
    </div>
    <p className="mt-1 text-xs text-amber-700">
      {new Date(badge.earnedAt).toLocaleDateString('ar-EG')}
    </p>
  </article>
)

export default BadgeCard
