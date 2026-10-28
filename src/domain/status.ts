import type { ItemStatus } from './types'

/**
 * 打勾（去過了）。planned/skipped → done；done → planned（取消打勾）。
 */
export function toggleDone(status: ItemStatus): ItemStatus {
  return status === 'done' ? 'planned' : 'done'
}

/**
 * 劃掉（取消不去）。planned/done → skipped；skipped → planned（取消劃掉）。
 */
export function toggleSkipped(status: ItemStatus): ItemStatus {
  return status === 'skipped' ? 'planned' : 'skipped'
}

/**
 * 驗證外部網址：只接受 http(s)，避免 javascript:、data: 這類被注入。
 * 前後空白會先去掉。通過回傳整理後的網址，否則回傳 null。
 */
export function safeUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return null
  }
  return trimmed
}
