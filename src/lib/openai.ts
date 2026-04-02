import OpenAI from 'openai'
import type { FamilyMember, Product, RecommendedProduct, NutrientWarning } from '../types'

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function curateSupplements(
  member: FamilyMember,
  products: Product[]
): Promise<{ products: RecommendedProduct[]; summary: string; setName: string; nutrientWarnings: NutrientWarning[] }> {
  const systemPrompt = `당신은 전문 영양사입니다. 사용자의 증상을 분석하고 적합한 영양제를 추천해주세요.
응답은 반드시 다음 JSON 형식으로만 답하세요:
{
  "setName": "추천 세트 이름 (예: 면역 강화 세트, 수면 개선 세트, 관절 건강 세트 등 12자 이내)",
  "summary": "전체 건강 상태 요약 및 주의사항 (2-3문장)",
  "recommendations": [
    {
      "productId": "상품 id",
      "reason": "이 영양제를 추천하는 구체적인 이유 (1-2문장)",
      "priority": "high|medium|low",
      "matchedSymptoms": ["해당하는 증상들"]
    }
  ],
  "nutrientWarnings": [
    {
      "nutrient": "영양소명",
      "warning": "세트 내 중복 영양소로 하루 기준치 초과 우려 또는 상호작용 주의 내용 (1문장)",
      "severity": "caution|danger"
    }
  ]
}

nutrientWarnings 작성 기준:
- 추천된 제품들 간 동일 영양소가 겹치면 합산 섭취량이 하루 상한치(UL)를 초과할 수 있는지 검토
- 예: 비타민D 하루 상한 4000IU, 비타민A 3000㎍RE, 비타민C 2000mg, 철분 45mg, 아연 35mg
- 겹치지 않거나 안전 범위면 빈 배열 []
- 위험한 조합(예: 철분+아연 흡수 경쟁, 지용성 비타민 과다)도 포함`

  const userMessage = `
이름: ${member.name}
나이: ${member.age}세
성별: ${member.gender === 'male' ? '남성' : '여성'}
증상: ${member.symptoms.join(', ')}

추천 가능한 영양제 목록:
${products.map(p => `[${p.id}] ${p.name} - ${p.nutrients.join(', ')} - ${p.description}`).join('\n')}

위 증상에 맞는 영양제를 최대 5개 추천해주세요. 나이와 성별도 고려하고, 추천 세트 내 영양소 중복 여부도 반드시 분석해주세요.`

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content ?? '{}') as {
    setName: string
    summary: string
    recommendations: {
      productId: string
      reason: string
      priority: 'high' | 'medium' | 'low'
      matchedSymptoms: string[]
    }[]
    nutrientWarnings: NutrientWarning[]
  }

  const recommendedProducts: RecommendedProduct[] = (result.recommendations ?? [])
    .map((rec) => {
      const product = products.find(p => p.id === rec.productId)
      if (!product) return null
      return {
        product,
        reason: rec.reason,
        priority: rec.priority,
        matchedSymptoms: rec.matchedSymptoms,
      } satisfies RecommendedProduct
    })
    .filter((item): item is RecommendedProduct => item !== null)

  return {
    products: recommendedProducts,
    summary: result.summary,
    setName: result.setName ?? '맞춤 영양제 세트',
    nutrientWarnings: result.nutrientWarnings ?? [],
  }
}
