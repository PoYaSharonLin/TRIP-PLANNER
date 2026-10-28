import { useEffect, useId, useRef, useState } from 'react'
import { safeUrl } from '../domain/status'
import type { Category, Item, ItemStatus } from '../domain/types'

export type ItemDraft = {
  title: string
  day: number | null
  status: ItemStatus
  startTime?: string
  durationMin?: number
  mapUrl?: string
  category?: Category
  note?: string
  bookingUrl?: string
  cost?: number
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'spot', label: '景點' },
  { value: 'food', label: '美食' },
  { value: 'transport', label: '交通' },
  { value: 'stay', label: '住宿' },
]

type Props = {
  /** 編輯既有項目；null = 新增。 */
  item: Item | null
  /** 新增時的預設天。 */
  defaultDay: number | null
  onCancel: () => void
  onSave: (draft: ItemDraft) => void
  /** 編輯既有項目時提供，顯示刪除按鈕。 */
  onDelete?: (item: Item) => void
}

export function ItemSheet({
  item,
  defaultDay,
  onCancel,
  onSave,
  onDelete,
}: Props) {
  const titleId = useId()
  const [title, setTitle] = useState(item?.title ?? '')
  const [day, setDay] = useState<number | null>(item?.day ?? defaultDay)
  const [startTime, setStartTime] = useState(item?.startTime ?? '')
  const [durationMin, setDurationMin] = useState(
    item?.durationMin != null ? String(item.durationMin) : '',
  )
  const [category, setCategory] = useState<Category | ''>(item?.category ?? '')
  const [mapUrl, setMapUrl] = useState(item?.mapUrl ?? '')
  const [bookingUrl, setBookingUrl] = useState(item?.bookingUrl ?? '')
  const [note, setNote] = useState(item?.note ?? '')
  const [cost, setCost] = useState(item?.cost != null ? String(item.cost) : '')

  const firstFieldRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    firstFieldRef.current?.focus()
  }, [])

  const titleEmpty = title.trim().length === 0
  const mapUrlBad = mapUrl.trim() !== '' && safeUrl(mapUrl) === null
  const bookingUrlBad = bookingUrl.trim() !== '' && safeUrl(bookingUrl) === null
  const canSave = !titleEmpty && !mapUrlBad && !bookingUrlBad

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    const draft: ItemDraft = {
      title: title.trim(),
      day,
      status: item?.status ?? 'planned',
      startTime: startTime.trim() || undefined,
      durationMin: durationMin.trim() ? Number(durationMin) : undefined,
      category: category || undefined,
      mapUrl: mapUrl.trim() || undefined,
      bookingUrl: bookingUrl.trim() || undefined,
      note: note.trim() || undefined,
      cost: cost.trim() ? Number(cost) : undefined,
    }
    onSave(draft)
  }

  return (
    <div
      className="sheet-backdrop"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <header className="sheet-head">
            <h2 id={titleId}>{item ? '編輯項目' : '新增項目'}</h2>
            <button type="button" className="link-btn" onClick={onCancel}>
              取消
            </button>
          </header>

          <label className="field">
            <span>名稱</span>
            <input
              ref={firstFieldRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：清水寺"
              aria-invalid={titleEmpty}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>第幾天</span>
              <select
                value={day == null ? '' : String(day)}
                onChange={(e) =>
                  setDay(e.target.value === '' ? null : Number(e.target.value))
                }
              >
                <option value="">待排清單</option>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    第 {d} 天
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>分類</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category | '')}
              >
                <option value="">未分類</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>開始時間</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label className="field">
              <span>停留（分鐘）</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="60"
              />
            </label>
          </div>

          <label className="field">
            <span>Google Maps 連結</span>
            <input
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="貼上地圖分享連結（可留空）"
              aria-invalid={mapUrlBad}
            />
            {mapUrlBad && (
              <span className="field-error" role="alert">
                請貼 http(s) 開頭的連結
              </span>
            )}
          </label>

          <label className="field">
            <span>訂位／票券連結</span>
            <input
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
              placeholder="可留空"
              aria-invalid={bookingUrlBad}
            />
            {bookingUrlBad && (
              <span className="field-error" role="alert">
                請貼 http(s) 開頭的連結
              </span>
            )}
          </label>

          <div className="field-row">
            <label className="field">
              <span>花費</span>
              <input
                type="number"
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="可留空"
              />
            </label>
          </div>

          <label className="field">
            <span>備註</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </label>

          <button type="submit" className="primary-btn" disabled={!canSave}>
            儲存
          </button>

          {item && onDelete && (
            <button
              type="button"
              className="delete-btn"
              onClick={() => onDelete(item)}
            >
              刪除這個項目
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
