import { useAppContext } from '../store/AppContext'
import ProfileCard from '../components/ProfileCard'
import type { FamilyMember } from '../types'

interface Props {
  onAddMember: () => void
  onEditMember: (member: FamilyMember) => void
  onCuration: (member: FamilyMember) => void
}

export default function Home({ onAddMember, onEditMember, onCuration }: Props) {
  const { state, dispatch } = useAppContext()

  function handleDelete(id: string) {
    if (confirm('이 프로필을 삭제할까요?')) {
      dispatch({ type: 'REMOVE_MEMBER', payload: id })
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F0E8' }}>
      {/* Header */}
      <header style={{ background: '#111111', borderBottom: '3px solid #111111' }}>
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 바우하우스 로고 */}
            <div style={{ width: 40, height: 40, background: '#E63329', border: '2px solid #F5C800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 16, background: '#F5C800', borderRadius: '50%' }} />
            </div>
            <div>
              <h1 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                우리 가족 영양제
              </h1>
              <p style={{ color: '#F5C800', fontSize: 11, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
                AI CURATION SYSTEM
              </p>
            </div>
          </div>
          <button
            onClick={onAddMember}
            style={{
              background: '#F5C800',
              color: '#111111',
              border: '2px solid #111111',
              boxShadow: '3px 3px 0 #111111',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            + ADD
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {state.members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {/* 바우하우스 기하학 구성 */}
            <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 32 }}>
              <div style={{ position: 'absolute', width: 80, height: 80, background: '#1B4FD8', border: '3px solid #111111', top: 0, left: 0 }} />
              <div style={{ position: 'absolute', width: 50, height: 50, background: '#E63329', borderRadius: '50%', border: '3px solid #111111', bottom: 0, right: 0 }} />
              <div style={{ position: 'absolute', width: 0, height: 0, borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderBottom: '38px solid #F5C800', bottom: 16, left: '50%', transform: 'translateX(-50%)' }} />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111111', letterSpacing: '-1px', marginBottom: 12, lineHeight: 1.1 }}>
              가족을 추가하세요
            </h2>
            <p style={{ color: '#555555', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
              나이·성별·증상을 입력하면<br />AI가 맞춤 영양제를 큐레이션합니다
            </p>
            <button
              onClick={onAddMember}
              style={{
                background: '#E63329',
                color: '#FFFFFF',
                border: '3px solid #111111',
                boxShadow: '5px 5px 0 #111111',
                padding: '14px 32px',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                letterSpacing: '0.5px',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translate(2px, 2px)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '3px 3px 0 #111111'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.transform = ''
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '5px 5px 0 #111111'
              }}
            >
              첫 번째 가족 추가하기
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#E63329', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 2 }}>FAMILY MEMBERS</p>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111111', letterSpacing: '-0.5px' }}>
                  {state.members.length}명의 가족
                </h2>
              </div>
              <button
                onClick={onAddMember}
                style={{
                  background: '#F5C800',
                  color: '#111111',
                  border: '2px solid #111111',
                  boxShadow: '3px 3px 0 #111111',
                  padding: '8px 16px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                + 추가
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {state.members.map((member, idx) => (
                <ProfileCard
                  key={member.id}
                  member={member}
                  colorIndex={idx}
                  onEdit={onEditMember}
                  onCuration={onCuration}
                  onDelete={handleDelete}
                  hasCuration={!!state.curationResults[member.id]}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
