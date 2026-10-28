import { useEffect, useState } from 'react'

const RECENT_KEY = 'trip.recent'

export type RecentTrip = {
  tripId: string
  label: string
  openedAt: number
}

function readRecent(): RecentTrip[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentTrip[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** 記住開過的行程（存在 localStorage）。 */
export function rememberTrip(t: RecentTrip): void {
  const next = [t, ...readRecent().filter((p) => p.tripId !== t.tripId)].slice(
    0,
    10,
  )
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

/** 監看離線狀態。 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  )
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
