import { keyAtEnd } from '../domain/ordering'
import type { Item, Trip } from '../domain/types'

export const SAMPLE_TRIP_ID = 'demo'

// 曼谷 4 天 3 夜：11/16（一）~ 11/19（四）
export const SAMPLE_TRIP: Trip = {
  startDate: '2026-11-16',
  timezone: 'Asia/Bangkok',
}

type SamplePartial = Omit<Item, 'id' | 'order' | 'updatedAt' | 'day'> & {
  day: number | null
}

const SAMPLE_ITEMS: SamplePartial[] = [
  // Day 1 · 11/16（一）美食開場 · ARRIVAL
  {
    day: 1,
    title: '抵達曼谷 BKK 機場',
    status: 'planned',
    startTime: '17:35',
    category: 'transport',
    note: '中華航空 TPE→BKK（14:25 起飛）',
  },
  {
    day: 1,
    title: '飯店 Check-in（曼谷英迪格）',
    status: 'planned',
    category: 'stay',
    durationMin: 60,
    note: '機場搭包車前往，雙人房 3 晚',
  },
  {
    day: 1,
    title: '晚餐：Lon Lon Local Diner',
    status: 'planned',
    startTime: '19:30',
    category: 'food',
  },
  {
    day: 1,
    title: '自由活動：泳池・高空酒吧・Central Embassy',
    status: 'planned',
    category: 'spot',
    note: '可順遊紅燈區',
  },

  // Day 2 · 11/17（二）泰服 × 海鮮 × 按摩
  {
    day: 2,
    title: 'Vision Thai Studio 泰服拍攝',
    status: 'planned',
    startTime: '12:00',
    durationMin: 120,
    category: 'spot',
    note: '女士雙人 7,200 THB／情侶雙人 5,200 THB',
  },
  {
    day: 2,
    title: '吞武里 海鮮市場',
    status: 'planned',
    startTime: '14:00',
    category: 'food',
  },
  {
    day: 2,
    title: '唐人街 + 耀華力舊市場',
    status: 'planned',
    startTime: '16:30',
    category: 'spot',
    note: '珠媽媽燕窩',
  },
  {
    day: 2,
    title: 'Nature Thai Massage',
    status: 'planned',
    startTime: '18:00',
    durationMin: 90,
    category: 'spot',
    note: '@siam soi 5',
  },
  {
    day: 2,
    title: '夜生活：Shopping・酒吧・SPA',
    status: 'planned',
    category: 'spot',
    note: '酒吧美照・泳池美照',
  },

  // Day 3 · 11/18（三）比基尼 × 狗狗 × 香氛
  { day: 3, title: 'April Pool Day 泳池', status: 'planned', category: 'spot' },
  {
    day: 3,
    title: '湯普生博物館 & Lamrim 香療店',
    status: 'planned',
    category: 'spot',
  },
  {
    day: 3,
    title: '松松海鮮店',
    status: 'planned',
    category: 'food',
    note: '咖哩螃蟹滑蛋・烤河蝦・蝦粉絲煲',
  },
  { day: 3, title: 'Benkoff 臘腸抖抖', status: 'planned', category: 'food' },
  {
    day: 3,
    title: 'Tichua Rooftop Bar',
    status: 'planned',
    startTime: '20:00',
    category: 'food',
  },

  // Day 4 · 11/19（四）SHOP 最後採買 × 回家
  {
    day: 4,
    title: '行李寄放飯店，輕裝出發',
    status: 'planned',
    startTime: '09:00',
    category: 'stay',
  },
  {
    day: 4,
    title: 'Shopping：CentralWorld → Big C',
    status: 'planned',
    category: 'spot',
    note: '零食・美妝・伴手禮',
  },
  {
    day: 4,
    title: '珠媽媽燕窩（伴手禮）',
    status: 'planned',
    category: 'food',
  },
  {
    day: 4,
    title: '包車前往 BKK 機場',
    status: 'planned',
    startTime: '15:30',
    category: 'transport',
  },
  {
    day: 4,
    title: '回程 BKK→TPE',
    status: 'planned',
    startTime: '18:20',
    category: 'transport',
    note: '抵達台北 22:50',
  },

  // 待排清單：想去還沒排
  {
    day: null,
    title: '泰式料理課程',
    status: 'planned',
    category: 'food',
    note: '約 NT$961',
  },
  {
    day: null,
    title: '泰式按摩（再排一次）',
    status: 'planned',
    category: 'spot',
    note: 'NT$480–600',
  },
]

/** 用提供的 id 產生器建立範例項目（order 由同一天的尾端接續）。 */
export function buildSampleItems(makeId: () => string): Item[] {
  const items: Item[] = []
  for (const partial of SAMPLE_ITEMS) {
    const last = items
      .filter((it) => it.day === partial.day)
      .map((it) => it.order)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .at(-1)
    items.push({
      ...partial,
      id: makeId(),
      order: keyAtEnd(last ?? null),
      updatedAt: Date.now(),
    })
  }
  return items
}
