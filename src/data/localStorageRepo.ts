import { nanoid } from 'nanoid'
import { keyAtEnd } from '../domain/ordering'
import type { Item, NewItem, Trip } from '../domain/types'
import type { Repo } from './repo'
import { SAMPLE_TRIP, SAMPLE_TRIP_ID, buildSampleItems } from './sample'

const PREFIX = 'trip.v2'
const TRIPS_KEY = `${PREFIX}.trips`
const itemsKey = (tripId: string) => `${PREFIX}.items.${tripId}`

type Listener = (items: Item[], pendingIds: Set<string>) => void

/**
 * 單人、單裝置用：把資料存在瀏覽器 localStorage。
 * 重整不掉、離線完全可用、免後端。畫面不用改。
 * 同一台裝置開多個分頁時，用 storage 事件保持同步。
 */
export class LocalStorageRepo implements Repo {
  private listeners = new Map<string, Set<Listener>>()

  constructor(seed = true) {
    if (seed) this.seedIfEmpty()
    window.addEventListener('storage', this.onStorage)
  }

  private onStorage = (e: StorageEvent) => {
    if (!e.key || !e.key.startsWith(`${PREFIX}.items.`)) return
    const tripId = e.key.slice(`${PREFIX}.items.`.length)
    this.emit(tripId)
  }

  async getTrip(tripId: string): Promise<Trip | null> {
    return this.readTrips()[tripId] ?? null
  }

  async createTrip(trip: Trip): Promise<string> {
    const id = nanoid()
    const trips = this.readTrips()
    trips[id] = { ...trip }
    this.writeTrips(trips)
    this.writeItems(id, [])
    return id
  }

  async updateTrip(tripId: string, patch: Partial<Trip>): Promise<void> {
    const trips = this.readTrips()
    if (!trips[tripId]) throw new Error('trip not found')
    trips[tripId] = { ...trips[tripId], ...patch }
    this.writeTrips(trips)
  }

  subscribeItems(tripId: string, onChange: Listener): () => void {
    let set = this.listeners.get(tripId)
    if (!set) {
      set = new Set()
      this.listeners.set(tripId, set)
    }
    set.add(onChange)
    queueMicrotask(() => onChange(this.readItems(tripId), new Set()))
    return () => {
      set!.delete(onChange)
    }
  }

  async createItem(tripId: string, input: NewItem): Promise<string> {
    const items = this.readItems(tripId)
    const id = nanoid()
    const order = input.order ?? this.nextOrder(items, input.day)
    items.push(prune({ ...input, id, order, updatedAt: Date.now() }))
    this.writeItems(tripId, items)
    this.emit(tripId)
    return id
  }

  async updateItem(
    tripId: string,
    id: string,
    patch: Partial<Item>,
  ): Promise<void> {
    const items = this.readItems(tripId)
    const idx = items.findIndex((it) => it.id === id)
    if (idx === -1) throw new Error('item not found')
    items[idx] = prune({ ...items[idx], ...patch, updatedAt: Date.now() })
    this.writeItems(tripId, items)
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
    const items = this.readItems(tripId).filter((it) => it.id !== id)
    this.writeItems(tripId, items)
    this.emit(tripId)
  }

  async restoreItem(tripId: string, item: Item): Promise<void> {
    const items = this.readItems(tripId)
    if (!items.some((it) => it.id === item.id)) items.push({ ...item })
    this.writeItems(tripId, items)
    this.emit(tripId)
  }

  // --- storage helpers ---

  private readTrips(): Record<string, Trip> {
    return readJson<Record<string, Trip>>(TRIPS_KEY, {})
  }
  private writeTrips(trips: Record<string, Trip>): void {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(trips))
  }
  private readItems(tripId: string): Item[] {
    return readJson<Item[]>(itemsKey(tripId), [])
  }
  private writeItems(tripId: string, items: Item[]): void {
    localStorage.setItem(itemsKey(tripId), JSON.stringify(items))
  }

  private nextOrder(items: Item[], day: number | null): string {
    const last = items
      .filter((it) => it.day === day)
      .map((it) => it.order)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .at(-1)
    return keyAtEnd(last ?? null)
  }

  private emit(tripId: string): void {
    const items = this.readItems(tripId)
    this.listeners.get(tripId)?.forEach((fn) => fn(items, new Set()))
  }

  private seedIfEmpty(): void {
    const trips = this.readTrips()
    if (Object.keys(trips).length > 0) return
    trips[SAMPLE_TRIP_ID] = { ...SAMPLE_TRIP }
    this.writeTrips(trips)
    this.writeItems(
      SAMPLE_TRIP_ID,
      buildSampleItems(() => nanoid()).map(prune),
    )
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function prune<T extends object>(obj: T): T {
  const out = {} as Record<string, unknown>
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}
