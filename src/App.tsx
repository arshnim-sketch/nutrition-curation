import { AppProvider, useAppContext } from './store/AppContext'
import Home from './pages/Home'
import ProfileSetup from './pages/ProfileSetup'
import SymptomPage from './pages/SymptomPage'
import CurationResult from './pages/CurationResult'
import type { FamilyMember } from './types'
import { useState } from 'react'

type Page = 'home' | 'setup' | 'symptoms' | 'result'

function AppInner() {
  const { state } = useAppContext()
  const [page, setPage] = useState<Page>('home')

  const profile = state.members[0] ?? null

  // 프로필 없으면 무조건 setup
  if (!profile || page === 'setup') {
    return (
      <ProfileSetup
        editingMember={profile}
        onBack={profile ? () => setPage('home') : undefined}
        onSave={() => setPage('home')}
      />
    )
  }

  const latestProfile = state.members.find(m => m.id === profile.id) ?? profile

  if (page === 'symptoms') {
    return (
      <SymptomPage
        member={latestProfile}
        onBack={() => setPage('home')}
        onResult={() => setPage('result')}
      />
    )
  }

  if (page === 'result') {
    return (
      <CurationResult
        member={latestProfile}
        onBack={() => setPage('home')}
        onReselect={() => setPage('symptoms')}
      />
    )
  }

  return (
    <Home
      member={latestProfile}
      hasCuration={!!state.curationResults[latestProfile.id]}
      onEditProfile={() => setPage('setup')}
      onStartAnalysis={() => setPage('symptoms')}
      onViewResult={() => setPage('result')}
    />
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
