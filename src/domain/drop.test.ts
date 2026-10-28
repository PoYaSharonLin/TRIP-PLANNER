import { describe, it, expect } from 'vitest'
import { computeDrop } from './drop'
import { keyAtEnd } from './ordering'
import type { Item } from './types'

function makeDay(day: number | null, count: number, startSeq = 0): Item[] {
  const items: Item[] = []
  let order: string | null = null
  for (let i = 0; i < count; i++) {
    order = keyAtEnd(order)
    items.push({
      id: `d${day}-${startSeq + i}`,
      day,
      order,
      title: `t${i}`,
      status: 'planned',
      updatedAt: 0,
    })
  }
  return items
}

describe('computeDrop', () => {
  it('拖到同一天的兩筆之間 → order 介於兩者之間', () => {
    const items = makeDay(1, 3) // index 0,1,2
    const [a, b, c] = items
    // 把 c 拖到 a、b 之間（排除 c 後清單是 [a,b]，插在 index 1）
    const res = computeDrop(items, c.id, 1, 1)
    expect(res).not.toBeNull()
    expect(res!.day).toBe(1)
    expect(a.order < res!.order).toBe(true)
    expect(res!.order < b.order).toBe(true)
  })

  it('拖到某一天的最後面', () => {
    const items = makeDay(1, 3)
    const [a] = items
    const res = computeDrop(items, a.id, 1, 2) // 排除 a 後有 2 筆，插在尾端
    expect(res).not.toBeNull()
    const last = items[2]
    expect(last.order < res!.order).toBe(true)
  })

  it('拖到沒有任何項目的一天', () => {
    const items = makeDay(1, 2)
    const [a] = items
    const res = computeDrop(items, a.id, 5, 0)
    expect(res).not.toBeNull()
    expect(res!.day).toBe(5)
    expect(typeof res!.order).toBe('string')
  })

  it('拖到待排清單 → day 為 null', () => {
    const items = makeDay(1, 2)
    const [a] = items
    const res = computeDrop(items, a.id, null, 0)
    expect(res).not.toBeNull()
    expect(res!.day).toBeNull()
  })

  it('拖回原位 → 回傳 null，不產生任何更新', () => {
    const items = makeDay(1, 3)
    const [, b] = items
    // b 原本在 index 1；排除後清單 [a,c]，插在 index 1 → 回原位
    const res = computeDrop(items, b.id, 1, 1)
    expect(res).toBeNull()
  })
})
