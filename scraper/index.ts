import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

interface Product {
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

const BASE_URL = 'https://www.yakssamall.com'
const OUTPUT_PATH = path.resolve(__dirname, '../src/data/products.json')

// 가격 문자열 파싱 (예: "18,900원" -> 18900)
function parsePrice(text: string): number {
  const cleaned = text.replace(/[^0-9]/g, '')
  return parseInt(cleaned, 10) || 0
}

// 상품명 기반 간략 설명 생성
function extractDescription(name: string): string {
  const map: Record<string, string> = {
    '비타민D': '면역력·뼈 건강에 도움. 햇빛 부족한 현대인 필수.',
    '비타민C': '항산화·피로회복·면역 강화. 흡수율 높은 고함량.',
    '비타민B': 'B군 복합체. 에너지 대사·신경 기능 지원.',
    '마그네슘': '근육 이완·수면 개선·스트레스 완화.',
    '오메가3': '혈중 중성지방 감소·두뇌·눈 건강에 도움.',
    '유산균': '장 건강·소화 개선·면역 지원.',
    '루테인': '눈 황반 보호·블루라이트 차단.',
    '코엔자임Q10': '세포 에너지 생성·항산화·심혈관 지원.',
    '콜라겐': '피부 탄력·관절 지지.',
    '글루코사민': '관절 연골 보호·관절 유연성 향상.',
    '멜라토닌': '수면 유도·생체리듬 조절.',
    '비오틴': '모발·피부·손발톱 건강.',
    '홍삼': '면역력·피로개선·체력 보강.',
    '철분': '빈혈 예방·산소 운반.',
    '아연': '면역 강화·세포 분열·피부 재생.',
    '칼슘': '뼈·치아 형성 및 유지.',
    '엽산': '세포 분열·임산부 필수 영양소.',
    '밀크씨슬': '간 보호·해독 기능 강화.',
    '프로바이오틱스': '장내 유익균 증가·소화 기능 지원.',
    '스피루리나': '고단백·철분 풍부·항산화.',
    '쏘팔메토': '전립선 건강 지원 (남성).',
    '포스파티딜세린': '기억력·인지 기능 개선.',
    'L-카르니틴': '지방 연소·에너지 대사 지원.',
    '아르기닌': '혈행 개선·성장 호르몬 분비 지원.',
    '류신': '근육 합성·운동 회복 지원.',
    '단백질': '근육 유지·체력 강화.',
    '아스타잔틴': '강력 항산화·피부·눈 건강.',
    '알파리포산': '항산화·혈당 조절 보조.',
    'MSM': '관절 통증 완화·항염증.',
    '커큐민': '항염·항산화·간 건강.',
    '징코': '혈행·뇌 기능·기억력 지원.',
    '크릴오일': '오메가3·인지질 형태로 흡수율 우수.',
  }
  for (const [keyword, desc] of Object.entries(map)) {
    if (name.includes(keyword)) return desc
  }
  return `${name}. 건강 기능 지원 영양제.`
}

// 영양성분명 추출 시도 (상품명 기반 휴리스틱)
function extractNutrients(name: string, description: string): string[] {
  const text = `${name} ${description}`
  const nutrientKeywords = [
    '비타민D', '비타민C', '비타민A', '비타민E', '비타민K', '비타민B',
    '마그네슘', '칼슘', '아연', '철분', '오메가3', 'EPA', 'DHA',
    '유산균', '루테인', '코엔자임Q10', '콜라겐', '글루코사민',
    '콘드로이틴', '멜라토닌', '비오틴', '홍삼', '엽산', '커큐민',
    'L-카르니틴', '스피루리나', '아스타잔틴', '가르시니아',
    '포스파티딜세린', 'MSM', '쏘팔메토', '밀크씨슬', '실리마린',
    '트립토판', '알파리포산', '나이아신아마이드', '진세노사이드',
  ]
  return nutrientKeywords.filter(k => text.includes(k))
}

// 카테고리 추론
function guessCategory(name: string, description: string): string {
  const text = `${name} ${description}`
  if (/눈|루테인|아스타잔틴/.test(text)) return '눈건강'
  if (/수면|멜라토닌|수면/.test(text)) return '수면'
  if (/유산균|장|소화|변비/.test(text)) return '유산균'
  if (/관절|글루코사민|뼈|칼슘|MSM/.test(text)) return '뼈/관절'
  if (/피부|콜라겐|비오틴|모발|탈모/.test(text)) return '피부/모발'
  if (/피로|홍삼|코엔자임|에너지/.test(text)) return '피로개선'
  if (/면역|아연|비타민C/.test(text)) return '면역'
  if (/오메가3|DHA|EPA/.test(text)) return '오메가3'
  if (/두뇌|집중|인지|기억/.test(text)) return '두뇌/집중'
  if (/체중|다이어트|L-카르니틴|가르시니아/.test(text)) return '체중/대사'
  if (/비타민|미네랄|마그네슘|철분/.test(text)) return '비타민/미네랄'
  return '기타'
}

async function scrapeProductPage(
  page: import('playwright').Page,
  id: number
): Promise<Product | null> {
  const url = `${BASE_URL}/shop_view/${id}`
  try {
    const response = await page.goto(url, { timeout: 15000, waitUntil: 'domcontentloaded' })
    if (!response || !response.ok()) return null

    // 상품명 (h1이 기본, 없으면 title에서 추출)
    let name = await page.$eval('h1', (el) => el.textContent?.trim() ?? '').catch(() => '')
    if (!name) {
      const title = await page.title()
      name = title.split(':')[0].trim()
    }

    if (!name) return null

    // 가격: real_price = 공구가(판매가), sale_price = 소비자가(원가)
    const priceText = await page.$eval(
      '.real_price',
      (el) => el.textContent?.trim() ?? ''
    ).catch(() => '')
    const price = parsePrice(priceText)

    // 원가: sale_price (소비자가)
    const originalPriceText = await page.$eval(
      '.sale_price',
      (el) => el.textContent?.trim() ?? ''
    ).catch(() => '')
    const originalPrice = originalPriceText ? parsePrice(originalPriceText) : undefined

    // 이미지: cdn.imweb.me/thumbnail 패턴의 이미지
    const image = await page.$eval(
      'img[src*="cdn.imweb.me/thumbnail"]',
      (el) => (el as HTMLImageElement).src ?? ''
    ).catch(() => '')

    // 설명 (없으면 상품명 활용)
    const description = ''

    const nutrients = extractNutrients(name, description)
    const category = guessCategory(name, description)

    const descFromName = extractDescription(name)

    return {
      id: String(id),
      name,
      price: price || 0,
      originalPrice,
      url,
      image,
      category,
      description: descFromName,
      nutrients: nutrients.length > 0 ? nutrients : [name],
      brand: '약싸몰',
    }
  } catch (err) {
    console.warn(`Skip ${id}: ${(err as Error).message}`)
    return null
  }
}

async function main() {
  console.log('크롤링 시작...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const results: Product[] = []
  const START_ID = 1437
  const END_ID = 1514

  for (let id = START_ID; id <= END_ID; id++) {
    console.log(`[${id}/${END_ID}] 크롤링 중...`)
    const product = await scrapeProductPage(page, id)
    if (product && product.name) {
      results.push(product)
      console.log(`  ✓ ${product.name} (${product.price.toLocaleString()}원)`)
    } else {
      console.log(`  - 스킵`)
    }
    // 서버 부하 방지
    await page.waitForTimeout(500)
  }

  await browser.close()

  console.log(`\n총 ${results.length}개 상품 크롤링 완료`)
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf-8')
  console.log(`저장 완료: ${OUTPUT_PATH}`)
}

main().catch(console.error)
