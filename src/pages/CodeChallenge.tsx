import { ArrowRight, CheckCircle2, Eye, Play, RotateCcw, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import CelebrationAnimation from '../components/CelebrationAnimation'
import { completeChallenge } from '../hooks/useProgress'
import type { Challenge, CompletionResult, UserProfile } from '../types'

interface CodeChallengeProps {
  challenge: Challenge
  profile: UserProfile
  onBack: () => void
  onProfileUpdate: (profile: UserProfile) => void
  onNext: (profile: UserProfile) => void
}

const CodeChallenge = ({
  challenge,
  profile,
  onBack,
  onProfileUpdate,
  onNext,
}: CodeChallengeProps) => {
  const [code, setCode] = useState(challenge.starterCode)
  const [result, setResult] = useState<CompletionResult | null>(null)
  const [nextProfile, setNextProfile] = useState<UserProfile | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  const [shake, setShake] = useState(false)

  const runChallenge = () => {
    const completion = completeChallenge(profile, challenge, code)
    setResult(completion.result)

    if (!completion.result.success) {
      setShake(true)
      window.setTimeout(() => setShake(false), 450)
      return
    }

    onProfileUpdate(completion.profile)
    setNextProfile(completion.profile)
  }

  const resetCode = () => {
    setCode(challenge.starterCode)
    setResult(null)
    setShowSolution(false)
  }

  const revealSolution = () => {
    setCode(challenge.solutionCode)
    setShowSolution(true)
  }

  const isDone = result?.success ?? profile.completedChallengeIds.includes(challenge.id)

  return (
    <main className="min-h-screen bg-[#F7FBFF] px-4 py-5 text-slate-900">
      <CelebrationAnimation
        show={Boolean(result?.success)}
        xpGained={result?.xpGained ?? 0}
        message={result?.message ?? ''}
      />
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section
          className={`rounded-2xl border border-sky-100 bg-white p-4 shadow-sm ${
            shake ? 'animate-pulse border-rose-300' : ''
          }`}
        >
          <button
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            type="button"
            onClick={onBack}
          >
            <ArrowRight className="h-4 w-4" />
            رجوع للدروس
          </button>

          <p className="text-sm font-bold text-sky-600">{challenge.concept}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight">{challenge.title}</h1>
          <p className="mt-3 rounded-2xl bg-sky-50 p-3 text-sm leading-7 text-sky-950">
            {challenge.lesson}
          </p>

          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <h2 className="font-black text-amber-900">ماذا أكتب؟</h2>
            <p className="mt-1 text-sm leading-7 text-amber-900">{challenge.task}</p>
          </div>

          <div className="mt-4">
            <h2 className="font-black">خطوات التنفيذ</h2>
            <ol className="mt-2 space-y-2">
              {challenge.steps.map((step, index) => (
                <li key={step} className="flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-500 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {result && !result.success ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-3 text-rose-900">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <p className="text-sm">{result.message}</p>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-black text-slate-700">اكتب الكود هنا</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {challenge.difficulty}
            </span>
          </div>

          <textarea
            className="min-h-[330px] w-full resize-y border-0 bg-[#FFFDF7] p-4 font-mono text-sm leading-7 text-slate-900 outline-none"
            dir="ltr"
            spellCheck={false}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-label="محرر الكود"
          />

          {showSolution ? (
            <div className="mx-4 mb-3 rounded-2xl bg-emerald-50 p-3 text-sm leading-7 text-emerald-900">
              لا تحفظ الحل فقط. اقرأ السطر الذي تغيّر، ثم اعد كتابته بيدك مرة واحدة.
            </div>
          ) : null}

          <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-4 py-3 font-black text-white shadow-sm"
              type="button"
              onClick={runChallenge}
            >
              <Play className="h-5 w-5" />
              تحقق من فهمي
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 font-bold text-amber-900"
              type="button"
              onClick={revealSolution}
            >
              <Eye className="h-5 w-5" />
              أرني الحل
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-600"
              type="button"
              onClick={resetCode}
            >
              <RotateCcw className="h-5 w-5" />
              ابدأ من جديد
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bold text-emerald-900 disabled:opacity-50"
              type="button"
              disabled={!isDone}
              onClick={() => onNext(nextProfile ?? profile)}
            >
              <CheckCircle2 className="h-5 w-5" />
              الدرس التالي
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

export default CodeChallenge
