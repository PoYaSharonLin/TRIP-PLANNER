import { describe, it, expect } from 'vitest'
import { directionsLink, mapLink } from './links'

describe('links', () => {
  it('有 mapUrl 時直接使用', () => {
    const url = 'https://maps.app.goo.gl/xxxx'
    expect(mapLink('清水寺', url)).toBe(url)
  })

  it('不安全的 mapUrl 會退回用 title 組搜尋網址', () => {
    expect(mapLink('清水寺', 'javascript:alert(1)')).toBe(
      'https://www.google.com/maps/search/?api=1&query=%E6%B8%85%E6%B0%B4%E5%AF%BA',
    )
  })

  it('沒有 mapUrl 時用 title 組搜尋網址並正確編碼', () => {
    expect(mapLink('A&B 咖啡')).toBe(
      'https://www.google.com/maps/search/?api=1&query=A%26B%20%E5%92%96%E5%95%A1',
    )
  })

  it('導航網址的 destination 正確編碼', () => {
    expect(directionsLink('A&B 咖啡')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=A%26B%20%E5%92%96%E5%95%A1',
    )
  })
})
