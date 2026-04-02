interface Props {
  selected: string[]
  onChange: (symptoms: string[]) => void
}

export const SYMPTOM_CATEGORIES = [
  { category: '활력/피로', symbol: '◆', color: '#E63329', symptoms: ['피곤해요', '기운이 없어요', '만성피로예요', '아침에 일어나기 힘들어요'] },
  { category: '눈 건강', symbol: '○', color: '#1B4FD8', symptoms: ['눈꺼풀이 떨려요', '눈이 건조해요', '눈이 침침해요', '눈이 자주 충혈돼요'] },
  { category: '수면', symbol: '△', color: '#111111', symptoms: ['잠이 잘 안와요', '자도 피곤해요', '수면의 질이 나빠요', '자다가 자주 깨요'] },
  { category: '소화/장', symbol: '□', color: '#E63329', symptoms: ['소화가 안돼요', '변비예요', '장이 예민해요', '속이 더부룩해요'] },
  { category: '면역', symbol: '●', color: '#1B4FD8', symptoms: ['감기를 자주 걸려요', '면역력이 약한 것 같아요', '상처가 잘 낫지 않아요'] },
  { category: '뼈/관절', symbol: '▲', color: '#F5C800', symptoms: ['관절이 아파요', '뼈가 약한 것 같아요', '허리가 자주 아파요', '다리에 쥐가 나요'] },
  { category: '피부/모발', symbol: '■', color: '#E63329', symptoms: ['피부가 건조해요', '트러블이 많아요', '머리카락이 많이 빠져요', '손발톱이 잘 부러져요'] },
  { category: '두뇌/집중', symbol: '◇', color: '#1B4FD8', symptoms: ['집중이 잘 안돼요', '기억력이 나빠요', '머리가 자주 아파요', '두뇌활동을 늘리고 싶어요'] },
  { category: '심혈관', symbol: '▼', color: '#E63329', symptoms: ['혈압이 높아요', '콜레스테롤이 높아요', '혈액순환이 안돼요', '손발이 차요'] },
  { category: '체중/대사', symbol: '☐', color: '#111111', symptoms: ['살이 잘 안빠져요', '기초대사량을 높이고 싶어요', '체지방을 줄이고 싶어요'] },
]

export default function SymptomSelector({ selected, onChange, selectedCategories }: Props) {
  function toggle(symptom: string) {
    if (selected.includes(symptom)) onChange(selected.filter(s => s !== symptom))
    else onChange([...selected, symptom])
  }

  const categoriesToShow = selectedCategories 
    ? SYMPTOM_CATEGORIES.filter(c => selectedCategories.includes(c.category))
    : SYMPTOM_CATEGORIES

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {categoriesToShow.map(({ category, symbol, color, symptoms }) => (
        <div key={category}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 16, color, fontWeight: 700, width: 20 }}>{symbol}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#111111', letterSpacing: '2px', textTransform: 'uppercase' }}>{category}</span>
            <div style={{ flex: 1, height: 2, background: color, opacity: 0.3 }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {symptoms.map(symptom => {
              const isSelected = selected.includes(symptom)
              return (
                <button
                  key={symptom}
                  onClick={() => toggle(symptom)}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    border: `2px solid ${isSelected ? color : '#111111'}`,
                    background: isSelected ? color : '#FFFFFF',
                    color: isSelected ? (color === '#F5C800' ? '#111111' : '#FFFFFF') : '#111111',
                    boxShadow: isSelected ? '3px 3px 0 #111111' : 'none',
                    transition: 'all 0.1s',
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}
                >
                  {symptom}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
