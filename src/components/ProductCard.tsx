import type { RecommendedProduct } from '../types'

interface Props {
  item: RecommendedProduct
}

const PRIORITY_CONFIG = {
  high:   { label: 'HIGH', bg: '#E63329', text: '#FFFFFF' },
  medium: { label: 'MID',  bg: '#F5C800', text: '#111111' },
  low:    { label: 'LOW',  bg: '#FFFFFF', text: '#111111' },
}

export default function ProductCard({ item }: Props) {
  const { product, reason, priority, matchedSymptoms } = item
  const cfg = PRIORITY_CONFIG[priority]

  return (
    <div style={{
      background: '#FFFFFF',
      border: '3px solid #111111',
      boxShadow: '5px 5px 0 #111111',
    }}>
      {/* 우선순위 바 */}
      <div style={{ background: cfg.bg, borderBottom: '2px solid #111111', padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: cfg.text, letterSpacing: '2px' }}>{cfg.label} PRIORITY</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: cfg.text }}>{product.category}</span>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111111', letterSpacing: '-0.3px', lineHeight: 1.2 }}>{product.name}</h3>
            <p style={{ fontSize: 11, color: '#888888', marginTop: 3, fontWeight: 500 }}>{product.brand}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#E63329' }}>{product.price.toLocaleString()}원</p>
            {product.originalPrice && (
              <p style={{ fontSize: 12, color: '#AAAAAA', textDecoration: 'line-through' }}>{product.originalPrice.toLocaleString()}원</p>
            )}
          </div>
        </div>

        {/* 추천 이유 */}
        <div style={{ background: '#F5F0E8', border: '2px solid #111111', padding: '10px 14px' }}>
          <p style={{ fontSize: 13, color: '#111111', lineHeight: 1.6 }}>{reason}</p>
        </div>

        {/* 증상 태그 */}
        {matchedSymptoms.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {matchedSymptoms.map(symptom => (
              <span key={symptom} style={{
                fontSize: 10,
                fontWeight: 600,
                color: '#111111',
                border: '1.5px solid #111111',
                padding: '2px 8px',
                background: '#F5F0E8',
              }}>
                {symptom}
              </span>
            ))}
          </div>
        )}

        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '10px 0',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            textDecoration: 'none',
            border: '2px solid #111111',
            background: '#111111',
            color: '#F5C800',
          }}
        >
          약싸몰에서 구매 →
        </a>
      </div>
    </div>
  )
}
