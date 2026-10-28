import { generateKeyBetween } from 'fractional-indexing'
import type { Item } from './types'

/**
 * 在 a、b 之間產生一個排序鍵。
 * a 為 null 代表「放到最前面」，b 為 null 代表「放到最後面」。
 */
export function keyBetween(
  a: string | null,
  b: string | null,
): string {
  return generateKeyBetween(a ?? null, b ?? null)
}

/** 放到清單最後面（清單可為空）。 */
export function keyAtEnd(last: string | null): string {
  return generateKeyBetween(last ?? null, null)
}

/** 放到清單最前面（清單可為空）。 */
export function keyAtStart(first: string | null): string {
  return generateKeyBetween(null, first ?? null)
}

/**
 * 依 order 排序。用字元碼比較（a < b），不要用 localeCompare，
 * 否則不同語系下 fractional-indexing 產生的鍵會排錯。
 */
export function sortItems<T extends { order: string }>(items: T[]): T[] {
  return [...items].sort((x, y) => (x.order < y.order ? -1 : x.order > y.order ? 1 : 0))
}

/** 取某一天（或待排清單 day=null）的項目，依 order 排序。 */
export function itemsOfDay(items: Item[], day: number | null): Item[] {
  return sortItems(items.filter((it) => it.day === day))
}
