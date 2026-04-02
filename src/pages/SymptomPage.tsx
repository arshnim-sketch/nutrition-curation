import { useState } from 'react'
import { useAppContext } from '../store/AppContext'
import SymptomSelector from '../components/SymptomSelector'
import { curateSupplements } from '../lib/openai'
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
  const [selected, setSelected] = useState<string[]>(existingSymptoms)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCuration() {
    if (selected.length === 0) return
    setAnalyzing(true)
    setError(null)
    const updatedMember: FamilyMember = { ...member, symptoms: selected }
    dispatch({ type: 'UPDATE_MEMBER', payload: updatedMember })
    try {
      const { products: recommended, summary, setName, nutrientWarnings } = await curateSupplements(updatedMember, products as Product[])
      const result: CurationResult = { memberId: member.id, products: recommended, summary, setName, nutrientWarnings, createdAt: new Date().toISOString() }
      dispatch({ type: 'SET_CURATION', payload: result })
      onResult()
    } catch (err) {
      console.error(err)
      setError('AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <header style={{ background: '#111111', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <button onClick={onBack} style={{ color: '#F5C800', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'none', border: 'none' }}>
            ← BACK
          </button>
          <div>
            <h1 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
              {member.name}의 증상 선택
            </h1>
            <p style={{ color: '#AAAAAA', fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase' }}>
              SELECT SYMPTOMS
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8" style={{ paddingBottom: 160 }}>
        <SymptomSelector selected={selected} onChange={setSelected} />
      </main>

      {/* 하단 고정 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#F5F0E8', borderTop: '3px solid #111111', padding: '16px 24px' }}>
        <div className="max-w-2xl mx-auto">
          {error && <p style={{ fontSize: 12, color: '#E63329', fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>{error}</p>}
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
            {analyzing ? '■ AI 분석 중...' : '▶ AI 큐레이션 시작'}
          </button>
        </div>
      </div>
    </div>
  )
}
