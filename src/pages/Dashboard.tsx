import { BookOpen, ChevronLeft, Code2, RotateCcw, Sparkles } from 'lucide-react'
import BadgeCard from '../components/BadgeCard'
import XPBar from '../components/XPBar'
import { findNextChallenge, getProgressPercent, modules } from '../hooks/useProgress'
import type { Challenge, UserProfile } from '../types'

interface DashboardProps {
  profile: UserProfile
  onOpenChallenge: (challenge?: Challenge) => void
  onOpenGuide: () => void
  onReset: () => void
}

const Dashboard = ({ profile, onOpenChallenge, onOpenGuide, onReset }: DashboardProps) => {
  const progressPercent = getProgressPercent(profile)
  const recommended = findNextChallenge(profile)

  return (
    <main className="min-h-screen bg-[#F7FBFF] px-4 py-5 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-xl font-black text-sky-700">
              أ
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-black">مرحباً يا {profile.name}</p>
              <p className="text-sm text-slate-500">اختر أي درس تريده. كل شيء مفتوح.</p>
            </div>
            <button
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500"
              type="button"
              onClick={onReset}
              aria-label="إعادة البداية"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4">
            <XPBar xp={profile.xp} percent={progressPercent} streak={profile.streak} />
          </div>
        </header>

        <section className="rounded-2xl bg-gradient-to-l from-sky-100 via-rose-50 to-amber-50 p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-bold text-sky-700">
                <Sparkles className="h-4 w-4" />
                تركيز اليوم: React
              </p>
              <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                تعلّم بفهم، خطوة صغيرة في كل مرة.
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                كل تحدي يحتوي شرحاً، خطوات تنفيذ، وحلاً يمكنك إظهاره عند الحاجة.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 font-black text-white shadow-sm"
              type="button"
              onClick={() => onOpenChallenge(recommended)}
            >
              ابدأ الدرس المقترح
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {modules.map((module) => (
              <article key={module.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-2xl text-white"
                    style={{ backgroundColor: module.accent }}
                  >
                    <Code2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black">{module.title}</h2>
                    <p className="text-sm text-slate-500">{module.subtitle}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {module.challenges.map((challenge) => {
                    const completed = profile.completedChallengeIds.includes(challenge.id)
                    return (
                      <button
                        key={challenge.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-right transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-sm"
                        type="button"
                        onClick={() => onOpenChallenge(challenge)}
                      >
                        <span className="text-xs font-bold text-sky-600">{challenge.concept}</span>
                        <span className="mt-1 block text-lg font-black">{challenge.title}</span>
                        <span className="mt-2 block text-sm leading-6 text-slate-600">{challenge.task}</span>
                        <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                          {completed ? 'تم التعلم' : 'مفتوح الآن'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>

          <aside className="space-y-3">
            <button
              className="flex w-full items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-right text-emerald-900"
              type="button"
              onClick={onOpenGuide}
            >
              <BookOpen className="h-6 w-6 text-emerald-600" />
              <span>
                <span className="block font-black">دليل الأدوات</span>
                <span className="block text-sm text-emerald-700">اختياري وخفيف</span>
              </span>
            </button>
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-black">الشارات</h2>
              {profile.badges.length ? (
                <div className="grid gap-2">
                  {profile.badges.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-500">ستظهر الشارات هنا بعد إكمال دروس قصيرة.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
