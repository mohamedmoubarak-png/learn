import { Brain, Clock, Rocket, Target } from 'lucide-react'
import { useState } from 'react'
import type { DailyCommitment, GoalId } from '../types'

interface OnboardingProps {
  onComplete: (goal: GoalId, commitment: DailyCommitment) => void
}

const goals: Array<{ id: GoalId; label: string; icon: typeof Target }> = [
  { id: 'job', label: 'أريد وظيفة في التقنية', icon: Target },
  { id: 'project', label: 'أريد بناء مشروعي الخاص', icon: Rocket },
  { id: 'tech', label: 'أريد فهم عالم التقنية', icon: Brain },
]

const commitments: Array<{ id: DailyCommitment; label: string }> = [
  { id: '10', label: '10 دقائق' },
  { id: '20', label: '20 دقيقة' },
  { id: '30', label: '30 دقيقة+' },
]

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [goal, setGoal] = useState<GoalId | null>(null)

  return (
    <main className="flex min-h-screen w-screen items-center justify-center overflow-hidden bg-[#F7FBFF] px-4 py-8 text-slate-900 grid-bg" dir="ltr">
      <section
        className="rounded-2xl border border-sky-100 bg-white p-5 text-right shadow-sm"
        dir="rtl"
        style={{ width: 'min(100%, 23rem)' }}
      >
        <div className="mb-5">
          <p className="text-sm font-black text-sky-600">{goal ? 'الخطوة 2 من 2' : 'الخطوة 1 من 2'}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight">
            {goal ? 'كم دقيقة يومياً؟' : 'ماذا تريد أن تتعلم؟'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            كل دروس React مفتوحة. اختر ما يناسبك وابدأ بخفة.
          </p>
        </div>

        {!goal ? (
          <div className="space-y-3">
            {goals.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-right transition hover:border-sky-200 hover:bg-white"
                  type="button"
                  onClick={() => setGoal(item.id)}
                >
                  <Icon className="h-6 w-6 shrink-0 text-sky-500" />
                  <span className="font-black">{item.label}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="grid gap-3">
            {commitments.map((item) => (
              <button
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-rose-200 hover:bg-white"
                type="button"
                onClick={() => onComplete(goal, item.id)}
              >
                <span className="font-black">{item.label}</span>
                <Clock className="h-5 w-5 text-rose-500" />
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default Onboarding
