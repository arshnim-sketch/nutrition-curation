import type { FamilyMember } from '../types'

interface Props {
  member: FamilyMember
  colorIndex: number
  onEdit: (member: FamilyMember) => void
  onCuration: (member: FamilyMember) => void
  onDelete: (id: string) => void
  hasCuration: boolean
}

const ACCENT_COLORS = ['#E63329', '#1B4FD8', '#F5C800', '#111111']

export default function ProfileCard({ member, colorIndex, onEdit, onCuration, onDelete, hasCuration }: Props) {
  const accent = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length]
  const genderLabel = member.gender === 'male' ? '남 ♂' : '여 ♀'

  return (
    <div style={{
      background: '#FFFFFF',
      border: '3px solid #111111',
      boxShadow: '5px 5px 0 #111111',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {/* 색상 상단 바 */}
      <div style={{ background: accent, height: 8, borderBottom: '2px solid #111111' }} />

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111111', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
              {member.name}
            </h3>
            <p style={{ fontSize: 12, color: '#555555', fontWeight: 500, letterSpacing: '0.5px', marginTop: 2 }}>
              {member.age}세 · {genderLabel}
            </p>
          </div>
          <button
            onClick={() => onDelete(member.id)}
            style={{ color: '#BBBBBB', fontSize: 18, cursor: 'pointer', background: 'none', border: 'none', fontWeight: 700, lineHeight: 1 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E63329')}
            onMouseLeave={e => (e.currentTarget.style.color = '#BBBBBB')}
          >
            ×
          </button>
        </div>

        {member.symptoms.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {member.symptoms.slice(0, 3).map(symptom => (
              <span key={symptom} style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#111111',
                background: '#F5F0E8',
                border: '1.5px solid #111111',
                padding: '2px 8px',
                letterSpacing: '0.3px',
              }}>
                {symptom}
              </span>
            ))}
            {member.symptoms.length > 3 && (
              <span style={{ fontSize: 10, color: '#888888', fontWeight: 600 }}>
                +{member.symptoms.length - 3}
              </span>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 12, color: '#AAAAAA' }}>증상을 선택해주세요</p>
        )}

        {hasCuration && (
          <p style={{ fontSize: 11, color: accent, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            ■ CURATED
          </p>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onEdit(member)}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: 12,
              fontWeight: 700,
              color: '#111111',
              background: '#FFFFFF',
              border: '2px solid #111111',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            수정
          </button>
          <button
            onClick={() => onCuration(member)}
            style={{
              flex: 2,
              padding: '10px 0',
              fontSize: 12,
              fontWeight: 700,
              color: accent === '#F5C800' ? '#111111' : '#FFFFFF',
              background: accent === '#F5C800' ? '#111111' : accent,
              border: '2px solid #111111',
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            {hasCuration ? '결과 보기' : '큐레이션 받기'}
          </button>
        </div>
      </div>
    </div>
  )
}
