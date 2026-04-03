import { useState, useEffect, useRef } from 'react'
import { useAppContext } from '../store/AppContext'
import SymptomSelector, { SYMPTOM_CATEGORIES } from '../components/SymptomSelector'
import { curateSupplements } from '../lib/openai'
import { recordToGoogleSheets } from '../lib/googleSheets'
import products from '../data/products.json'
import type { FamilyMember, CurationResult, Product } from '../types'

interface Props {
  member: FamilyMember
  onBack: () => void
  onResult: () => void
}

export default function SymptomPage({ member, onBack, onResult }: Props) {
  const { state, dispatch } = useAppContext()
  const existingSymptoms = state.members.find(m => m.id === member.id)?.symptoms ?? []
  const initialCategories = SYMPTOM_CATEGORIES
    .filter(c => c.symptoms.some(s => existingSymptoms.includes(s)))
    .map(c => c.category)

  const [step, setStep] = useState<1 | 2>(existingSymptoms.length > 0 ? 2 : 1)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)
  const [selected, setSelected] = useState<string[]>(existingSymptoms)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const LOADING_STEPS = [
    { label: 'SCANNING', text: '증상 패턴 스캔 중...', sub: `${selected.length}개 증상 분석` },
    { label: 'MATCHING', text: '193개 제품 필터링 중...', sub: '함량·성분 데이터 대조' },
    { label: 'ANALYZING', text: '영양소 균형 계산 중...', sub: '한국인 영양소 기준(KDRIs) 적용' },
    { label: 'CHECKING', text: '상호작용 검사 중...', sub: '흡수 경쟁·시너지 분석' },
    { label: 'DESIGNING', text: '최적 조합 설계 중...', sub: 'AI 임상 영양사 판단 적용' },
    { label: 'FINISHING', text: '복용 가이드 작성 중...', sub: '맞춤 루틴 완성 단계' },
  ]

  useEffect(() => {
    if (analyzing) {
      setLoadingStep(0)
      loadingIntervalRef.current = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length)
      }, 1800)
    } else {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current)
    }
    return () => { if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current) }
  }, [analyzing])

  function toggleCategory(category: string) {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prev => prev.filter(c => c !== category))
    } else {
      setSelectedCategories(prev => [...prev, category])
    }
  }

  async function handleCuration() {
    if (selected.length === 0) return
    setAnalyzing(true)
    setError(null)
    const updatedMember: FamilyMember = { ...member, symptoms: selected }
    dispatch({ type: 'UPDATE_MEMBER', payload: updatedMember })
    try {
      const { products: recommended, summary, setName, nutrientBalance, interactions } = await curateSupplements(updatedMember, products as Product[])
      const result: CurationResult = { memberId: member.id, products: recommended, summary, setName, nutrientBalance, interactions, createdAt: new Date().toISOString() }
      dispatch({ type: 'SET_CURATION', payload: result })

      // Google Sheets에 데이터 기록
      recordToGoogleSheets(updatedMember, result).catch(console.error)

      onResult()
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      setError(`오류: ${msg}`)
    } finally {
      setAnalyzing(false)
    }
  }

  if (analyzing) {
    const step = LOADING_STEPS[loadingStep]
    const barCount = 8
    const progress = Math.round(((loadingStep + 1) / LOADING_STEPS.length) * 100)
    const progressColor = progress <= 25 ? '#E63329' : progress <= 50 ? '#F5C800' : progress <= 75 ? '#1B4FD8' : '#4CAF50'
    return (
      <div style={{ minHeight: '100vh', background: '#111111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <style>{`
          @keyframes barPulse {
            0%, 100% { transform: scaleY(0.3); opacity: 0.3; }
            50% { transform: scaleY(1); opacity: 1; }
          }
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scanLine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>

        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 32, height: 32, background: '#E63329', border: '2px solid #F5C800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 12, height: 12, background: '#F5C800', borderRadius: '50%' }} />
          </div>
          <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700, letterSpacing: '1px' }}>현대인 도핑 가이드</span>
        </div>

        {/* 바 이퀄라이저 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 56, marginBottom: 40 }}>
          {Array.from({ length: barCount }).map((_, i) => (
            <div key={i} style={{
              width: 10,
              height: 56,
              background: i % 3 === 0 ? '#E63329' : i % 3 === 1 ? '#F5C800' : '#1B4FD8',
              transformOrigin: 'bottom',
              animation: `barPulse ${0.6 + i * 0.13}s ease-in-out ${i * 0.08}s infinite`,
            }} />
          ))}
        </div>

        {/* 현재 단계 */}
        <div key={loadingStep} style={{ textAlign: 'center', animation: 'fadeSlide 0.35s ease-out' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#E63329', letterSpacing: '3px', marginBottom: 10 }}>
            {step.label} [{loadingStep + 1}/{LOADING_STEPS.length}]
          </p>
          <p style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px', marginBottom: 8, lineHeight: 1.3 }}>
            {step.text}
          </p>
          <p style={{ fontSize: 13, color: '#888888', fontWeight: 500 }}>{step.sub}</p>
        </div>

        {/* 프로그레스 바 */}
        <div style={{ width: '100%', maxWidth: 320, marginTop: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: progressColor, letterSpacing: '1.5px', transition: 'color 0.4s' }}>PROGRESS</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: progressColor, transition: 'color 0.4s' }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: 8, background: '#2A2A2A', position: 'relative' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: progressColor,
              transition: 'width 0.6s ease-out, background 0.4s ease',
            }} />
          </div>
          {/* 25% 눈금 마커 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {['25%', '50%', '75%', '100%'].map((label, i) => {
              const threshold = (i + 1) * 25
              const reached = progress >= threshold
              return (
                <span key={label} style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
                  color: reached ? progressColor : '#333333',
                  transition: 'color 0.4s',
                }}>{label}</span>
              )
            })}
          </div>
        </div>

        {/* 단계 도트 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {LOADING_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === loadingStep ? 20 : 6,
              height: 6,
              background: i === loadingStep ? progressColor : i < loadingStep ? '#444444' : '#2A2A2A',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <p style={{ fontSize: 11, color: '#444444', marginTop: 24, letterSpacing: '0.5px' }}>
          AI가 열심히 분석 중이에요
          <span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
        </p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <header style={{ background: '#111111', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <button onClick={() => {
            if (step === 2) setStep(1)
            else onBack()
          }} style={{ color: '#F5C800', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'none', border: 'none' }}>
            ← BACK
          </button>
          <div>
            <h1 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
              {member.name}의 {step === 1 ? '관심 영역' : '증상 선택'}
            </h1>
            <p style={{ color: '#AAAAAA', fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' }}>
              {step === 1 ? 'CHOOSE CATEGORIES' : 'SELECT SYMPTOMS'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8" style={{ paddingBottom: 160 }}>
        {step === 1 ? (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111111', marginBottom: 20 }}>평소 신경쓰이는 건강 영역을 모두 선택해주세요.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {SYMPTOM_CATEGORIES.map(c => {
                const isSelected = selectedCategories.includes(c.category)
                return (
                  <button
                    key={c.category}
                    onClick={() => toggleCategory(c.category)}
                    style={{
                      padding: '24px 16px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                      cursor: 'pointer',
                      border: `3px solid ${isSelected ? c.color : '#111111'}`,
                      background: isSelected ? c.color : '#FFFFFF',
                      color: isSelected ? (c.color === '#F5C800' ? '#111111' : '#FFFFFF') : '#111111',
                      boxShadow: isSelected ? '5px 5px 0 #111111' : 'none',
                      transition: 'all 0.1s',
                      fontFamily: 'Space Grotesk, sans-serif',
                    }}
                  >
                    <span style={{ fontSize: 24, paddingBottom: 4 }}>{c.symbol}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{c.category}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#111111', marginBottom: 24 }}>해당 영역에서 겪고계신 증상을 선택해주세요.</p>
            <SymptomSelector 
              selected={selected} 
              onChange={setSelected} 
              selectedCategories={selectedCategories} 
            />
          </div>
        )}
      </main>

      {/* 하단 고정 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#F5F0E8', borderTop: '3px solid #111111', padding: '16px 24px' }}>
        <div className="max-w-2xl mx-auto">
          {error && <p style={{ fontSize: 12, color: '#E63329', fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>{error}</p>}
          
          {step === 1 ? (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>
                  선택된 영역: <strong style={{ color: '#E63329' }}>{selectedCategories.length}개</strong>
                </span>
                {selectedCategories.length > 0 && (
                  <button onClick={() => setSelectedCategories([])} style={{ fontSize: 12, color: '#888888', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }}>
                    전체 해제
                  </button>
                )}
             </div>
          ) : (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>
                  선택된 증상: <strong style={{ color: '#E63329' }}>{selected.length}개</strong>
                </span>
                {selected.length > 0 && (
                  <button onClick={() => setSelected([])} style={{ fontSize: 12, color: '#888888', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 600 }}>
                    전체 해제
                  </button>
                )}
             </div>
          )}

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={selectedCategories.length === 0}
              style={{
                width: '100%',
                padding: '16px 0',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '1px',
                cursor: selectedCategories.length > 0 ? 'pointer' : 'not-allowed',
                border: '3px solid #111111',
                background: selectedCategories.length > 0 ? '#F5C800' : '#CCCCCC',
                color: '#111111',
                boxShadow: selectedCategories.length > 0 ? '5px 5px 0 #111111' : 'none',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              다음: 세부 증상 선택 ({selectedCategories.length})
            </button>
          ) : (
            <button
              onClick={handleCuration}
              disabled={selected.length === 0 || analyzing}
              style={{
                width: '100%',
                padding: '16px 0',
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                cursor: selected.length > 0 && !analyzing ? 'pointer' : 'not-allowed',
                border: '3px solid #111111',
                background: selected.length > 0 && !analyzing ? '#1B4FD8' : '#CCCCCC',
                color: '#FFFFFF',
                boxShadow: selected.length > 0 && !analyzing ? '5px 5px 0 #111111' : 'none',
                fontFamily: 'Space Grotesk, sans-serif',
              }}
            >
              {analyzing ? '■ AI 분석 중...' : '▶ 도핑 세트 설계 시작'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
