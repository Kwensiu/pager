import { PrimaryGroup, SecondaryGroup, Website } from '@/types/website'
import { secondaryGroupSortUtils, websiteSortUtils, calculateInsertOrder } from './sortUtils'

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
  return secondaryGroupSortUtils.getSorted(groups)
}

/**
 * 获取排序后的网站
 */
export function getSortedWebsites(websites: Website[]): Website[] {
  return websiteSortUtils.getSorted(websites)
}

/**
 * 更新二级分组顺序 - 使用统一的排序工具
 */
export function updateSecondaryGroupOrder(
  groups: SecondaryGroup[],
  draggedId: string,
  targetIndex: number
): SecondaryGroup[] {
  return secondaryGroupSortUtils.moveItem(groups, draggedId, targetIndex)
}

/**
 * 更新网站顺序 - 使用统一的排序工具
 */
export function updateWebsiteOrder(
  websites: Website[],
  draggedId: string,
  targetIndex: number
): Website[] {
  return websiteSortUtils.moveItem(websites, draggedId, targetIndex)
}

/**
 * 计算新的 order 值（用于插入操作）
 */
export function calculateNewOrder(items: Array<{ order: number }>, targetIndex: number): number {
  return calculateInsertOrder(
    targetIndex > 0 ? items[targetIndex - 1] : null,
    targetIndex < items.length ? items[targetIndex] : null,
    0
  )
}
