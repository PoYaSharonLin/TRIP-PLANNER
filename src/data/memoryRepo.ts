import { nanoid } from 'nanoid'
import { keyAtEnd } from '../domain/ordering'
import type { Item, NewItem, Trip } from '../domain/types'
import type { Repo } from './repo'
import { SAMPLE_TRIP, SAMPLE_TRIP_ID, buildSampleItems } from './sample'

type Listener = (items: Item[], pendingIds: Set<string>) => void

/**
 * 記憶體版 repo。M2、M3 與元件測試用；附一份範例資料。
 * 行為刻意用 setTimeout(0) 模擬非同步，讓 UI 的 loading 流程也能測到。
 */
export class MemoryRepo implements Repo {
  private trips = new Map<string, Trip>()
  private items = new Map<string, Map<string, Item>>()
  private listeners = new Map<string, Set<Listener>>()

  constructor(seed = true) {
    if (seed) this.seedSample()
  }

  async getTrip(tripId: string): Promise<Trip | null> {
    return this.trips.get(tripId) ?? null
  }

  async createTrip(trip: Trip): Promise<string> {
    const id = nanoid()
    this.trips.set(id, { ...trip })
    this.items.set(id, new Map())
    return id
  }

  async updateTrip(tripId: string, patch: Partial<Trip>): Promise<void> {
    const cur = this.trips.get(tripId)
    if (!cur) throw new Error('trip not found')
    this.trips.set(tripId, { ...cur, ...patch })
  }

  subscribeItems(tripId: string, onChange: Listener): () => void {
    let set = this.listeners.get(tripId)
    if (!set) {
      set = new Set()
      this.listeners.set(tripId, set)
    }
    set.add(onChange)
    // 立即推送一次目前狀態
    queueMicrotask(() => onChange(this.listOf(tripId), new Set()))
    return () => {
      set!.delete(onChange)
    }
  }

  async createItem(tripId: string, input: NewItem): Promise<string> {
    const map = this.ensureItems(tripId)
    const id = nanoid()
    const order = input.order ?? this.nextOrder(tripId, input.day)
    const item: Item = {
      ...input,
      id,
      order,
      updatedAt: Date.now(),
    }
    map.set(id, pruneUndefined(item))
    this.emit(tripId)
    return id
  }

  async updateItem(
    tripId: string,
    id: string,
    patch: Partial<Item>,
  ): Promise<void> {
    const map = this.ensureItems(tripId)
    const cur = map.get(id)
    if (!cur) throw new Error('item not found')
    map.set(id, pruneUndefined({ ...cur, ...patch, updatedAt: Date.now() }))
    this.emit(tripId)
  }

  async moveItem(
    tripId: string,
    id: string,
    day: number | null,
    order: string,
  ): Promise<void> {
    await this.updateItem(tripId, id, { day, order })
  }

  async removeItem(tripId: string, id: string): Promise<void> {
    const map = this.ensureItems(tripId)
    map.delete(id)
    this.emit(tripId)
  }

  async restoreItem(tripId: string, item: Item): Promise<void> {
    const map = this.ensureItems(tripId)
    map.set(item.id, { ...item })
    this.emit(tripId)
  }

  // --- helpers ---

  private ensureItems(tripId: string): Map<string, Item> {
    let map = this.items.get(tripId)
    if (!map) {
      map = new Map()
      this.items.set(tripId, map)
    }
    return map
  }

  private listOf(tripId: string): Item[] {
    return [...(this.items.get(tripId)?.values() ?? [])]
  }

  private nextOrder(tripId: string, day: number | null): string {
    const inDay = this.listOf(tripId)
      .filter((it) => it.day === day)
      .map((it) => it.order)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    return keyAtEnd(inDay.length ? inDay[inDay.length - 1] : null)
  }

  private emit(tripId: string): void {
    const items = this.listOf(tripId)
    this.listeners.get(tripId)?.forEach((fn) => fn(items, new Set()))
  }

  private seedSample(): void {
    this.trips.set(SAMPLE_TRIP_ID, { ...SAMPLE_TRIP })
    const map = new Map<string, Item>()
    for (const it of buildSampleItems(() => nanoid())) {
      map.set(it.id, pruneUndefined(it))
    }
    this.items.set(SAMPLE_TRIP_ID, map)
  }
}

/** 移除值為 undefined 的欄位（對齊 Firestore ignoreUndefinedProperties）。 */
function pruneUndefined<T extends object>(obj: T): T {
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}
