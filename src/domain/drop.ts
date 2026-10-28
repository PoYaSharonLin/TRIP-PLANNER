import { keyBetween, itemsOfDay } from './ordering'
import type { Item } from './types'

export type DropResult = {
  day: number | null
  order: string
}

/**
 * 計算一次「放下」後，被移動項目的新 day 與 order。
 *
 * @param items      目前所有項目
 * @param activeId   被拖曳的項目 id
 * @param targetDay  放下的目標天（null = 待排清單）
 * @param targetIndex 在目標天清單（不含被移動項目）中要插入的位置，0..n
 * @returns 新的 { day, order }；若等於原位則回傳 null（不需要任何更新）。
 */
export function computeDrop(
  items: Item[],
  activeId: string,
  targetDay: number | null,
  targetIndex: number,
): DropResult | null {
  const active = items.find((it) => it.id === activeId)
  if (!active) return null

  // 目標天的清單，排除被移動的項目本身。
  const peers = itemsOfDay(items, targetDay).filter((it) => it.id !== activeId)

  const index = Math.max(0, Math.min(targetIndex, peers.length))

  // 拖回原位：同一天、且插入位置與原本相同 → 不需要更新。
  if (targetDay === active.day) {
    const originalIndex = peers.filter((it) => it.order < active.order).length
    if (index === originalIndex) return null
  }

  const before = index > 0 ? peers[index - 1].order : null
  const after = index < peers.length ? peers[index].order : null
  const order = keyBetween(before, after)

  return { day: targetDay, order }
}
