/**
 * GPT-4o Vision으로 상품 상세 이미지에서 영양성분 함량 추출
 * 기존 products.json에 nutritionFacts 필드를 추가
 */
import { chromium } from 'playwright'
import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'

const PRODUCTS_PATH = path.resolve(__dirname, '../src/data/products.json')
const API_KEY = process.env.OPENAI_API_KEY || ''

interface Product {
  id: string
  name: string
  url: string
  nutrients: string[]
  nutritionFacts?: Record<string, string>
  [key: string]: unknown
}

const client = new OpenAI({ apiKey: API_KEY })

// 상품 상세 페이지에서 가장 큰 이미지 URL 수집
async function getDetailImages(page: import('playwright').Page, url: string): Promise<string[]> {
  try {
    await page.goto(url, { timeout: 20000, waitUntil: 'networkidle' })
    const imgs = await page.$$eval(
      '.goods_description img, .product_description img, .detail_content img, [class*="detail"] img, [class*="description"] img, .editor img',
      (els) => els
        .map(el => ({ src: (el as HTMLImageElement).src, h: (el as HTMLImageElement).naturalHeight }))
        .filter(i => i.h > 500)  // 영양성분표가 포함된 긴 이미지만
        .sort((a, b) => b.h - a.h)
        .slice(0, 2)
        .map(i => i.src)
    )
    return imgs
  } catch {
    return []
  }
}

// GPT-4o Vision으로 영양성분 추출
async function extractNutritionFacts(imageUrls: string[], productName: string): Promise<Record<string, string>> {
  if (imageUrls.length === 0) return {}

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `이 이미지는 "${productName}" 영양제 제품의 상세 페이지입니다.
이미지에서 영양성분표(1일 섭취량 기준 함량)를 찾아 아래 JSON 형식으로만 응답하세요.
없으면 빈 객체 {} 반환.

{
  "영양소명": "함량(단위)",
  ...
}

예시: { "비타민D": "1000 IU", "비타민C": "500 mg", "마그네슘": "200 mg" }
영양소명은 한국어로, 함량은 숫자+단위(IU/mg/μg/g/CFU 등) 형태로.`,
            },
            ...imageUrls.map(url => ({
              type: 'image_url' as const,
              image_url: { url, detail: 'low' as const },
            })),
          ],
        },
      ],
      response_format: { type: 'json_object' },
    })

    const text = response.choices[0].message.content ?? '{}'
    return JSON.parse(text) as Record<string, string>
  } catch (err) {
    console.warn(`  Vision 실패: ${(err as Error).message}`)
    return {}
  }
}

async function main() {
  if (!API_KEY) {
    console.error('OPENAI_API_KEY 환경변수가 필요합니다.')
    process.exit(1)
  }

  const products: Product[] = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'))
  console.log(`총 ${products.length}개 상품 영양정보 추출 시작\n`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  let updated = 0
  let skipped = 0

  for (let i = 0; i < products.length; i++) {
    const p = products[i]

    // 이미 추출된 경우 스킵
    if (p.nutritionFacts && Object.keys(p.nutritionFacts).length > 0) {
      console.log(`[${i + 1}/${products.length}] ⏭  ${p.name} (이미 존재)`)
      skipped++
      continue
    }

    console.log(`[${i + 1}/${products.length}] 🔍 ${p.name}`)

    const imgs = await getDetailImages(page, p.url)
    if (imgs.length === 0) {
      console.log(`  → 상세 이미지 없음, 스킵`)
      products[i].nutritionFacts = {}
      continue
    }

    const facts = await extractNutritionFacts(imgs, p.name)
    products[i].nutritionFacts = facts

    if (Object.keys(facts).length > 0) {
      console.log(`  ✓ ${Object.keys(facts).length}개 영양소: ${Object.entries(facts).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(', ')}...`)
      updated++
    } else {
      console.log(`  → 영양성분표 미검출`)
    }

    // 중간 저장 (10개마다)
    if ((i + 1) % 10 === 0) {
      fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf-8')
      console.log(`\n💾 중간 저장 (${i + 1}개 완료)\n`)
    }

    await page.waitForTimeout(300)
  }

  await browser.close()
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf-8')
  console.log(`\n완료: ${updated}개 업데이트, ${skipped}개 스킵`)
  console.log(`저장: ${PRODUCTS_PATH}`)
}

main().catch(console.error)
