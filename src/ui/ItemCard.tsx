import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { directionsLink, mapLink } from '../domain/links'
import type { ScheduledTime } from '../domain/schedule'
import type { Category, Item } from '../domain/types'

const CATEGORY_LABEL: Record<Category, string> = {
  spot: '景點',
  food: '美食',
  transport: '交通',
  stay: '住宿',
}

const CATEGORY_ICON: Record<Category, string> = {
  spot: '📍',
  food: '🍜',
  transport: '🚃',
  stay: '🛏️',
}

type Props = {
  item: Item
  scheduled?: ScheduledTime
  onToggleDone: (item: Item) => void
  onToggleSkip: (item: Item) => void
  onEdit: (item: Item) => void
}

export function ItemCard({
  item,
  scheduled,
  onToggleDone,
  onToggleSkip,
  onEdit,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  }

  const done = item.status === 'done'
  const skipped = item.status === 'skipped'
  const href = mapLink(item.title, item.mapUrl)
  const dir = directionsLink(item.title)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`item-card status-${item.status}`}
      data-testid="item-card"
      aria-checked={done}
    >
      <button
        ref={setActivatorNodeRef}
        className="drag-handle"
        aria-label={`拖曳排序：${item.title}`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>

      <button
        type="button"
        className="check-btn"
        aria-label={done ? '取消打勾' : '打勾（去過了）'}
        aria-pressed={done}
        onClick={() => onToggleDone(item)}
      >
        {done ? '✓' : '○'}
      </button>

      <button
        type="button"
        className="item-main"
        onClick={() => onEdit(item)}
        aria-label={`編輯 ${item.title}`}
      >
        <div className="item-time-col">
          {scheduled?.startTime && (
            <span
              className={`item-time${scheduled.conflict ? ' conflict' : ''}`}
            >
              {scheduled.startTime}
              {scheduled.nextDay && <sup className="next-day">+1</sup>}
            </span>
          )}
        </div>
        <div className="item-body">
          <span className="item-title">
            {item.category && (
              <span className="cat-icon" aria-hidden="true">
                {CATEGORY_ICON[item.category]}
              </span>
            )}
            <span className={skipped ? 'struck' : undefined}>{item.title}</span>
            {skipped && <span className="sr-only">已取消</span>}
          </span>
          <span className="item-meta">
            {item.category && <span>{CATEGORY_LABEL[item.category]}</span>}
            {item.durationMin && <span>停留 {item.durationMin} 分</span>}
            {item.cost != null && <span>${item.cost}</span>}
            {scheduled?.conflict && (
              <span className="conflict-tag" role="alert">
                時間衝突
              </span>
            )}
            {item.updatedBy && <span className="by">· {item.updatedBy}</span>}
          </span>
          {item.note && <span className="item-note">{item.note}</span>}
        </div>
      </button>

      <div className="item-actions">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-link"
          aria-label={`在地圖開啟 ${item.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          🗺️
        </a>
        <a
          href={dir}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-link"
          aria-label={`導航到 ${item.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          🧭
        </a>
        {item.bookingUrl && (
          <a
            href={item.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-link"
            aria-label={`訂位／票券 ${item.title}`}
            onClick={(e) => e.stopPropagation()}
          >
            🎟️
          </a>
        )}
        <button
          type="button"
          className="icon-link"
          aria-label={skipped ? '取消劃掉' : '劃掉（取消不去）'}
          aria-pressed={skipped}
          onClick={() => onToggleSkip(item)}
        >
          ✕
        </button>
      </div>
    </li>
  )
}
