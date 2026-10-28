export type Trip = {
  startDate: string // "2026-11-03"
  timezone: string // "Asia/Tokyo"
}

export type ItemStatus = 'planned' | 'done' | 'skipped'
export type Category = 'spot' | 'food' | 'transport' | 'stay'

export type Item = {
  // 必要
  id: string // 文件 ID，不存進欄位
  day: number | null // 第幾天（從 1 開始）；null = 待排清單
  order: string // fractional index
  title: string // 「清水寺」
  status: ItemStatus

  // 時間
  startTime?: string // "09:30"，當地時間
  durationMin?: number // 預計停留分鐘數

  // 地點
  mapUrl?: string // 使用者貼上的 Google Maps 連結

  // 其他
  category?: Category
  note?: string
  bookingUrl?: string // 訂位、票券連結
  cost?: number

  // 協作
  updatedAt: number // 寫入時間（Firestore 版用 serverTimestamp）
  updatedBy?: string // 暱稱
}

/** 建立新項目時的輸入：由 repo 補上 id、order、updatedAt。 */
export type NewItem = Omit<Item, 'id' | 'order' | 'updatedAt'> & {
  order?: string
}
