import { describe, it, expect } from 'vitest'
import { safeUrl, toggleDone, toggleSkipped } from './status'

describe('status transitions', () => {
  it('planned → 打勾 → done → 再打勾 → planned', () => {
    expect(toggleDone('planned')).toBe('done')
    expect(toggleDone('done')).toBe('planned')
  })

  it('planned → 劃掉 → skipped → 再劃掉 → planned', () => {
    expect(toggleSkipped('planned')).toBe('skipped')
    expect(toggleSkipped('skipped')).toBe('planned')
  })

  it('done 狀態下劃掉 → skipped', () => {
    expect(toggleSkipped('done')).toBe('skipped')
  })
})

describe('safeUrl', () => {
  it('接受 https 短網址', () => {
    expect(safeUrl('https://maps.app.goo.gl/xxxx')).toBe(
      'https://maps.app.goo.gl/xxxx',
    )
  })

  it('接受 http', () => {
    expect(safeUrl('http://example.com')).toBe('http://example.com')
  })

  it('拒絕 javascript:、data:、空字串', () => {
    expect(safeUrl('javascript:alert(1)')).toBeNull()
    expect(safeUrl('data:text/html,<h1>x</h1>')).toBeNull()
    expect(safeUrl('')).toBeNull()
    expect(safeUrl('   ')).toBeNull()
    expect(safeUrl('not a url')).toBeNull()
  })

  it('前後空白會先去掉', () => {
    expect(safeUrl('  https://example.com  ')).toBe('https://example.com')
  })
})
