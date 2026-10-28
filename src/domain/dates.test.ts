import { describe, it, expect } from 'vitest'
import { dateRangeLabel, dayLabel, dayToDate, todayDay } from './dates'

describe('dates', () => {
  it('dayToDate 跨年', () => {
    expect(dayToDate('2026-12-30', 4)).toBe('2027-01-02')
  })

  it('dayToDate 第一天就是 startDate 本身', () => {
    expect(dayToDate('2026-11-03', 1)).toBe('2026-11-03')
  })

  it('dayToDate 不受夏令時間切換影響', () => {
    // 2026-10-25 是歐洲夏令時間結束當天；用日曆運算不會差一天
    expect(dayToDate('2026-10-24', 2)).toBe('2026-10-25')
  })

  it('dayLabel', () => {
    expect(dayLabel('2026-11-03')).toBe('11/3（二）')
  })

  it('dateRangeLabel', () => {
    expect(dateRangeLabel('2026-11-03', 5)).toBe('11/3（二）– 11/7（六）')
  })

  it('dateRangeLabel 單天只顯示一個日期', () => {
    expect(dateRangeLabel('2026-11-03', 1)).toBe('11/3（二）')
  })

  it('todayDay：東京已跨到隔天時算第 2 天', () => {
    // 2026-11-03T15:30:00Z，東京 (+9) 已是 11/4
    const now = new Date('2026-11-03T15:30:00Z')
    expect(todayDay(now, 'Asia/Tokyo', '2026-11-03')).toBe(2)
  })

  it('todayDay：行程開始前回傳 null', () => {
    const now = new Date('2026-11-01T00:00:00Z')
    expect(todayDay(now, 'Asia/Tokyo', '2026-11-03', 5)).toBeNull()
  })

  it('todayDay：行程結束後回傳 null', () => {
    const now = new Date('2026-11-30T00:00:00Z')
    expect(todayDay(now, 'Asia/Tokyo', '2026-11-03', 5)).toBeNull()
  })
})
