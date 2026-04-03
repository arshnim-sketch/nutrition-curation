import type { FamilyMember } from '../types'

interface Props {
  member: FamilyMember
  hasCuration: boolean
  onEditProfile: () => void
  onStartAnalysis: () => void
  onViewResult: () => void
}

export default function Home({ member, hasCuration, onEditProfile, onStartAnalysis, onViewResult }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      {/* Header */}
      <header style={{ background: '#111111', borderBottom: '3px solid #111111' }}>
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div style={{ width: 40, height: 40, background: '#E63329', border: '2px solid #F5C800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 16, height: 16, background: '#F5C800', borderRadius: '50%' }} />
            </div>
            <div>
              <h1 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                현대인 도핑 가이드
              </h1>
              <p style={{ color: '#F5C800', fontSize: 11, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
                AI SUPPLEMENT DOPING SYSTEM
              </p>
            </div>
          </div>
          <button
            onClick={onEditProfile}
            style={{
              background: 'none',
              color: '#AAAAAA',
              border: '2px solid #444444',
              padding: '6px 14px',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            EDIT
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* 프로필 카드 */}
        <div style={{ background: '#111111', border: '3px solid #111111', boxShadow: '5px 5px 0 #E63329' }}>
          <div style={{ background: '#E63329', padding: '8px 24px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#FFFFFF', letterSpacing: '2px' }}>MY PROFILE</p>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* 아바타 */}
            <div style={{
              width: 64, height: 64, flexShrink: 0,
              background: '#1B4FD8', border: '3px solid #F5C800',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#F5C800' }}>
                {member.name.slice(0, 1)}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.5px' }}>{member.name}</p>
              <p style={{ fontSize: 13, color: '#AAAAAA', marginTop: 4 }}>
                {member.age}세 · {member.gender === 'male' ? '남성' : '여성'}
              </p>
              {member.symptoms.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {member.symptoms.slice(0, 4).map(s => (
                    <span key={s} style={{
                      fontSize: 10, fontWeight: 600, color: '#F5C800',
                      border: '1.5px solid #F5C800', padding: '2px 7px',
                    }}>{s}</span>
                  ))}
                  {member.symptoms.length > 4 && (
                    <span style={{ fontSize: 10, color: '#888888', padding: '2px 4px' }}>
                      +{member.symptoms.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 메인 액션 */}
        {hasCuration ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={onViewResult}
              style={{
                width: '100%', padding: '20px 0',
                fontSize: 18, fontWeight: 700, letterSpacing: '1px',
                cursor: 'pointer',
                border: '3px solid #111111',
                background: '#1B4FD8', color: '#FFFFFF',
                boxShadow: '5px 5px 0 #111111',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              ▶ 내 도핑 세트 보기
            </button>
            <button
              onClick={onStartAnalysis}
              style={{
                width: '100%', padding: '14px 0',
                fontSize: 14, fontWeight: 700, letterSpacing: '1px',
                cursor: 'pointer',
                border: '3px solid #111111',
                background: '#FFFFFF', color: '#111111',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              ↺ 다시 분석하기
            </button>
          </div>
        ) : (
          <button
            onClick={onStartAnalysis}
            style={{
              width: '100%', padding: '24px 0',
              fontSize: 20, fontWeight: 700, letterSpacing: '1px',
              cursor: 'pointer',
              border: '3px solid #111111',
              background: '#E63329', color: '#FFFFFF',
              boxShadow: '5px 5px 0 #111111',
              fontFamily: 'Space Grotesk, sans-serif',
            }}
          >
            ▶ 도핑 세트 설계 시작
          </button>
        )}

        {/* 설명 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['01', '증상 선택', '현재 겪고 있는 건강 목표를 선택합니다'],
            ['02', 'AI 분석', 'GPT-4o가 임상 영양학 기준으로 최적 조합 설계'],
            ['03', '도핑 세트', '영양소 균형·상호작용 검증된 맞춤 루틴 제공'],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: '#FFFFFF', border: '2px solid #111111' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#E63329', minWidth: 20 }}>{num}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111111' }}>{title}</p>
                <p style={{ fontSize: 12, color: '#888888', marginTop: 2 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 면책 고지 */}
        <div style={{ border: '1.5px solid #CCCCCC', padding: '14px 16px', background: '#FAFAFA' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#888888', letterSpacing: '1.5px', marginBottom: 6 }}>⚠ DISCLAIMER</p>
          <p style={{ fontSize: 11, color: '#888888', lineHeight: 1.7 }}>
            본 서비스는 <strong style={{ color: '#555555' }}>참고용 정보 제공</strong>을 목적으로 하며, 의료적 진단·처방을 대체하지 않습니다.
            임산부, 수유부, 당뇨·갑상선 질환·신장 질환 등 지병이 있는 분은 반드시 <strong style={{ color: '#555555' }}>의사·약사와 상담</strong> 후 복용하세요.
            복용 중인 약물이 있는 경우 영양제와의 상호작용을 전문가에게 확인하시기 바랍니다.
          </p>
        </div>
      </main>
    </div>
  )
}
