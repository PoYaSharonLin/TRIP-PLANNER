const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六']

function parseYmd(ymd: string): { y: number; m: number; d: number } {
  const [y, m, d] = ymd.split('-').map((s) => Number(s))
  return { y, m, d }
}

function toYmd(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

/**
 * startDate 加上第 day 天（day 從 1 開始）得到當天日期。
 * 用日曆運算 Date.UTC(y, m-1, d + day - 1)，不要用加毫秒，
 * 否則遇到夏令時間切換那天會差一天。
 */
export function dayToDate(startDate: string, day: number): string {
  const { y, m, d } = parseYmd(startDate)
  const date = new Date(Date.UTC(y, m - 1, d + day - 1))
  return toYmd(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  )
}

/** "2026-11-03" → "11/3（二）" */
export function dayLabel(ymd: string): string {
  const { y, m, d } = parseYmd(ymd)
  const weekday = WEEKDAYS_ZH[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${m}/${d}（${weekday}）`
}

/**
 * 整趟日期區間，例如 "11/3（二）– 11/7（六）"。
 * totalDays 是行程總天數（含頭尾）。
 */
export function dateRangeLabel(startDate: string, totalDays: number): string {
  const start = dayLabel(startDate)
  if (totalDays <= 1) return start
  const end = dayLabel(dayToDate(startDate, totalDays))
  return `${start}– ${end}`
}

/**
 * 依時區判斷「今天是第幾天」（從 1 開始）。
 * 行程開始前、結束後都回傳 null。
 * @param now  現在時間
 * @param timezone  IANA 時區，例如 "Asia/Tokyo"
 * @param startDate  行程起始日 "YYYY-MM-DD"
 * @param totalDays  行程總天數；不給則不設結束上限
 */
export function todayDay(
  now: Date,
  timezone: string,
  startDate: string,
  totalDays?: number,
): number | null {
  const localYmd = localDateInTz(now, timezone)
  const diff = daysBetween(startDate, localYmd)
  if (diff < 0) return null
  const day = diff + 1
  if (totalDays != null && day > totalDays) return null
  return day
}

/** 在指定時區下，now 當地的日期字串 "YYYY-MM-DD"。 */
export function localDateInTz(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  // en-CA 的格式就是 YYYY-MM-DD
  return parts
}

/** 兩個日期字串相差幾天（b - a），用日曆運算。 */
function daysBetween(a: string, b: string): number {
  const pa = parseYmd(a)
  const pb = parseYmd(b)
  const ua = Date.UTC(pa.y, pa.m - 1, pa.d)
  const ub = Date.UTC(pb.y, pb.m - 1, pb.d)
  return Math.round((ub - ua) / 86400000)
}
