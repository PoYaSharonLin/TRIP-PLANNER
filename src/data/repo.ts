import type { Item, NewItem, Trip } from '../domain/types'

/**
 * UI 只依賴這個介面。M2、M3 用記憶體版，M4 之後換成 Firestore 版，
 * 畫面完全不用改。
 */
export interface Repo {
  getTrip(tripId: string): Promise<Trip | null>
  createTrip(trip: Trip): Promise<string> // 回傳 tripId
  updateTrip(tripId: string, patch: Partial<Trip>): Promise<void>

  /** 訂閱項目變動；回傳取消訂閱函式。pendingIds 是尚未同步的項目。 */
  subscribeItems(
    tripId: string,
    onChange: (items: Item[], pendingIds: Set<string>) => void,
  ): () => void

  createItem(tripId: string, input: NewItem): Promise<string>
  updateItem(tripId: string, id: string, patch: Partial<Item>): Promise<void>
  moveItem(
    tripId: string,
    id: string,
    day: number | null,
    order: string,
  ): Promise<void>
  removeItem(tripId: string, id: string): Promise<void>
  restoreItem(tripId: string, item: Item): Promise<void> // 復原刪除
}
