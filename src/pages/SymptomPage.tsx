import { useState } from 'react'
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
