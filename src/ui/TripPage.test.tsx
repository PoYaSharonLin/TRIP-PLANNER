import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { MemoryRepo } from '../data/memoryRepo'
import { RepoProvider } from '../data/RepoContext'
import { TripPage } from './TripPage'
import type { NewItem } from '../domain/types'

async function setup(
  items: NewItem[],
  opts: { startDate?: string; timezone?: string } = {},
) {
  localStorage.setItem('trip.nickname', '測試員')
  const repo = new MemoryRepo(false)
  const tripId = await repo.createTrip({
    startDate: opts.startDate ?? '2026-11-03',
    timezone: opts.timezone ?? 'Asia/Tokyo',
  })
  for (const it of items) {
    await repo.createItem(tripId, it)
  }
  render(
    <RepoProvider repo={repo}>
      <MemoryRouter initialEntries={[`/t/${tripId}`]}>
        <Routes>
          <Route path="/t/:tripId" element={<TripPage />} />
        </Routes>
      </MemoryRouter>
    </RepoProvider>,
  )
  return { repo, tripId }
}

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('TripPage (M2)', () => {
  it('項目依 day 分組，組內依 order 排序', async () => {
    await setup([
      { day: 1, title: '清水寺', status: 'planned' },
      { day: 1, title: '錦市場', status: 'planned' },
      { day: 2, title: '伏見稻荷', status: 'planned' },
    ])
    await screen.findByText('清水寺')
    const day1 = screen.getByTestId('day-1')
    const titles = within(day1)
      .getAllByTestId('item-card')
      .map((c) => c.textContent)
    expect(titles[0]).toContain('清水寺')
    expect(titles[1]).toContain('錦市場')
    const day2 = screen.getByTestId('day-2')
    expect(within(day2).getByText('伏見稻荷')).toBeInTheDocument()
  })

  it('待排清單只顯示 day = null 的項目', async () => {
    await setup([
      { day: 1, title: '清水寺', status: 'planned' },
      { day: null, title: '金閣寺', status: 'planned' },
    ])
    await screen.findByText('金閣寺')
    const unsched = screen.getByTestId('unscheduled')
    expect(within(unsched).getByText('金閣寺')).toBeInTheDocument()
    expect(within(unsched).queryByText('清水寺')).toBeNull()
  })

  it('點打勾後卡片 aria-checked 為 true', async () => {
    const user = userEvent.setup()
    await setup([{ day: 1, title: '清水寺', status: 'planned' }])
    const card = await screen.findByTestId('item-card')
    expect(card).toHaveAttribute('aria-checked', 'false')
    await user.click(within(card).getByLabelText('打勾（去過了）'))
    await waitFor(() =>
      expect(screen.getByTestId('item-card')).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    )
  })

  it('劃掉後標題有刪除線並有「已取消」螢幕報讀文字', async () => {
    const user = userEvent.setup()
    await setup([{ day: 1, title: '清水寺', status: 'planned' }])
    const card = await screen.findByTestId('item-card')
    await user.click(within(card).getByLabelText('劃掉（取消不去）'))
    await waitFor(() => {
      const struck = screen.getByText('清水寺')
      expect(struck).toHaveClass('struck')
    })
    expect(screen.getByText('已取消')).toBeInTheDocument()
  })

  it('title 空白時「儲存」按鈕無法送出', async () => {
    const user = userEvent.setup()
    await setup([])
    const day1 = await screen.findByTestId('day-1')
    await user.click(within(day1).getByRole('button', { name: /新增項目/ }))
    const save = await screen.findByRole('button', { name: '儲存' })
    expect(save).toBeDisabled()
    await user.type(screen.getByPlaceholderText('例：清水寺'), '新大阪')
    expect(save).toBeEnabled()
  })

  it('mapUrl 填 javascript: 時顯示錯誤訊息', async () => {
    const user = userEvent.setup()
    await setup([{ day: 1, title: '清水寺', status: 'planned' }])
    const card = await screen.findByTestId('item-card')
    await user.click(within(card).getByLabelText('編輯 清水寺'))
    const mapInput = await screen.findByPlaceholderText(
      '貼上地圖分享連結（可留空）',
    )
    await user.type(mapInput, 'javascript:alert(1)')
    expect(screen.getByText('請貼 http(s) 開頭的連結')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '儲存' })).toBeDisabled()
  })

  it('地圖按鈕 href 正確，target=_blank，rel 含 noopener', async () => {
    await setup([{ day: 1, title: '清水寺', status: 'planned' }])
    const card = await screen.findByTestId('item-card')
    const link = within(card).getByLabelText('在地圖開啟 清水寺')
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=%E6%B8%85%E6%B0%B4%E5%AF%BA',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('刪除後按「復原」，項目回到原本的 day 和 order', async () => {
    const user = userEvent.setup()
    const { repo, tripId } = await setup([
      { day: 1, title: '清水寺', status: 'planned' },
    ])
    const card = await screen.findByTestId('item-card')
    await user.click(within(card).getByLabelText('編輯 清水寺'))
    await user.click(await screen.findByRole('button', { name: '刪除這個項目' }))
    await waitFor(() => expect(screen.queryByText('清水寺')).toBeNull())
    await user.click(screen.getByRole('button', { name: '復原' }))
    await waitFor(() => expect(screen.getByText('清水寺')).toBeInTheDocument())
    // 確認仍在第 1 天
    const day1 = screen.getByTestId('day-1')
    expect(within(day1).getByText('清水寺')).toBeInTheDocument()
    void repo
    void tripId
  })

  it('今天的區塊有 aria-current="date"', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // UTC 15:30 → 東京 +9 已是 11/4 → 第 2 天
    vi.setSystemTime(new Date('2026-11-03T15:30:00Z'))
    await setup([
      { day: 1, title: '第一天行程', status: 'planned' },
      { day: 2, title: '第二天行程', status: 'planned' },
    ])
    await screen.findByText('第二天行程')
    const day2 = screen.getByTestId('day-2')
    expect(day2).toHaveAttribute('aria-current', 'date')
    expect(screen.getByTestId('day-1')).not.toHaveAttribute('aria-current')
  })

  it('推算出的時間和衝突標示有顯示在卡片上', async () => {
    await setup([
      { day: 1, title: 'A', status: 'planned', startTime: '09:00', durationMin: 120 },
      { day: 1, title: 'B', status: 'planned' }, // 推算 11:00
      { day: 1, title: 'C', status: 'planned', startTime: '10:30' }, // 比 11:00 早 → 衝突
    ])
    await screen.findByText('B')
    expect(screen.getByText('11:00')).toBeInTheDocument()
    expect(screen.getAllByText('時間衝突').length).toBeGreaterThan(0)
  })
})
