import { useState } from 'react'
import { AppProvider, useAppContext } from './store/AppContext'
import Home from './pages/Home'
import ProfileSetup from './pages/ProfileSetup'
import SymptomPage from './pages/SymptomPage'
import CurationResult from './pages/CurationResult'
import type { FamilyMember } from './types'

type Page = 'home' | 'setup' | 'symptoms' | 'result'

function AppInner() {
  const [page, setPage] = useState<Page>('home')
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const { state } = useAppContext()

  function goHome() {
    setPage('home')
    setSelectedMember(null)
    setEditingMember(null)
  }

  function handleAddMember() {
    setEditingMember(null)
    setPage('setup')
  }

  function handleEditMember(member: FamilyMember) {
    setEditingMember(member)
    setPage('setup')
  }

  function handleCuration(member: FamilyMember) {
    // 이미 큐레이션 결과가 있으면 결과 페이지로
    if (state.curationResults[member.id]) {
      setSelectedMember(member)
      setPage('result')
    } else {
      setSelectedMember(member)
      setPage('symptoms')
    }
  }

  function handleProfileSaved(member: FamilyMember) {
    setSelectedMember(member)
    setEditingMember(null)
    // 신규 추가면 증상 선택으로, 수정이면 홈으로
    if (!editingMember) {
      setPage('symptoms')
    } else {
      setPage('home')
    }
  }

  if (page === 'setup') {
    return (
      <ProfileSetup
        editingMember={editingMember}
        onBack={goHome}
        onSave={handleProfileSaved}
      />
    )
  }

  if (page === 'symptoms' && selectedMember) {
    // 최신 멤버 데이터 가져오기
    const latestMember = state.members.find(m => m.id === selectedMember.id) ?? selectedMember
    return (
      <SymptomPage
        member={latestMember}
        onBack={goHome}
        onResult={() => setPage('result')}
      />
    )
  }

  if (page === 'result' && selectedMember) {
    const latestMember = state.members.find(m => m.id === selectedMember.id) ?? selectedMember
    return (
      <CurationResult
        member={latestMember}
        onBack={goHome}
        onReselect={() => setPage('symptoms')}
      />
    )
  }

  return (
    <Home
      onAddMember={handleAddMember}
      onEditMember={handleEditMember}
      onCuration={handleCuration}
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
