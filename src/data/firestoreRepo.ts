import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Item, NewItem, Trip } from '../domain/types'
import type { Repo } from './repo'

/**
 * Firestore 版 repo（M4 之後使用）。
 *
 * 注意事項（見規劃文件）：
 * - 更新只寫有變動的欄位（updateDoc），不要用 setDoc 整筆覆蓋，
 *   否則兩個人同時改同一筆的不同欄位會互相蓋掉。
 * - updatedAt 一律用 serverTimestamp()。
 * - 要移除欄位時用 deleteField()。
 * - 用 snapshot.metadata.hasPendingWrites 標示尚未同步的項目。
 */
export class FirestoreRepo implements Repo {
  async getTrip(tripId: string): Promise<Trip | null> {
    const snap = await getDoc(doc(db, 'trips', tripId))
    return snap.exists() ? (snap.data() as Trip) : null
  }

  async createTrip(trip: Trip): Promise<string> {
    const ref = doc(collection(db, 'trips'))
    await setDoc(ref, { ...trip })
    return ref.id
  }

  async updateTrip(tripId: string, patch: Partial<Trip>): Promise<void> {
    await updateDoc(doc(db, 'trips', tripId), { ...patch })
  }

  subscribeItems(
    tripId: string,
    onChange: (items: Item[], pendingIds: Set<string>) => void,
  ): () => void {
    const col = collection(db, 'trips', tripId, 'items')
    return onSnapshot(col, { includeMetadataChanges: true }, (snap) => {
      const items: Item[] = []
      const pending = new Set<string>()
      snap.forEach((d) => {
        const data = d.data() as Omit<Item, 'id'>
        items.push({ ...data, id: d.id })
        if (d.metadata.hasPendingWrites) pending.add(d.id)
      })
      onChange(items, pending)
    })
  }

  async createItem(tripId: string, input: NewItem): Promise<string> {
    const ref = doc(collection(db, 'trips', tripId, 'items'))
    const { order, ...rest } = input
    await setDoc(ref, {
      ...rest,
      order: order ?? '',
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  async updateItem(
    tripId: string,
    id: string,
    patch: Partial<Item>,
  ): Promise<void> {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
    for (const [k, v] of Object.entries(patch)) {
      if (k === 'id' || k === 'updatedAt') continue
      payload[k] = v === undefined ? deleteField() : v
    }
    await updateDoc(doc(db, 'trips', tripId, 'items', id), payload)
  }

  async moveItem(
    tripId: string,
    id: string,
    day: number | null,
    order: string,
  ): Promise<void> {
    await updateDoc(doc(db, 'trips', tripId, 'items', id), {
      day,
      order,
      updatedAt: serverTimestamp(),
    })
  }

  async removeItem(tripId: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'trips', tripId, 'items', id))
  }

  async restoreItem(tripId: string, item: Item): Promise<void> {
    const { id, updatedAt: _updatedAt, ...rest } = item
    void _updatedAt
    await setDoc(doc(db, 'trips', tripId, 'items', id), {
      ...rest,
      updatedAt: serverTimestamp(),
    })
  }
}
