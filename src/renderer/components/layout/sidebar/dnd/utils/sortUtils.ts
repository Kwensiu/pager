import { Website, SecondaryGroup } from '@/types/website'

/**
 * 排序工具函数
 */

/**
 * 比较两个项目的顺序
 */
export function compareOrder(a: { order: number }, b: { order: number }): number {
  return a.order - b.order
}

/**
 * 获取排序后的数组
 */
export function getSortedArray<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort(compareOrder)
}

/**
 * 重新计算顺序值，确保间隔均匀
 */
export function recalculateOrders<T extends { order: number }>(
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
 * 在指定位置插入项目并重新计算顺序
 */
export function insertItemAndRecalculate<T extends { order: number }>(
  items: T[],
  newItem: T,
  targetIndex: number
): T[] {
  const newItems = [...items]

  if (targetIndex >= newItems.length) {
    // 插入到最后
    newItems.push(newItem)
  } else if (targetIndex <= 0) {
    // 插入到最前
    newItems.unshift(newItem)
  } else {
    // 插入到中间
    newItems.splice(targetIndex, 0, newItem)
  }

  // 重新计算所有项目的顺序
  return recalculateOrders(newItems)
}

/**
 * 移动项目到新位置并重新计算顺序
 */
export function moveItemAndRecalculate<T extends { order: number; id: string }>(
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

  // 重新计算所有项目的顺序
  return recalculateOrders(newItems)
}

/**
 * 计算插入位置的 order 值
 */
export function calculateInsertOrder(
  prevItem: { order: number } | null,
  nextItem: { order: number } | null,
  defaultOrder = 0
): number {
  if (!prevItem && !nextItem) {
    return defaultOrder
  }

  if (!prevItem && nextItem) {
    // 插入到第一个位置
    return nextItem.order - 100
  }

  if (prevItem && !nextItem) {
    // 插入到最后一个位置
    return prevItem.order + 100
  }

  if (prevItem && nextItem) {
    // 插入到两个项目之间
    return Math.floor((prevItem.order + nextItem.order) / 2)
  }

  return defaultOrder
}

/**
 * 检查顺序是否需要重新平衡
 */
export function needsRebalancing<T extends { order: number }>(items: T[], threshold = 10): boolean {
  if (items.length <= 1) {
    return false
  }

  // 检查是否有重复的 order 值
  const orders = items.map((item) => item.order)
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
 * 网站排序相关工具函数
 */
export const websiteSortUtils = {
  /**
   * 获取排序后的网站列表
   */
  getSortedWebsites(websites: Website[]): Website[] {
    return getSortedArray(websites)
  },

  /**
   * 移动网站到新位置
   */
  moveWebsite(websites: Website[], websiteId: string, targetIndex: number): Website[] {
    return moveItemAndRecalculate(websites, websiteId, targetIndex)
  },

  /**
   * 插入新网站
   */
  insertWebsite(websites: Website[], newWebsite: Website, targetIndex: number): Website[] {
    return insertItemAndRecalculate(websites, newWebsite, targetIndex)
  }
}

/**
 * 二级分组排序相关工具函数
 */
export const secondaryGroupSortUtils = {
  /**
   * 获取排序后的二级分组列表
   */
  getSortedGroups(groups: SecondaryGroup[]): SecondaryGroup[] {
    return getSortedArray(groups)
  },

  /**
   * 移动二级分组到新位置
   */
  moveGroup(groups: SecondaryGroup[], groupId: string, targetIndex: number): SecondaryGroup[] {
    return moveItemAndRecalculate(groups, groupId, targetIndex)
  },

  /**
   * 插入新二级分组
   */
  insertGroup(
    groups: SecondaryGroup[],
    newGroup: SecondaryGroup,
    targetIndex: number
  ): SecondaryGroup[] {
    return insertItemAndRecalculate(groups, newGroup, targetIndex)
  }
}
