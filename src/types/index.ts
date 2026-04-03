export interface FamilyMember {
  id: string
  name: string
  age: number
  gender: 'male' | 'female'
  symptoms: string[]
  avatar?: string
}

export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  url: string
  image: string
  category: string
  description: string
  nutrients: string[]
  brand: string
  nutritionFacts?: Record<string, string>
}

// 영양소별 하루 균형 분석
export interface NutrientBalance {
  nutrient: string
  estimatedDaily: string     // 세트 기준 하루 예상 섭취량 (예: "~2000 IU")
  rda: string                // 권장 섭취량 (예: "600–800 IU")
  ul: string                 // 상한 섭취량 (예: "4000 IU")
  status: 'optimal' | 'low' | 'caution' | 'excess'
}

// 영양제 간 상호작용
export interface SupplementInteraction {
  type: 'negative' | 'positive' | 'timing'
  involvedProducts: string[]   // 관련 제품명
  nutrientsInvolved: string[]  // 관련 영양소
  description: string          // 상호작용 설명
  advice: string               // 대처 방법
}

export interface CurationResult {
  memberId: string
  products: RecommendedProduct[]
  summary: string
  setName: string
  nutrientBalance: NutrientBalance[]
  interactions: SupplementInteraction[]
  createdAt: string
}

export interface RecommendedProduct {
  product: Product
  reason: string
  priority: 'high' | 'medium' | 'low'
  matchedSymptoms: string[]
  takingAdvice?: string         // 복용 시간/방법 (예: "식후 30분, 비타민D와 함께")
}
