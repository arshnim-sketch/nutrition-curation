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
}

export interface NutrientWarning {
  nutrient: string
  warning: string      // 경고 메시지
  severity: 'caution' | 'danger'  // caution=주의, danger=초과
}

export interface CurationResult {
  memberId: string
  products: RecommendedProduct[]
  summary: string
  setName: string            // 세트 이름 (예: "면역 강화 세트")
  nutrientWarnings: NutrientWarning[]
  createdAt: string
}

export interface RecommendedProduct {
  product: Product
  reason: string
  priority: 'high' | 'medium' | 'low'
  matchedSymptoms: string[]
}
