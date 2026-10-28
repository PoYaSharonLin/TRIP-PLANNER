import { itemsOfDay } from '../domain/ordering'
import type { Item } from '../domain/types'

/** droppable 容器 id ↔ day 的轉換。 */
export function containerToDay(id: string): number | null {
  if (id === 'unscheduled') return null
  if (id.startsWith('day-')) return Number(id.slice(4))
  return null
}

export type DropTarget = { day: number | null; index: number }

/**
 * 依 dnd-kit 的 active/over 算出要插入的目標天與位置（排除被移動項目）。
 * over 可能是另一個項目，或是空容器本身。
 */
export function resolveDropTarget(
  items: Item[],
  activeId: string,
  overId: string,
): DropTarget | null {
  const active = items.find((it) => it.id === activeId)
  if (!active) return null

  // 放在容器本身（空的一天或待排清單）→ 放到最後面。
  const overItem = items.find((it) => it.id === overId)
  if (!overItem) {
    const day = containerToDay(overId)
    const peers = itemsOfDay(items, day).filter((it) => it.id !== activeId)
    return { day, index: peers.length }
  }

  const day = overItem.day
  const peers = itemsOfDay(items, day).filter((it) => it.id !== activeId)
  const overIndex = peers.findIndex((it) => it.id === overItem.id)
  // 同一天往下移 → 放到 over 之後；否則放到 over 之前。
  if (active.day === day && active.order < overItem.order) {
    return { day, index: overIndex + 1 }
  }
  return { day, index: overIndex }
}
