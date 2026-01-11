import { PrimaryGroup, SecondaryGroup, Website } from '@/types/website'

// 迁移标记键名
const MIGRATION_KEY = 'drag-drop-migration-v1'

/**
 * 检查是否需要数据迁移
 */
export function needsMigration(primaryGroups: PrimaryGroup[]): boolean {
  if (!primaryGroups || primaryGroups.length === 0) {
    return false
  }

  // 检查是否有数据缺少 order 字段
  return primaryGroups.some((primaryGroup) =>
    primaryGroup.secondaryGroups.some(
      (secondaryGroup) =>
        secondaryGroup.order === undefined ||
        secondaryGroup.websites.some((website) => website.order === undefined)
    )
  )
}

/**
 * 迁移数据，添加 order 字段
 */
export function migrateDataForDragDrop(primaryGroups: PrimaryGroup[]): PrimaryGroup[] {
  if (!primaryGroups || primaryGroups.length === 0) {
    return primaryGroups
  }

  return primaryGroups.map((primaryGroup) => ({
    ...primaryGroup,
    secondaryGroups: primaryGroup.secondaryGroups.map((secondaryGroup, secondaryIndex) => ({
      ...secondaryGroup,
      order: secondaryGroup.order !== undefined ? secondaryGroup.order : secondaryIndex * 100,
      websites: secondaryGroup.websites.map((website, websiteIndex) => ({
        ...website,
        order: website.order !== undefined ? website.order : websiteIndex * 100
      }))
    }))
  }))
}

/**
 * 执行数据迁移并标记为已迁移
 */
export function performMigration(
  primaryGroups: PrimaryGroup[],
  saveCallback: (migratedGroups: PrimaryGroup[]) => void
): PrimaryGroup[] {
  if (!needsMigration(primaryGroups)) {
    return primaryGroups
  }

  const migratedGroups = migrateDataForDragDrop(primaryGroups)

  // 保存迁移后的数据
  saveCallback(migratedGroups)

  // 标记为已迁移
  localStorage.setItem(MIGRATION_KEY, 'true')

  return migratedGroups
}

/**
 * 检查是否已经执行过迁移
 */
export function hasMigrated(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true'
}

/**
 * 获取排序后的二级分组
 */
export function getSortedSecondaryGroups(groups: SecondaryGroup[]): SecondaryGroup[] {
  return [...groups].sort((a, b) => {
    // 如果 order 不存在，使用默认值
    const orderA = a.order !== undefined ? a.order : 0
    const orderB = b.order !== undefined ? b.order : 0
    return orderA - orderB
  })
}

/**
 * 获取排序后的网站
 */
export function getSortedWebsites(websites: Website[]): Website[] {
  return [...websites].sort((a, b) => {
    // 如果 order 不存在，使用默认值
    const orderA = a.order !== undefined ? a.order : 0
    const orderB = b.order !== undefined ? b.order : 0
    return orderA - orderB
  })
}

/**
 * 更新二级分组顺序
 */
export function updateSecondaryGroupOrder(
  groups: SecondaryGroup[],
  draggedId: string,
  targetIndex: number
): SecondaryGroup[] {
  const sortedGroups = getSortedSecondaryGroups(groups)
  const draggedIndex = sortedGroups.findIndex((g) => g.id === draggedId)

  if (draggedIndex === -1) {
    return groups
  }

  // 移除拖拽项
  const [draggedItem] = sortedGroups.splice(draggedIndex, 1)

  // 插入到目标位置
  sortedGroups.splice(targetIndex, 0, draggedItem)

  // 重新计算 order 值（使用间隔便于后续插入）
  return sortedGroups.map((group, index) => ({
    ...group,
    order: index * 100,
    updatedAt: Date.now()
  }))
}

/**
 * 更新网站顺序
 */
export function updateWebsiteOrder(
  websites: Website[],
  draggedId: string,
  targetIndex: number
): Website[] {
  const sortedWebsites = getSortedWebsites(websites)
  const draggedIndex = sortedWebsites.findIndex((w) => w.id === draggedId)

  if (draggedIndex === -1) {
    return websites
  }

  // 移除拖拽项
  const [draggedItem] = sortedWebsites.splice(draggedIndex, 1)

  // 插入到目标位置
  sortedWebsites.splice(targetIndex, 0, draggedItem)

  // 重新计算 order 值
  return sortedWebsites.map((website, index) => ({
    ...website,
    order: index * 100,
    updatedAt: Date.now()
  }))
}

/**
 * 计算新的 order 值（用于插入操作）
 */
export function calculateNewOrder(items: Array<{ order: number }>, targetIndex: number): number {
  if (items.length === 0) {
    return 0
  }

  if (targetIndex === 0) {
    // 插入到最前面
    return items[0].order - 100
  }

  if (targetIndex >= items.length) {
    // 插入到最后面
    return items[items.length - 1].order + 100
  }

  // 插入到中间
  const prevOrder = items[targetIndex - 1].order
  const nextOrder = items[targetIndex].order
  return Math.floor((prevOrder + nextOrder) / 2)
}
