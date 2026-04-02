import { useState } from 'react'
import { useAppContext } from '../store/AppContext'
import ProductCard from '../components/ProductCard'
import type { FamilyMember, RecommendedProduct, NutrientBalance, SupplementInteraction } from '../types'

interface Props {
  member: FamilyMember
  onBack: () => void
  onReselect: () => void
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

const STATUS_CONFIG = {
  optimal: { label: 'OPTIMAL', bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32', bar: '#4CAF50' },
  low:     { label: 'LOW',     bg: '#E3F2FD', border: '#1B4FD8', text: '#1B4FD8', bar: '#1B4FD8' },
  caution: { label: 'CAUTION', bg: '#FFFBE6', border: '#F5C800', text: '#B8860B', bar: '#F5C800' },
  excess:  { label: 'EXCESS',  bg: '#FFF0F0', border: '#E63329', text: '#E63329', bar: '#E63329' },
}

const INTERACTION_CONFIG = {
  negative: { label: '주의', bg: '#FFF0F0', border: '#E63329', icon: '✕' },
  positive: { label: '시너지', bg: '#E8F5E9', border: '#4CAF50', icon: '↑' },
  timing:   { label: '복용시간', bg: '#FFFBE6', border: '#F5C800', icon: '◷' },
}

function NutrientRow({ b }: { b: NutrientBalance }) {
  const cfg = STATUS_CONFIG[b.status]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #E8E8E0' }}>
      <div style={{ minWidth: 80 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#111111' }}>{b.nutrient}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: '#888888' }}>권장 {b.rda} / 상한 {b.ul}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.text }}>{b.estimatedDaily}</span>
        </div>
        <div style={{ height: 6, background: '#E8E8E0', borderRadius: 0 }}>
          <div style={{
            height: '100%',
            background: cfg.bar,
            width: b.status === 'excess' ? '100%' : b.status === 'optimal' ? '60%' : b.status === 'caution' ? '85%' : '30%',
            transition: 'width 0.4s',
          }} />
        </div>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
        color: cfg.text, background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        padding: '2px 6px', flexShrink: 0,
      }}>
        {cfg.label}
      </span>
    </div>
  )
}

function InteractionCard({ ix }: { ix: SupplementInteraction }) {
  const cfg = INTERACTION_CONFIG[ix.type]
  return (
    <div style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, padding: '14px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: cfg.border }}>{cfg.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', color: cfg.border, textTransform: 'uppercase' as const }}>
          {cfg.label}
        </span>
        <span style={{ fontSize: 10, color: '#888888' }}>
          {ix.nutrientsInvolved.join(' · ')}
        </span>
      </div>
      <p style={{ fontSize: 11, color: '#888888', marginBottom: 4 }}>
        {ix.involvedProducts.join(' + ')}
      </p>
      <p style={{ fontSize: 13, color: '#111111', lineHeight: 1.6, marginBottom: 6 }}>{ix.description}</p>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: cfg.border, flexShrink: 0, paddingTop: 1 }}>→</span>
        <p style={{ fontSize: 12, color: '#444444', lineHeight: 1.5, fontWeight: 600 }}>{ix.advice}</p>
      </div>
    </div>
  )
}

