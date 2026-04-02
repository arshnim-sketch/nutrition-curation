import type { FamilyMember, CurationResult } from '../types'

const SHEETS_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL as string | undefined

/**
 * 큐레이션 결과를 Google Sheets에 기록합니다.
 * VITE_GOOGLE_SHEETS_URL이 설정되어 있지 않으면 조용히 무시합니다.
 */
export async function recordToGoogleSheets(
  member: FamilyMember,
  result: CurationResult
): Promise<{ success: boolean; error?: string }> {
  if (!SHEETS_URL) {
    console.warn('[Google Sheets] VITE_GOOGLE_SHEETS_URL이 설정되지 않았습니다. 기록을 건너뜁니다.')
    return { success: false, error: 'URL not configured' }
  }

  // 추천 영양제 목록 (이름)
  const productNames = result.products
    .map((p, i) => `${i + 1}. ${p.product.name} (${p.product.brand})`)
    .join(' / ')

  // 각 제품 가격
  const prices = result.products
    .map(p => `${p.product.name}: ${p.product.price.toLocaleString()}원`)
    .join(' / ')

  // 총 가격
  const totalPrice = result.products
    .reduce((sum, p) => sum + p.product.price, 0)
    .toLocaleString() + '원'

  // 영양소 균형 상태
  const nutrientStatus = (result.nutrientBalance ?? [])
    .map(b => `${b.nutrient}: ${b.status}(${b.estimatedDaily})`)
    .join(' / ')

  // 상호작용 주의사항
  const interactions = (result.interactions ?? [])
    .map(ix => `[${ix.type}] ${ix.nutrientsInvolved.join('+')} - ${ix.description}`)
    .join(' / ')

  const payload = {
    timestamp: new Date().toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    name: member.name,
    age: member.age,
    gender: member.gender,
    symptoms: member.symptoms.join(', '),
    setName: result.setName,
    products: productNames,
    prices,
    totalPrice,
    summary: result.summary,
    nutrientStatus,
    interactions,
  }

  try {
    const response = await fetch(SHEETS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    })
    console.log('[Google Sheets] 데이터 전송 완료, 응답 상태:', response.status)
    return { success: true }
  } catch (err) {
    console.error('[Google Sheets] 기록 실패:', err)
    return { success: false, error: String(err) }
  }
}
