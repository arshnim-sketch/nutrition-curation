import { useState } from 'react'
import { useAppContext } from '../store/AppContext'
import ProductCard from '../components/ProductCard'
import type { FamilyMember, RecommendedProduct, SupplementInteraction } from '../types'

interface Props {
  member: FamilyMember
  onBack: () => void
  onReselect: () => void
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

function getCatchphrase(symptoms: string[], age: number): string {
  const s = symptoms.join(' ')
  const cats: string[] = []
  if (/피로|무기력|에너지|활력/.test(s)) cats.push('피로')
  if (/수면|불면|잠/.test(s)) cats.push('수면')
  if (/면역|감기|잦은/.test(s)) cats.push('면역')
  if (/관절|근육|뼈|허리/.test(s)) cats.push('관절')
  if (/소화|장|변비/.test(s)) cats.push('소화')
  if (/두뇌|집중|기억|인지/.test(s)) cats.push('뇌')
  if (/피부|모발|탈모/.test(s)) cats.push('피부')
  if (/스트레스|불안|우울/.test(s)) cats.push('멘탈')
  if (/체중|다이어트/.test(s)) cats.push('체중')
  if (/눈|시력|눈피로/.test(s)) cats.push('눈')

  // 10대 특별 캐치프레이즈
  if (age < 20) {
    if (cats.length === 0) return '젊고 건강하네.\n그래도 기본은 챙기자.'
    if (cats.length === 1) return `젊은 친구가\n벌써 ${cats[0]} 문제야?`
    if (cats.length === 2) return `젊은 친구가 벌써\n${cats[0]}에 ${cats[1]}까지?`
    if (cats.length === 3) return `젊은 친구가 벌써.\n${cats[0]}, ${cats[1]}, ${cats[2]}까지.`
    return `젊은 친구가 벌써\n이렇게 많이 아파?`
  }

  const n = cats.length

  if (n === 0) return '관리 잘 하고 있네.\n그래도 기본은 챙기자.'

  if (n === 1) {
    const map: Record<string, string> = {
      '피로': '방전된 배터리.\n충전이 시급해.',
      '수면': '눈은 감겼는데\n뇌는 출근 중.',
      '면역': '방어막 붕괴.\n몸이 무방비 상태야.',
      '관절': '삐걱대는 문.\n기름칠이 필요해.',
      '소화': '고장난 소화기.\n입력은 되는데 처리가 안 돼.',
      '뇌': '과부하 걸린 CPU.\n재부팅이 필요해.',
      '피부': '겉이 먼저 신호 보내는 중.\n속부터 봐야 해.',
      '멘탈': '터지기 직전인 풍선.\n지금 당장 압력 낮춰야 해.',
      '체중': '배신한 몸.\n같이 다시 시작하자.',
      '눈': '혹사당한 렌즈.\n교체 전에 관리해야 해.',
    }
    return map[cats[0]] ?? '아픈 놈.\n딱히 설명도 필요 없어.'
  }

  if (n === 2) {
    const combos: Record<string, string> = {
      '피로+수면': '방전에 불면까지.\n재충전 루틴이 없는 상태야.',
      '피로+멘탈': '몸도 마음도\n한계치를 넘어섰어.',
      '수면+멘탈': '자도 피곤하고\n안 자도 피곤한 타입.',
      '피로+관절': '삐걱대면서 방전 중.\n전신 점검이 필요해.',
      '뇌+수면': '눈은 감았는데\n뇌는 야근 중.',
    }
    const key1 = `${cats[0]}+${cats[1]}`
    const key2 = `${cats[1]}+${cats[0]}`
    return combos[key1] ?? combos[key2] ?? `${cats[0]}에 ${cats[1]}까지.\n두 군데서 신호 오는 중.`
  }

  if (n === 3) {
    return `${cats[0]}, ${cats[1]}, ${cats[2]}.\n세 군데서 동시에 신호 오는 중.`
  }

  // 4개 이상
  const labels: Record<string, string> = {
    '피로': '피로', '수면': '불면', '면역': '면역저하', '관절': '관절통',
    '소화': '소화불량', '뇌': '집중력저하', '피부': '피부문제',
    '멘탈': '스트레스', '체중': '체중관리', '눈': '눈피로',
  }
  const tagLine = cats.slice(0, 3).map(c => labels[c] ?? c).join(' · ')
  return `증상 백화점.\n${tagLine} 외 ${n - 3}개 더.`
}

// 영양소 이름 정규화 (변형 → 표준)
function canonicalizeNutrient(s: string): string {
  const n = s.replace(/\s/g, '').toLowerCase()
  const MAP: Record<string, string> = {
    '철': '철분', '비타민d3': '비타민d', '비타민k1': '비타민k', '비타민k2': '비타민k',
    '셀렌': '셀레늄', '니아신': '나이아신', '나이아신아마이드': '나이아신',
    '아이오딘': '요오드', 'epa+dha': '오메가3', '비타민b12': '비타민b12',
    '코엔자임q10': '코엔자임q10', 'coq10': '코엔자임q10',
  }
  return MAP[n] ?? n
}

// nutritionFacts에서 해당 영양소 실제 합산값 추출
function sumNutrientFromFacts(nutrientName: string, prods: RecommendedProduct[]): string | null {
  const target = canonicalizeNutrient(nutrientName)
  const totals: Record<string, number> = {}

  for (const item of prods) {
    const facts = item.product.nutritionFacts
    if (!facts) continue
    for (const [k, rawV] of Object.entries(facts)) {
      if (canonicalizeNutrient(k) !== target) continue
      const v = typeof rawV === 'string' ? rawV : String(rawV)
      const m = v.match(/([\d,]+(?:\.\d+)?)\s*(.+)/)
      if (m) {
        const num = parseFloat(m[1].replace(/,/g, ''))
        const unit = m[2].trim()
        totals[unit] = (totals[unit] ?? 0) + num
      }
      break
    }
  }

  if (Object.keys(totals).length === 0) return null
  return Object.entries(totals)
    .map(([unit, n]) => `${n % 1 === 0 ? n : parseFloat(n.toFixed(1))} ${unit}`)
    .join(' + ')
}


const INTERACTION_CONFIG = {
  negative: { label: '주의', bg: '#FFF0F0', border: '#E63329', icon: '✕' },
  positive: { label: '시너지', bg: '#E8F5E9', border: '#4CAF50', icon: '↑' },
  timing:   { label: '복용시간', bg: '#FFFBE6', border: '#F5C800', icon: '◷' },
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
          <p style={{ color: '#888888', marginBottom: 16 }}>분석 결과가 없습니다.</p>
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
    let text = `💊 [${member.name}]님의 도핑 세트\n`
    text += `✨ 선택 증상: ${member.symptoms.join(', ')}\n\n`
    text += `🎁 추천 세트: ${result.setName}\n`
    activeProducts.forEach((p, idx) => {
      text += `  ${idx + 1}. ${p.product.name} (${p.product.price.toLocaleString()}원)\n`
    })
    
    text += `💰 예상 총액: ${totalPrice.toLocaleString()}원\n\n`
    text += `📝 AI 분석 요약:\n${result.summary}\n\n`
    text += `👉 나만의 도핑 세트 설계하기:\n${window.location.origin}`

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${member.name}님의 도핑 세트`,
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
              {member.name}의 도핑 세트
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, background: '#F5C800' }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: '#F5C800', letterSpacing: '2px', textTransform: 'uppercase' }}>AI ANALYSIS</p>
          </div>
          <p style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.25, letterSpacing: '-1px', marginBottom: 14 }}>
            {getCatchphrase(member.symptoms, member.age)}
          </p>
          <p style={{ fontSize: 12, color: '#AACCFF', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 12 }}>{result.summary}</p>
        </div>

        {/* 세트 구성 */}
        <div style={{ background: '#111111', border: '3px solid #111111', boxShadow: '5px 5px 0 #E63329', padding: '20px 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#F5C800', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>CURATED SET</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.5px' }}>{result.setName}</p>
            <p style={{ fontSize: 11, color: '#888888', marginTop: 4 }}>총 {activeProducts.length}개 선택됨</p>
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
                       {item.product.nutritionFacts && Object.keys(item.product.nutritionFacts).length > 0 && (
                         <div style={{ marginTop: 6, opacity: excluded ? 0.3 : 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                           {Object.entries(item.product.nutritionFacts).map(([k, v], idx) => (
                             <span key={idx} style={{ fontSize: 9, color: '#CCCCCC', background: '#333333', padding: '2px 6px', borderRadius: 2 }}>
                               {k} <strong style={{color: '#EEEEEE'}}>{typeof v === 'string' ? v : String(v)}</strong>
                             </span>
                           ))}
                         </div>
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

          {/* 총액 */}
          <div style={{ marginTop: 16, borderTop: '1.5px solid #333333', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#888888', letterSpacing: '1px' }}>TOTAL</span>
            <div style={{ textAlign: 'right' }}>
              {totalOriginalPrice > totalPrice && (
                <p style={{ fontSize: 12, color: '#666666', textDecoration: 'line-through', marginBottom: 2 }}>
                  {totalOriginalPrice.toLocaleString()}원
                </p>
              )}
              <p style={{ fontSize: 22, fontWeight: 700, color: '#F5C800' }}>{totalPrice.toLocaleString()}원</p>
            </div>
          </div>

          {/* 미니 영양소 게이지 — 체크박스와 같은 카드 내 */}
          {result.nutrientBalance && result.nutrientBalance.length > 0 && (
            <div style={{ marginTop: 16, borderTop: '1.5px solid #333333', paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#888888', letterSpacing: '1.5px', marginBottom: 10 }}>NUTRIENT BALANCE</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.nutrientBalance.map((b, i) => {
                  const normalize = (s: string) => s.replace(/\s/g, '').toLowerCase()
                  const bNutrient = normalize(b.nutrient)
                  // nutrients 배열 기반 매칭 (멀티비타민은 스크래퍼에서 이미 21개 개별 영양소로 확장됨)
                  const matchingProducts = sorted.filter(p =>
                    p.product.nutrients.some(n => {
                      const nNorm = normalize(n)
                      return bNutrient.includes(nNorm) || nNorm.includes(bNutrient)
                    })
                  )
                  const totalMatchingCount = matchingProducts.length
                  const activeMatchingCount = matchingProducts.filter(p => !excludedProductIds.has(p.product.id)).length
                  const isExcluded = totalMatchingCount > 0 && activeMatchingCount === 0

                  // 단일 제품만 초과: 의도된 고함량 제품 (주황) vs 복합 초과: 실제 경고 (빨강)
                  const isSingleExcess = b.status === 'excess' && totalMatchingCount <= 1

                  const baseWidth = b.status === 'excess' ? 100 : b.status === 'optimal' ? 60 : b.status === 'caution' ? 85 : 30
                  const barWidth = isExcluded ? 0
                    : totalMatchingCount > 0 && activeMatchingCount < totalMatchingCount
                      ? Math.max(8, baseWidth * (activeMatchingCount / totalMatchingCount))
                      : baseWidth

                  const barColor = isExcluded ? '#444444'
                    : barWidth <= 25 ? '#E63329'
                    : barWidth <= 50 ? '#F5C800'
                    : barWidth <= 75 ? '#1B4FD8'
                    : '#4CAF50'
                  const cfg = { bar: barColor, text: barColor }

                  // 실제 nutritionFacts에서 합산값 우선 사용, 없으면 GPT 추정치 fallback
                  const activeMatchingProds = matchingProducts.filter(p => !excludedProductIds.has(p.product.id))
                  const actualDaily = isExcluded ? null : sumNutrientFromFacts(b.nutrient, activeMatchingProds)
                  const displayValue = isExcluded ? '—'
                    : actualDaily ?? (isSingleExcess ? '고함량' : b.estimatedDaily)

                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: cfg.text, width: 80, flexShrink: 0, opacity: isExcluded ? 0.4 : 1, textDecoration: isExcluded ? 'line-through' : 'none' }}>
                        {b.nutrient}
                      </span>
                      <div style={{ flex: 1, height: 4, background: '#2A2A2A' }}>
                        <div style={{ height: '100%', background: cfg.bar, width: `${barWidth}%`, transition: 'width 0.35s ease-out, background 0.35s' }} />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: cfg.text, minWidth: 40, textAlign: 'right', opacity: isExcluded ? 0.4 : 1 }}>
                        {displayValue}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

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

        {/* 면책 고지 */}
        <div style={{ border: '1.5px solid #CCCCCC', padding: '14px 16px', background: '#FAFAFA' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#888888', letterSpacing: '1.5px', marginBottom: 6 }}>⚠ DISCLAIMER</p>
          <p style={{ fontSize: 11, color: '#888888', lineHeight: 1.7 }}>
            본 결과는 <strong style={{ color: '#555555' }}>참고용</strong>이며 의료적 진단·처방을 대체하지 않습니다.
            임산부·수유부, 당뇨·갑상선·신장 질환 등 지병이 있는 분은 반드시 <strong style={{ color: '#555555' }}>의사·약사와 상담</strong> 후 복용하세요.
            복용 중인 약물이 있는 경우 전문가를 통해 상호작용을 확인하시기 바랍니다.
          </p>
        </div>
      </main>
    </div>
  )
}
