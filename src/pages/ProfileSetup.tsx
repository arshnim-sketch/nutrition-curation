import { useState } from 'react'
import { useAppContext } from '../store/AppContext'
import type { FamilyMember } from '../types'

interface Props {
  editingMember?: FamilyMember | null
  onBack?: () => void
  onSave: (member: FamilyMember) => void
}

export default function ProfileSetup({ editingMember, onBack, onSave }: Props) {
  const { dispatch } = useAppContext()
  const [name, setName] = useState(editingMember?.name ?? '')
  const [age, setAge] = useState(editingMember?.age?.toString() ?? '')
  const [gender, setGender] = useState<'male' | 'female'>(editingMember?.gender ?? 'male')

  function handleSave() {
    if (!name.trim() || !age) return
    const member: FamilyMember = {
      id: editingMember?.id ?? crypto.randomUUID(),
      name: name.trim(),
      age: Number(age),
      gender,
      symptoms: editingMember?.symptoms ?? [],
    }
    if (editingMember) dispatch({ type: 'UPDATE_MEMBER', payload: member })
    else dispatch({ type: 'ADD_MEMBER', payload: member })
    onSave(member)
  }

  const isValid = name.trim().length > 0 && Number(age) > 0

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '2px solid #111111',
    padding: '12px 16px',
    fontSize: 16,
    fontWeight: 500,
    color: '#111111',
    background: '#FFFFFF',
    outline: 'none',
    fontFamily: 'Space Grotesk, sans-serif',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      {/* Header */}
      <header style={{ background: '#111111', borderBottom: '3px solid #111111' }}>
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              style={{ color: '#F5C800', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'none', border: 'none', letterSpacing: '0.5px' }}
            >
              ← BACK
            </button>
          )}
          <h1 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
            {editingMember ? '프로필 수정' : '내 프로필 설정'}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* 섹션 타이틀 */}
        <div style={{ borderLeft: '4px solid #E63329', paddingLeft: 16, marginBottom: 32 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#E63329', letterSpacing: '2px', textTransform: 'uppercase' }}>PROFILE SETUP</p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111111', letterSpacing: '-0.5px' }}>
            {editingMember ? '프로필을 수정하세요' : '내 정보를 입력하세요'}
          </h2>
        </div>

        <div style={{ background: '#FFFFFF', border: '3px solid #111111', boxShadow: '5px 5px 0 #111111', padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 이름 */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#111111', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
              NAME
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              style={inputStyle}
            />
          </div>

          {/* 나이 */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#111111', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
              AGE
            </label>
            <input
              type="number"
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="나이를 입력하세요"
              min={1}
              max={120}
              style={inputStyle}
            />
          </div>

          {/* 성별 */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#111111', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8 }}>
              GENDER
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(['male', 'female'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  style={{
                    padding: '14px 0',
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '1px',
                    cursor: 'pointer',
                    border: '2px solid #111111',
                    background: gender === g ? '#1B4FD8' : '#FFFFFF',
                    color: gender === g ? '#FFFFFF' : '#111111',
                    boxShadow: gender === g ? '3px 3px 0 #111111' : 'none',
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}
                >
                  {g === 'male' ? '♂ 남성' : '♀ 여성'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!isValid}
          style={{
            marginTop: 24,
            width: '100%',
            padding: '16px 0',
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: isValid ? 'pointer' : 'not-allowed',
            border: '3px solid #111111',
            background: isValid ? '#E63329' : '#CCCCCC',
            color: '#FFFFFF',
            boxShadow: isValid ? '5px 5px 0 #111111' : 'none',
            transition: 'transform 0.1s, box-shadow 0.1s',
            fontFamily: 'Space Grotesk, sans-serif',
          }}
        >
          {editingMember ? '수정 완료' : '시작하기 →'}
        </button>
      </main>
    </div>
  )
}
