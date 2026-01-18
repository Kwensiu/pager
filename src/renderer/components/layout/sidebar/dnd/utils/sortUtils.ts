import { PrimaryGroup, SecondaryGroup, Website } from '@/types/website'

/**
 * 统一的排序工具，消除重复的排序逻辑
 */

/**
 * 通用的排序比较函数
 */
export function compareOrder(a: { order?: number }, b: { order?: number }): number {
  const orderA = a.order ?? 0
  const orderB = b.order ?? 0
  return orderA - orderB
}

/**
 * 获取排序后的数组
 */
export function getSortedArray<T extends { order?: number }>(items: T[]): T[] {
  return [...items].sort(compareOrder)
}

/**
 * 重新计算顺序值，确保间隔均匀
 */
export function recalculateOrders<T extends { order?: number }>(
  items: T[],
  startOrder = 0,
  interval = 100
): T[] {
  return items.map((item, index) => ({
    ...item,
    order: startOrder + index * interval
  }))
}

/**
 * 移动项目到新位置并重新计算顺序
 */
export function moveItemAndRecalculate<T extends { order?: number; id: string }>(
  items: T[],
  itemId: string,
  targetIndex: number
): T[] {
  const itemIndex = items.findIndex((item) => item.id === itemId)

  if (itemIndex === -1) {
    return items
  }

  const newItems = [...items]
  const [movedItem] = newItems.splice(itemIndex, 1)

  if (targetIndex >= newItems.length) {
    newItems.push(movedItem)
  } else if (targetIndex <= 0) {
    newItems.unshift(movedItem)
  } else {
    newItems.splice(targetIndex, 0, movedItem)
  }

  return recalculateOrders(newItems)
}

/**
 * 专门用于PrimaryGroup的排序工具
 */
export const primaryGroupSortUtils = {
  getSorted: (groups: PrimaryGroup[]): PrimaryGroup[] => getSortedArray(groups),
  moveItem: (groups: PrimaryGroup[], groupId: string, targetIndex: number): PrimaryGroup[] =>
    moveItemAndRecalculate(groups, groupId, targetIndex)
}

/**
 * 专门用于SecondaryGroup的排序工具
 */
export const secondaryGroupSortUtils = {
  getSorted: (groups: SecondaryGroup[]): SecondaryGroup[] => getSortedArray(groups),
  moveItem: (groups: SecondaryGroup[], groupId: string, targetIndex: number): SecondaryGroup[] =>
    moveItemAndRecalculate(groups, groupId, targetIndex)
}

/**
 * 专门用于Website的排序工具
 */
export const websiteSortUtils = {
  getSorted: (websites: Website[]): Website[] => getSortedArray(websites),
  moveItem: (websites: Website[], websiteId: string, targetIndex: number): Website[] =>
    moveItemAndRecalculate(websites, websiteId, targetIndex)
}

/**
 * 检查顺序是否需要重新平衡
 */
export function needsRebalancing<T extends { order?: number }>(
  items: T[],
  threshold = 10
): boolean {
  if (items.length <= 1) {
    return false
  }

  // 检查是否有重复的 order 值
  const orders = items.map((item) => item.order ?? 0)
  const uniqueOrders = new Set(orders)
  if (uniqueOrders.size !== orders.length) {
    return true
  }

  // 检查 order 值之间的最小间隔
  const sortedOrders = [...orders].sort((a, b) => a - b)
  for (let i = 1; i < sortedOrders.length; i++) {
    if (sortedOrders[i] - sortedOrders[i - 1] < threshold) {
      return true
    }
  }

  return false
}

/**
 * 计算插入位置的 order 值
 */
export function calculateInsertOrder(
  prevItem: { order?: number } | null,
  nextItem: { order?: number } | null,
  defaultOrder = 0
): number {
  if (!prevItem && !nextItem) {
    return defaultOrder
  }

  if (!prevItem && nextItem) {
    // 插入到第一个位置
    return (nextItem.order ?? 0) - 100
  }

  if (prevItem && !nextItem) {
    // 插入到最后一个位置
    return (prevItem.order ?? 0) + 100
  }

  if (prevItem && nextItem) {
    // 插入到两个项目之间
    return Math.floor(((prevItem.order ?? 0) + (nextItem.order ?? 0)) / 2)
  }

  return defaultOrder
}
