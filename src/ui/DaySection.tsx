import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { ScheduledTime } from '../domain/schedule'
import type { Item } from '../domain/types'
import { ItemCard } from './ItemCard'

type Props = {
  /** 區塊標題，例如「第 1 天」或「待排清單」。 */
  heading: string
  /** 日期標籤，例如「11/3（二）」；待排清單沒有。 */
  dateLabel?: string
  /** 這個區塊對應的 day（null = 待排清單）；droppable id。 */
  day: number | null
  items: Item[]
  scheduled: Map<string, ScheduledTime>
  isToday?: boolean
  onToggleDone: (item: Item) => void
  onToggleSkip: (item: Item) => void
  onEdit: (item: Item) => void
  onAdd: (day: number | null) => void
}

export function DaySection({
  heading,
  dateLabel,
  day,
  items,
  scheduled,
  isToday,
  onToggleDone,
  onToggleSkip,
  onEdit,
  onAdd,
}: Props) {
  const droppableId = day == null ? 'unscheduled' : `day-${day}`
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { day },
  })

  return (
    <section
      className={`day-section${isToday ? ' is-today' : ''}`}
      aria-current={isToday ? 'date' : undefined}
      data-testid={droppableId}
    >
      <header className="day-head">
        <div>
          <h2>{heading}</h2>
          {dateLabel && <span className="day-date">{dateLabel}</span>}
          {isToday && <span className="today-badge">今天</span>}
        </div>
        <button
          type="button"
          className="add-btn"
          onClick={() => onAdd(day)}
          aria-label={`在${heading}新增項目`}
        >
          ＋
        </button>
      </header>

      <SortableContext
        items={items.map((it) => it.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul
          ref={setNodeRef}
          className={`item-list${isOver ? ' drop-over' : ''}${
            items.length === 0 ? ' empty' : ''
          }`}
        >
          {items.length === 0 && (
            <li className="empty-hint">把項目拖到這裡，或按 ＋ 新增</li>
          )}
          {items.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              scheduled={scheduled.get(it.id)}
              onToggleDone={onToggleDone}
              onToggleSkip={onToggleSkip}
              onEdit={onEdit}
            />
          ))}
        </ul>
      </SortableContext>
    </section>
  )
}
