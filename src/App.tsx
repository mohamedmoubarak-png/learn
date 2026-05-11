import BackendGuide from './pages/BackendGuide'
import CodeChallenge from './pages/CodeChallenge'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import { findNextChallenge } from './hooks/useProgress'
import { useAuth } from './hooks/useAuth'
import type { Challenge, Screen, UserProfile } from './types'
import { useState } from 'react'

const App = () => {
  const { profile, isOnboarded, start, updateProfile, reset } = useAuth()
  const [screen, setScreen] = useState<Screen>(isOnboarded ? 'dashboard' : 'onboarding')
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null)

  if (!profile) {
    return (
      <Onboarding
        onComplete={(goal, commitment) => {
          start(goal, commitment)
          setScreen('dashboard')
        }}
      />
    )
  }

  const openChallenge = (challenge?: Challenge) => {
    setActiveChallenge(challenge ?? findNextChallenge(profile))
    setScreen('challenge')
  }

  const openNext = (nextProfile: UserProfile) => {
    setActiveChallenge(findNextChallenge(nextProfile))
    setScreen('challenge')
  }

  if (screen === 'guide') {
    return <BackendGuide onBack={() => setScreen('dashboard')} />
  }

  if (screen === 'challenge' && activeChallenge) {
    return (
      <CodeChallenge
        key={activeChallenge.id}
        challenge={activeChallenge}
        profile={profile}
        onBack={() => setScreen('dashboard')}
        onProfileUpdate={updateProfile}
        onNext={openNext}
      />
    )
  }

  return (
    <Dashboard
      profile={profile}
      onOpenChallenge={openChallenge}
      onOpenGuide={() => setScreen('guide')}
      onReset={() => {
        reset()
        setScreen('onboarding')
      }}
    />
  )
}

export default App
