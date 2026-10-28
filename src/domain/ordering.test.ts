import { describe, it, expect } from 'vitest'
import { keyAtEnd, keyAtStart, keyBetween, sortItems } from './ordering'

describe('ordering', () => {
  it('在 a、b 之間產生的鍵大於 a 且小於 b', () => {
    const a = keyAtEnd(null)
    const b = keyAtEnd(a)
    const mid = keyBetween(a, b)
    expect(a < mid).toBe(true)
    expect(mid < b).toBe(true)
  })

  it('放到最前面、最後面、空清單都能產生鍵', () => {
    const first = keyAtEnd(null)
    const atEnd = keyAtEnd(first)
    expect(first < atEnd).toBe(true)
    const atStart = keyAtStart(first)
    expect(atStart < first).toBe(true)
    // 空清單
    expect(typeof keyAtStart(null)).toBe('string')
    expect(typeof keyAtEnd(null)).toBe('string')
  })

  it('連續 100 次插在同一個位置，排序仍然正確', () => {
    let a = keyAtEnd(null)
    const b = keyAtEnd(a)
    const inserted: string[] = []
    for (let i = 0; i < 100; i++) {
      const mid = keyBetween(a, b)
      inserted.push(mid)
      a = mid // 每次都往 a 這側逼近，插在同一個位置
    }
    // 全部都在 (原a, b) 之間，且彼此嚴格遞增
    for (let i = 1; i < inserted.length; i++) {
      expect(inserted[i - 1] < inserted[i]).toBe(true)
    }
    expect(inserted[inserted.length - 1] < b).toBe(true)
  })

  it('sortItems 用字元碼比較，鍵含大小寫時順序正確', () => {
    // 大寫字母碼小於小寫字母
    const items = [{ order: 'a0' }, { order: 'Z5' }, { order: 'a1' }]
    const sorted = sortItems(items)
    expect(sorted.map((x) => x.order)).toEqual(['Z5', 'a0', 'a1'])
  })
})
