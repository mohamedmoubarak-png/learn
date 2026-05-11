import { ArrowRight, Database, Flame } from 'lucide-react'
import { useState } from 'react'
import ScreenshotViewer from '../components/ScreenshotViewer'
import firebaseStepsJson from '../data/firebase-steps.json'
import supabaseStepsJson from '../data/supabase-steps.json'
import type { GuideStep } from '../types'

interface BackendGuideProps {
  onBack: () => void
}

const supabaseSteps = supabaseStepsJson as GuideStep[]
const firebaseSteps = firebaseStepsJson as GuideStep[]

const BackendGuide = ({ onBack }: BackendGuideProps) => {
  const [tab, setTab] = useState<'supabase' | 'firebase'>('supabase')
  const steps = tab === 'supabase' ? supabaseSteps : firebaseSteps

  return (
    <main className="min-h-screen bg-[#F7FBFF] px-4 py-5 text-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-4 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
          <button
            className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            type="button"
            onClick={onBack}
          >
            <ArrowRight className="h-4 w-4" />
            رجوع للدروس
          </button>
          <h1 className="text-3xl font-black">دليل الأدوات</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            هذا القسم اختياري. استخدمه فقط عندما تريد ربط مشروع React بخدمة خارجية.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1">
            <button
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-black ${
                tab === 'supabase' ? 'bg-sky-500 text-white' : 'text-slate-600'
              }`}
              type="button"
              onClick={() => setTab('supabase')}
            >
              <Database className="h-5 w-5" />
              Supabase
            </button>
            <button
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-black ${
                tab === 'firebase' ? 'bg-rose-500 text-white' : 'text-slate-600'
              }`}
              type="button"
              onClick={() => setTab('firebase')}
            >
              <Flame className="h-5 w-5" />
              Firebase
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <article key={step.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <ScreenshotViewer image={step.image} title={step.title} />
              <h2 className="mt-4 text-xl font-black">{step.title}</h2>
              <div className="mt-2 space-y-1 text-sm leading-6 text-slate-600">
                {step.description.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              {step.code ? (
                <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-900 p-3 text-left text-xs text-sky-100" dir="ltr">
                  <code>{step.code}</code>
                </pre>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export default BackendGuide
