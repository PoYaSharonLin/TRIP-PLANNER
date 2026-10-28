import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageRepo } from './localStorageRepo'
import type { Item } from '../domain/types'

beforeEach(() => localStorage.clear())

function collect(repo: LocalStorageRepo, tripId: string): Promise<Item[]> {
  return new Promise((resolve) => {
    const unsub = repo.subscribeItems(tripId, (items) => {
      unsub()
      resolve(items)
    })
  })
}

describe('LocalStorageRepo', () => {
  it('第一次建立會自動塞入範例行程', async () => {
    const repo = new LocalStorageRepo()
    const trip = await repo.getTrip('demo')
    expect(trip).not.toBeNull()
    const items = await collect(repo, 'demo')
    expect(items.length).toBeGreaterThan(0)
  })

  it('資料寫入後會持久化到 localStorage（換一個實例仍讀得到）', async () => {
    const repo = new LocalStorageRepo(false)
    const tripId = await repo.createTrip({
      startDate: '2026-11-03',
      timezone: 'Asia/Tokyo',
    })
    await repo.createItem(tripId, { day: 1, title: '清水寺', status: 'planned' })

    // 模擬重整：建立新的實例，不重新 seed
    const repo2 = new LocalStorageRepo(false)
    const trip = await repo2.getTrip(tripId)
    expect(trip?.startDate).toBe('2026-11-03')
    const items = await collect(repo2, tripId)
    expect(items.map((it) => it.title)).toContain('清水寺')
  })

  it('刪除後可以復原回原本的 day 與 order', async () => {
    const repo = new LocalStorageRepo(false)
    const tripId = await repo.createTrip({
      startDate: '2026-11-03',
      timezone: 'Asia/Tokyo',
    })
    const id = await repo.createItem(tripId, {
      day: 2,
      title: '嵐山',
      status: 'planned',
    })
    const before = (await collect(repo, tripId)).find((it) => it.id === id)!
    await repo.removeItem(tripId, id)
    expect((await collect(repo, tripId)).some((it) => it.id === id)).toBe(false)
    await repo.restoreItem(tripId, before)
    const after = (await collect(repo, tripId)).find((it) => it.id === id)!
    expect(after.day).toBe(2)
    expect(after.order).toBe(before.order)
  })

  it('訂閱者在項目變動時收到更新', async () => {
    const repo = new LocalStorageRepo(false)
    const tripId = await repo.createTrip({
      startDate: '2026-11-03',
      timezone: 'Asia/Tokyo',
    })
    const seen: number[] = []
    const unsub = repo.subscribeItems(tripId, (items) => seen.push(items.length))
    await repo.createItem(tripId, { day: 1, title: 'A', status: 'planned' })
    await repo.createItem(tripId, { day: 1, title: 'B', status: 'planned' })
    unsub()
    expect(seen.at(-1)).toBe(2)
  })
})
