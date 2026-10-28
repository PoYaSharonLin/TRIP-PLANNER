import type { Item } from './types'

export type ScheduledTime = {
  id: string
  /** 顯示用的時間字串 "HH:MM"；無法推算時為 null（不顯示時間）。 */
  startTime: string | null
  /** 推算結果落在隔天。 */
  nextDay: boolean
  /** 推算時間晚於後面某一筆的固定時間（互相衝突）。 */
  conflict: boolean
  /** 這筆時間是使用者固定的（非推算）。 */
  fixed: boolean
}

const DEFAULT_DURATION = 60

function parseHm(hm: string): number {
  const [h, m] = hm.split(':').map((s) => Number(s))
  return h * 60 + m
}

function formatHm(totalMin: number): string {
  const minOfDay = ((totalMin % 1440) + 1440) % 1440
  const h = Math.floor(minOfDay / 60)
  const m = minOfDay % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * 依序推算每一筆的開始時間。
 * - 有固定 startTime 的照用，不被推算值覆蓋。
 * - 沒填時間的用「前一項開始時間 + 停留分鐘數」推算。
 * - 第一筆沒有時間，後面沒填時間的也不顯示時間，直到遇到固定時間。
 * - 沒填 durationMin 以 60 分計算。
 * - 推算結果跨過午夜時標示隔天。
 * - 推算時間晚於後面某一筆的固定時間時，標記衝突。
 *
 * 傳入的 items 必須已依 order 排好。
 */
export function scheduleTimes(items: Item[]): ScheduledTime[] {
  // 先算出每一筆的推算/固定分鐘數。
  let cursor: number | null = null
  const computed = items.map((it) => {
    const dur = it.durationMin ?? DEFAULT_DURATION
    if (it.startTime) {
      const min = parseHm(it.startTime)
      cursor = min + dur
      return { id: it.id, min, fixed: true }
    }
    if (cursor == null) {
      return { id: it.id, min: null as number | null, fixed: false }
    }
    const min = cursor
    cursor = cursor + dur
    return { id: it.id, min, fixed: false }
  })

  return computed.map((c, i) => {
    if (c.min == null) {
      return {
        id: c.id,
        startTime: null,
        nextDay: false,
        conflict: false,
        fixed: false,
      }
    }
    let conflict = false
    if (!c.fixed) {
      for (let j = i + 1; j < computed.length; j++) {
        const next = computed[j]
        if (next.fixed && next.min != null && c.min > next.min) {
          conflict = true
          break
        }
      }
    }
    return {
      id: c.id,
      startTime: formatHm(c.min),
      nextDay: c.min >= 1440,
      conflict,
      fixed: c.fixed,
    }
  })
}
