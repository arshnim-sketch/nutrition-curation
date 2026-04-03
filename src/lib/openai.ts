import { GoogleGenerativeAI } from '@google/generative-ai'
import type { FamilyMember, Product, RecommendedProduct, NutrientBalance, SupplementInteraction } from '../types'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

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
4. **추천 원칙**: 특정 증상 개선에만 치우치지 말고, 인체의 기초 대사를 돕는 **종합비타민(멀티비타민)이나 기본 오메가3 같은 베이스 영양제를 최소 1~2개 우선 포함**시킨 뒤 남은 자리에 증상 맞춤형 제품을 추가하세요.

응답은 반드시 아래 JSON 형식으로만 답하세요:
{
  "setName": "세트 이름 (12자 이내, 예: 기력 뿜뿜 충전 세트)",
  "summary": "사용자의 상태를 위트 있는 비유로 시작하여 상황을 꿰뚫어 보는 요약 (3-4문장).
  [작성 가이드]
  - 예시 1: '산지 3년 된 핸드폰 배터리 - 앉아만 있어도 피곤한, 기력 충전이 시급한 상태예요.'
  - 예시 2: '눈은 감았는데 뇌는 출근 - 몸은 쉬고 싶은데 머리가 먼저 달리는 타입이에요.'
  - 예시 3: '증상 백화점 - 한 군데가 아니라 여러 영역에서 동시에 신호가 오고 있어요.'
  - 예시 4: '걸어다니는 종합병원 - 농담처럼 들리지만, 지금은 전반적인 회복 루틴이 먼저 필요한 상태예요.'
  - 위 예시들을 참고하거나, 사용자의 구체적인 증상 조합에 맞춰 이와 유사한 톤의 창의적인 비유를 문장의 서두에 배치하세요.",
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

nutrientBalance는 추천 세트에 포함된 **모든 영양소를 최소 10개 이상** 분석하세요.
특히 '멀티비타민', '비타민B 콤플렉스', '오메가3' 등의 포괄적 명칭은 **반드시 개별 세부 영양소(예: 비타민A, B1, B2, B6, C, D, 마그네슘, 철분, EPA, DHA 등)로 각각 분해**하여 분석해야 합니다.
상호작용이 없으면 빈 배열 []로 응답하세요.`

  const userMessage = `
이름: ${member.name}
나이: ${member.age}세
성별: ${member.gender === 'male' ? '남성' : '여성'}
증상/건강 목표: ${member.symptoms.join(', ')}

추천 가능한 영양제 목록 (실제 함량 포함):
${products.map(p => {
  const factsStr = p.nutritionFacts && Object.keys(p.nutritionFacts).length > 0
    ? ` | 실제함량: ${Object.entries(p.nutritionFacts).map(([k, v]) => `${k} ${v}`).join(', ')}`
    : ''
  return `[${p.id}] ${p.name} - 주요 성분: ${p.nutrients.join(', ')} - ${p.description}${factsStr}`
}).join('\n')}

이 사람에게 가장 적합한 영양제를 최대 5개 선정하고, 영양소 균형과 상호작용을 철저히 분석해주세요.
nutrientBalance의 estimatedDaily는 위 실제함량 데이터를 기반으로 정확한 수치로 계산하세요.`

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json',
    } as object,
  })

  const response = await model.generateContent(userMessage)
  const text = response.response.text()

  const result = JSON.parse(text) as {
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
    .flatMap((rec) => {
      const product = products.find(p => p.id === rec.productId)
      if (!product) return []
      const item: RecommendedProduct = {
        product,
        reason: rec.reason,
        priority: rec.priority,
        matchedSymptoms: rec.matchedSymptoms,
        ...(rec.takingAdvice ? { takingAdvice: rec.takingAdvice } : {}),
      }
      return [item]
    })

  return {
    products: recommendedProducts,
    summary: result.summary,
    setName: result.setName ?? '맞춤 영양제 세트',
    nutrientBalance: result.nutrientBalance ?? [],
    interactions: result.interactions ?? [],
  }
}
