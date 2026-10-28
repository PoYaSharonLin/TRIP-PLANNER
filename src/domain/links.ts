import { safeUrl } from './status'

/**
 * 項目要連去的地圖網址：
 * - 有使用者貼的 mapUrl（且安全）就直接用。
 * - 否則用 title 組 Google Maps 搜尋網址。
 */
export function mapLink(title: string, mapUrl?: string): string {
  const safe = mapUrl ? safeUrl(mapUrl) : null
  if (safe) return safe
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    title,
  )}`
}

/** 導航網址，destination 用 title。 */
export function directionsLink(title: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    title,
  )}`
}
