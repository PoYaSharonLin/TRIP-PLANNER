import { describe, it, expect } from 'vitest'
import { scheduleTimes } from './schedule'
import type { Item } from './types'

let seq = 0
function item(partial: Partial<Item>): Item {
  seq += 1
  return {
    id: `i${seq}`,
    day: 1,
    order: `a${seq}`,
    title: 'x',
    status: 'planned',
    updatedAt: 0,
    ...partial,
  }
}

describe('scheduleTimes', () => {
  it('第一筆 09:00 停留 60 分 → 第二筆沒填時間時推算為 10:00', () => {
    const r = scheduleTimes([
      item({ startTime: '09:00', durationMin: 60 }),
      item({}),
    ])
    expect(r[0].startTime).toBe('09:00')
    expect(r[1].startTime).toBe('10:00')
  })

  it('有固定時間的項目不會被推算值覆蓋', () => {
    const r = scheduleTimes([
      item({ startTime: '09:00', durationMin: 60 }),
      item({ startTime: '12:30' }),
    ])
    expect(r[1].startTime).toBe('12:30')
    expect(r[1].fixed).toBe(true)
  })

  it('推算時間晚於下一筆的固定時間 → 標記衝突', () => {
    const r = scheduleTimes([
      item({ startTime: '09:00', durationMin: 120 }), // 到 11:00
      item({}), // 推算 11:00
      item({ startTime: '10:30' }), // 固定 10:30，比 11:00 早
    ])
    expect(r[1].startTime).toBe('11:00')
    expect(r[1].conflict).toBe(true)
  })

  it('沒填 durationMin 時以 60 分計算', () => {
    const r = scheduleTimes([item({ startTime: '09:00' }), item({})])
    expect(r[1].startTime).toBe('10:00')
  })

  it('第一筆沒有時間 → 後面沒填時間的也不顯示時間，直到遇到固定時間', () => {
    const r = scheduleTimes([
      item({}),
      item({}),
      item({ startTime: '13:00' }),
      item({}),
    ])
    expect(r[0].startTime).toBeNull()
    expect(r[1].startTime).toBeNull()
    expect(r[2].startTime).toBe('13:00')
    expect(r[3].startTime).toBe('14:00')
  })

  it('23:30 + 60 分 → "00:30" 並標示隔天', () => {
    const r = scheduleTimes([
      item({ startTime: '23:30', durationMin: 60 }),
      item({}),
    ])
    expect(r[1].startTime).toBe('00:30')
    expect(r[1].nextDay).toBe(true)
  })
})
