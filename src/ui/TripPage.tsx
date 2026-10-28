import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useRepo } from '../data/RepoContext'
import { dateRangeLabel, dayLabel, dayToDate, todayDay } from '../domain/dates'
import { itemsOfDay } from '../domain/ordering'
import { computeDrop } from '../domain/drop'
import { scheduleTimes, type ScheduledTime } from '../domain/schedule'
import { toggleDone, toggleSkipped } from '../domain/status'
import type { Item, Trip } from '../domain/types'
import { DaySection } from './DaySection'
import { ItemSheet, type ItemDraft } from './ItemSheet'
import { UndoToast } from './UndoToast'
import { resolveDropTarget } from './dnd'
import { rememberTrip, useOnline } from './storage'

type SheetState =
  | { open: false }
  | { open: true; item: Item | null; day: number | null }

export function TripPage() {
  const { tripId = '' } = useParams()
  const repo = useRepo()
  const online = useOnline()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [extraDays, setExtraDays] = useState(0)
  const [sheet, setSheet] = useState<SheetState>({ open: false })
  const [deleted, setDeleted] = useState<Item | null>(null)
  const [copied, setCopied] = useState(false)

  // 載入 trip
  useEffect(() => {
    let alive = true
    setLoading(true)
    repo.getTrip(tripId).then((t) => {
      if (!alive) return
      setTrip(t)
      setLoading(false)
      if (t) {
        rememberTrip({
          tripId,
          label: dateRangeLabel(t.startDate, 1),
          openedAt: Date.now(),
        })
      }
    })
    return () => {
      alive = false
    }
  }, [repo, tripId])

  // 訂閱 items
  useEffect(() => {
    if (!trip) return
    const unsub = repo.subscribeItems(tripId, (next, pending) => {
      setItems(next)
      setPendingIds(pending)
    })
    return unsub
  }, [repo, tripId, trip])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const maxItemDay = items.reduce(
    (max, it) => (it.day != null && it.day > max ? it.day : max),
    0,
  )
  const todayDayValue = trip
    ? todayDay(new Date(), trip.timezone, trip.startDate)
    : null
  const baseDays = Math.max(maxItemDay, todayDayValue ?? 0, 1)
  const totalDays = baseDays + extraDays

  // 每一天的推算時間
  const scheduledByDay = useMemo(() => {
    const map = new Map<string, ScheduledTime>()
    for (let d = 1; d <= totalDays; d++) {
      for (const s of scheduleTimes(itemsOfDay(items, d))) {
        map.set(s.id, s)
      }
    }
    return map
  }, [items, totalDays])

  const handleToggleDone = useCallback(
    (item: Item) => {
      void repo.updateItem(tripId, item.id, {
        status: toggleDone(item.status),
      })
    },
    [repo, tripId],
  )

  const handleToggleSkip = useCallback(
    (item: Item) => {
      void repo.updateItem(tripId, item.id, {
        status: toggleSkipped(item.status),
      })
    },
    [repo, tripId],
  )

  const handleSave = useCallback(
    (draft: ItemDraft) => {
      if (!sheet.open) return
      if (sheet.item) {
        void repo.updateItem(tripId, sheet.item.id, draft)
      } else {
        void repo.createItem(tripId, { ...draft, status: 'planned' })
      }
      setSheet({ open: false })
    },
    [repo, tripId, sheet],
  )

  const itemsRef = useRef(items)
  itemsRef.current = items

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e
      if (!over) return
      const target = resolveDropTarget(
        itemsRef.current,
        String(active.id),
        String(over.id),
      )
      if (!target) return
      const res = computeDrop(
        itemsRef.current,
        String(active.id),
        target.day,
        target.index,
      )
      if (!res) return
      void repo.moveItem(tripId, String(active.id), res.day, res.order)
    },
    [repo, tripId],
  )

  const handleShare = useCallback(() => {
    void navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const handleDelete = useCallback(
    (item: Item) => {
      setDeleted(item)
      void repo.removeItem(tripId, item.id)
    },
    [repo, tripId],
  )

  if (loading) {
    return <main className="center">載入中…</main>
  }

  if (!trip) {
    return (
      <main className="center">
        <h1>找不到行程</h1>
        <p className="hint">連結可能打錯了一個字，請再確認一次。</p>
      </main>
    )
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `開始拖曳 ${titleOf(items, active.id)}`,
    onDragOver: ({ active, over }) =>
      over
        ? `將 ${titleOf(items, active.id)} 移到 ${titleOf(items, over.id)} 附近`
        : `${titleOf(items, active.id)} 不在可放置區`,
    onDragEnd: ({ active, over }) =>
      over
        ? `已放下 ${titleOf(items, active.id)}`
        : `取消移動 ${titleOf(items, active.id)}`,
    onDragCancel: ({ active }) => `取消移動 ${titleOf(items, active.id)}`,
  }

  const unscheduled = itemsOfDay(items, null)

  return (
    <main className="trip-page">
      <header className="trip-header">
        <div>
          <h1>{dateRangeLabel(trip.startDate, totalDays)}</h1>
          <span className="trip-sub">{trip.timezone}</span>
        </div>
        {(import.meta.env.VITE_DATA ?? 'local') !== 'local' && (
          <button type="button" className="share-btn" onClick={handleShare}>
            {copied ? '已複製連結' : '分享連結'}
          </button>
        )}
      </header>

      {!online && (
        <div className="offline-banner" role="status">
          目前離線，修改會在恢復連線後自動同步
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        accessibility={{ announcements }}
      >
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
          <DaySection
            key={d}
            day={d}
            heading={`第 ${d} 天`}
            dateLabel={dayLabel(dayToDate(trip.startDate, d))}
            items={itemsOfDay(items, d)}
            scheduled={scheduledByDay}
            isToday={todayDayValue === d}
            onToggleDone={handleToggleDone}
            onToggleSkip={handleToggleSkip}
            onEdit={(item) => setSheet({ open: true, item, day: item.day })}
            onAdd={(day) => setSheet({ open: true, item: null, day })}
          />
        ))}

        <button
          type="button"
          className="add-day-btn"
          onClick={() => setExtraDays((n) => n + 1)}
        >
          ＋ 加一天
        </button>

        <DaySection
          day={null}
          heading="待排清單"
          items={unscheduled}
          scheduled={new Map()}
          onToggleDone={handleToggleDone}
          onToggleSkip={handleToggleSkip}
          onEdit={(item) => setSheet({ open: true, item, day: item.day })}
          onAdd={(day) => setSheet({ open: true, item: null, day })}
        />
      </DndContext>

      {pendingIds.size > 0 && (
        <p className="pending-note" role="status">
          有 {pendingIds.size} 筆尚未同步
        </p>
      )}

      {sheet.open && (
        <ItemSheet
          item={sheet.item}
          defaultDay={sheet.day}
          onCancel={() => setSheet({ open: false })}
          onSave={handleSave}
          onDelete={(item) => {
            handleDelete(item)
            setSheet({ open: false })
          }}
        />
      )}

      {deleted && (
        <UndoToast
          message={`已刪除「${deleted.title}」`}
          onUndo={() => {
            void repo.restoreItem(tripId, deleted)
            setDeleted(null)
          }}
          onDismiss={() => setDeleted(null)}
        />
      )}
    </main>
  )
}

function titleOf(items: Item[], id: string | number): string {
  return items.find((it) => it.id === String(id))?.title ?? '項目'
}