export default function CurationResult({ member, onBack, onReselect }: Props) {
  const { state } = useAppContext()
  const result = state.curationResults[member.id]
  const [excludedProductIds, setExcludedProductIds] = useState<Set<string>>(new Set())

  function toggleProduct(id: string) {
    setExcludedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#888888', marginBottom: 16 }}>큐레이션 결과가 없습니다.</p>
          <button onClick={onBack} style={{ color: '#E63329', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none', fontSize: 14 }}>돌아가기</button>
        </div>
      </div>
    )
  }

  const sorted: RecommendedProduct[] = [...result.products].sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3)
  )

  const activeProducts = sorted.filter(item => !excludedProductIds.has(item.product.id))

  const totalPrice = activeProducts.reduce((sum, item) => sum + item.product.price, 0)
  const totalOriginalPrice = activeProducts.reduce((sum, item) => sum + (item.product.originalPrice ?? item.product.price), 0)
  const createdAt = new Date(result.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  const negativeInteractions = (result.interactions ?? []).filter(i => i.type === 'negative')
  const positiveInteractions = (result.interactions ?? []).filter(i => i.type === 'positive')
  const timingInteractions = (result.interactions ?? []).filter(i => i.type === 'timing')

  async function handleShare() {
    let text = `💊 [${member.name}]님의 맞춤 영양제 큐레이션\n`
    text += `✨ 선택 증상: ${member.symptoms.join(', ')}\n\n`
    text += `🎁 추천 세트: ${result.setName}\n`
    activeProducts.forEach((p, idx) => {
      text += `  ${idx + 1}. ${p.product.name} (${p.product.price.toLocaleString()}원)\n`
    })
    
    text += `💰 예상 총액: ${totalPrice.toLocaleString()}원\n\n`
    text += `📝 AI 분석 요약:\n${result.summary}\n\n`
    text += `👉 나만의 영양제 조합 찾아보기:\n${window.location.origin}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${member.name}님의 영양제 큐레이션`,
          text: text,
        })
      } else {
        await navigator.clipboard.writeText(text)
        alert('공유 텍스트가 클립보드에 복사되었습니다!\n원하는 곳에 붙여넣기 해보세요.')
      }
    } catch (err) {
      console.error('공유 실패:', err)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8' }}>
      <header style={{ background: '#111111', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center gap-4">
          <button onClick={onBack} style={{ color: '#F5C800', fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'none', border: 'none' }}>
            ← BACK
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
              {member.name}의 큐레이션
            </h1>
            <p style={{ color: '#AAAAAA', fontSize: 11, letterSpacing: '1px' }}>{createdAt}</p>
          </div>
          <button onClick={handleShare} style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: 20, cursor: 'pointer' }} title="공유하기">
            📤
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* 증상 태그 */}
        {member.symptoms.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#E63329', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 10 }}>SYMPTOMS</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {member.symptoms.map(symptom => (
                <span key={symptom} style={{
                  fontSize: 12, fontWeight: 600, color: '#111111',
                  background: '#F5C800', border: '2px solid #111111', padding: '4px 10px',
                }}>
                  {symptom}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI 요약 */}
        <div style={{ background: '#1B4FD8', border: '3px solid #111111', boxShadow: '5px 5px 0 #111111', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, background: '#F5C800' }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#F5C800', letterSpacing: '2px', textTransform: 'uppercase' }}>AI ANALYSIS</p>
          </div>
          <p style={{ fontSize: 14, color: '#FFFFFF', lineHeight: 1.7 }}>{result.summary}</p>
        </div>

        {/* 세트 구성 */}
        <div style={{ background: '#111111', border: '3px solid #111111', boxShadow: '5px 5px 0 #E63329', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#F5C800', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>CURATED SET</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.5px' }}>{result.setName}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {totalOriginalPrice > totalPrice && (
                <p style={{ fontSize: 12, color: '#888888', textDecoration: 'line-through', marginBottom: 2 }}>
                  {totalOriginalPrice.toLocaleString()}원
                </p>
              )}
              <p style={{ fontSize: 24, fontWeight: 700, color: '#F5C800' }}>{totalPrice.toLocaleString()}원</p>
              <p style={{ fontSize: 10, color: '#888888', marginTop: 2 }}>총 {activeProducts.length}개 선택됨</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map(item => {
              const excluded = excludedProductIds.has(item.product.id)
              return (
                <div key={item.product.id}
                  onClick={() => toggleProduct(item.product.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', background: excluded ? '#333333' : '#1A1A1A', border: excluded ? '1.5px solid #444444' : '1.5px solid #F5C800',
                    opacity: excluded ? 0.6 : 1, transition: 'all 0.2s', cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    {/* 커스텀 체크박스 UI */}
                    <div style={{
                      width: 22, height: 22, borderRadius: 4,
                      border: `2px solid ${excluded ? '#888888' : '#F5C800'}`,
                      background: excluded ? 'transparent' : '#F5C800',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.2s'
                    }}>
                      {!excluded && <span style={{ color: '#111111', fontSize: 14, fontWeight: 900 }}>✓</span>}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <a href={item.product.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF', textDecoration: excluded ? 'line-through' : 'none' }} onClick={e => e.stopPropagation()}>
                         {item.product.name} <span style={{ fontSize: 10, color: '#888888', fontWeight: 400 }}>↗</span>
                       </a>
                       {item.takingAdvice && (
                         <p style={{ fontSize: 10, color: '#F5C800', marginTop: 4, textDecoration: excluded ? 'line-through' : 'none' }}>{item.takingAdvice}</p>
                       )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: excluded ? '#888888' : '#F5C800', textDecoration: excluded ? 'line-through' : 'none' }}>
                      {item.product.price.toLocaleString()}원
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 영양소 균형 */}
        {result.nutrientBalance && result.nutrientBalance.length > 0 && (
          <div style={{ background: '#FFFFFF', border: '3px solid #111111', boxShadow: '5px 5px 0 #111111', padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 10, height: 10, background: '#111111' }} />
              <p style={{ fontSize: 11, fontWeight: 700, color: '#111111', letterSpacing: '2px', textTransform: 'uppercase' }}>
                NUTRIENT BALANCE
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <span key={key} style={{ fontSize: 9, fontWeight: 700, color: cfg.text, background: cfg.bg, border: `1.5px solid ${cfg.border}`, padding: '2px 6px' }}>
                  {cfg.label}
                </span>
              ))}
            </div>
            {result.nutrientBalance.map((b, i) => (
              <NutrientRow key={i} b={b} />
            ))}
          </div>
        )}

        {/* 상호작용 분석 */}
        {result.interactions && result.interactions.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#111111', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>
              INTERACTIONS — {result.interactions.length}건
            </p>

            {negativeInteractions.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#E63329', letterSpacing: '1px', marginBottom: 8 }}>
                  ✕ 주의 필요
                </p>
                {negativeInteractions.map((ix, i) => <InteractionCard key={i} ix={ix} />)}
              </div>
            )}

            {timingInteractions.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#B8860B', letterSpacing: '1px', marginBottom: 8 }}>
                  ◷ 복용 시간 가이드
                </p>
                {timingInteractions.map((ix, i) => <InteractionCard key={i} ix={ix} />)}
              </div>
            )}

            {positiveInteractions.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#2E7D32', letterSpacing: '1px', marginBottom: 8 }}>
                  ↑ 시너지 효과
                </p>
                {positiveInteractions.map((ix, i) => <InteractionCard key={i} ix={ix} />)}
              </div>
            )}
          </div>
        )}

        {/* 개별 제품 상세 전에 공유하기 버튼 (사용자 요청) */}
        <button onClick={handleShare} style={{
          width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 700,
          letterSpacing: '1px', cursor: 'pointer', marginBottom: 8,
          border: '3px solid #111111', background: '#1B4FD8', color: '#FFFFFF',
          boxShadow: '4px 4px 0 #111111', fontFamily: 'Space Grotesk, sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span>📤</span> 카카오톡 등으로 결과 공유하기
        </button>

        {/* 개별 제품 상세 */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#111111', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>
            PRODUCT DETAIL — {sorted.length}개
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sorted.map(item => (
              <ProductCard key={item.product.id} item={item} />
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
          <button onClick={handleShare} style={{
            width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 700,
            letterSpacing: '1px', cursor: 'pointer',
            border: '3px solid #111111', background: '#111111', color: '#FFFFFF',
            boxShadow: '4px 4px 0 #E63329', fontFamily: 'Space Grotesk, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span>📤</span> 결과 공유하기
          </button>
          <button onClick={onReselect} style={{
            width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
            border: '3px solid #111111', background: '#F5C800', color: '#111111',
            boxShadow: '4px 4px 0 #111111', fontFamily: 'Space Grotesk, sans-serif',
          }}>
            ↺ 다시 선택하기
          </button>
          <button onClick={onBack} style={{
            width: '100%', padding: '14px 0', fontSize: 14, fontWeight: 700,
            letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer',
            border: '3px solid #111111', background: '#FFFFFF', color: '#111111',
            fontFamily: 'Space Grotesk, sans-serif',
          }}>
            ← 홈으로
          </button>
        </div>
      </main>
    </div>
  )
}
