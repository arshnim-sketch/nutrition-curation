import OpenAI from 'openai'
import type { FamilyMember, Product, RecommendedProduct, NutrientBalance, SupplementInteraction } from '../types'

const client = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

export async function curateSupplements(
  member: FamilyMember,
  products: Product[]
): Promise<{
  products: RecommendedProduct[]
  summary: string
  setName: string
  nutrientBalance: NutrientBalance[]
  interactions: SupplementInteraction[]
}> {
  const systemPrompt = `당신은 임상 영양사 겸 약사입니다. 사용자의 증상·나이·성별을 분석하여 최적의 영양제 세트를 추천하고, 다음 세 가지를 반드시 심층 분석해야 합니다:

1. **영양소 균형**: 추천 세트의 주요 영양소별 하루 예상 총 섭취량을 한국인 영양소 섭취기준(KDRIs)과 비교
2. **제품 간 상호작용**: 흡수 경쟁·시너지·독성 증강 등 임상적으로 유의미한 모든 상호작용 분석
3. **복용 가이드**: 각 제품의 최적 복용 시간·방법 (식전/식후, 다른 영양제와의 간격 등)

응답은 반드시 아래 JSON 형식으로만 답하세요:
{
  "setName": "세트 이름 (12자 이내, 예: 면역 강화 세트)",
  "summary": "전체 건강 상태 및 이 세트가 적합한 이유 (3-4문장)",
  "recommendations": [
    {
      "productId": "상품 id",
      "reason": "추천 이유 (1-2문장)",
      "priority": "high|medium|low",
      "matchedSymptoms": ["관련 증상"],
      "takingAdvice": "복용 방법 (예: 식후 30분, 오전 권장, 지방과 함께 흡수↑)"
    }
  ],
  "nutrientBalance": [
    {
      "nutrient": "영양소명",
      "estimatedDaily": "세트 기준 하루 예상 섭취량 (예: ~2000 IU, ~500mg)",
      "rda": "한국인 권장 섭취량 (나이·성별 맞춤)",
      "ul": "하루 상한 섭취량",
      "status": "optimal|low|caution|excess"
    }
  ],
  "interactions": [
    {
      "type": "negative|positive|timing",
      "involvedProducts": ["제품명1", "제품명2"],
      "nutrientsInvolved": ["영양소1", "영양소2"],
      "description": "상호작용 내용 (근거 포함, 1-2문장)",
      "advice": "구체적인 대처 방법 (복용 시간 분리, 용량 조절 등)"
    }
  ]
}

상호작용 유형:
- negative: 흡수 경쟁(칼슘↔철분, 아연↔구리), 독성 증강(지용성 비타민 과다), 약물 상호작용 등
- positive: 흡수 시너지(비타민D↔칼슘, 비타민C↔철분, 오메가3↔지용성 비타민)
- timing: 복용 시간 분리 권장 (카페인과의 간격, 공복/식후 구분)

nutrientBalance는 추천 세트에서 실제 포함될 주요 영양소만 분석하세요 (최대 8개).
상호작용이 없으면 빈 배열 []로 응답하세요.`

  const userMessage = `
이름: ${member.name}
나이: ${member.age}세
성별: ${member.gender === 'male' ? '남성' : '여성'}
증상/건강 목표: ${member.symptoms.join(', ')}

추천 가능한 영양제 목록:
${products.map(p => `[${p.id}] ${p.name} - 주요 성분: ${p.nutrients.join(', ')} - ${p.description}`).join('\n')}

이 사람에게 가장 적합한 영양제를 최대 5개 선정하고, 영양소 균형과 상호작용을 철저히 분석해주세요.`

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
      takingAdvice?: string
    }[]
    nutrientBalance: NutrientBalance[]
    interactions: SupplementInteraction[]
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
        takingAdvice: rec.takingAdvice,
      } satisfies RecommendedProduct
    })
    .filter((item): item is RecommendedProduct => item !== null)

  return {
    products: recommendedProducts,
    summary: result.summary,
    setName: result.setName ?? '맞춤 영양제 세트',
    nutrientBalance: result.nutrientBalance ?? [],
    interactions: result.interactions ?? [],
  }
}
