import { PrimaryGroup, SecondaryGroup, Website } from '@/types/website'
import { DragEndResult } from '../types/dnd.types'
import { updateSecondaryGroupOrder } from '../utils/migrationUtils'
import { handleWebsiteDrag, applyDragOperation } from '../utils/dragUtils'

/**
 * 简化的排序服务类，使用通用工具函数处理拖拽排序
 */
export class SortingService {
  /**
   * 处理二级分组拖拽
   */
  static handleSecondaryGroupDrag(
    result: DragEndResult,
    activePrimaryGroup: PrimaryGroup,
    primaryGroups: PrimaryGroup[],
    callbacks: {
      onGroupsUpdate: (groups: PrimaryGroup[]) => void
      onSecondaryGroupReorder?: (primaryGroupId: string, groups: SecondaryGroup[]) => void
    }
  ): void {
    const { activeId, overId } = result

    if (!overId || activeId === overId) {
      return
    }

    // 找到目标索引
    const sortedGroups = [...activePrimaryGroup.secondaryGroups].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 0
      const orderB = b.order !== undefined ? b.order : 0
      return orderA - orderB
    })

    // 查找目标索引
    let targetIndex = sortedGroups.findIndex((g) => g.id === overId)

    // 如果没找到直接匹配的分组ID，根据插入位置确定
    if (targetIndex === -1) {
      const insertPosition = result.insertPosition || 'below'
      const activeIndex = sortedGroups.findIndex((g) => g.id === activeId)
      if (activeIndex !== -1) {
        targetIndex = insertPosition === 'below' ? activeIndex + 1 : activeIndex
        targetIndex = Math.max(0, Math.min(targetIndex, sortedGroups.length))
      } else {
        return
      }
    }

    // 更新二级分组顺序
    const reorderedGroups = updateSecondaryGroupOrder(
      activePrimaryGroup.secondaryGroups,
      activeId,
      targetIndex
    )

    // 更新主要分组
    const updatedPrimaryGroups = primaryGroups.map((pg) =>
      pg.id === activePrimaryGroup.id ? { ...pg, secondaryGroups: reorderedGroups } : pg
    )

    // 调用回调更新数据
    callbacks.onGroupsUpdate(updatedPrimaryGroups)

    if (callbacks.onSecondaryGroupReorder) {
      callbacks.onSecondaryGroupReorder(activePrimaryGroup.id, reorderedGroups)
    }
  }

  /**
   * 处理网站拖拽 - 使用简化的工具函数
   */
  static handleWebsiteDrag(
    result: DragEndResult,
    activePrimaryGroup: PrimaryGroup,
    primaryGroups: PrimaryGroup[],
    callbacks: {
      onGroupsUpdate: (groups: PrimaryGroup[]) => void
      onWebsiteReorder?: (secondaryGroupId: string, websites: Website[]) => void
    }
  ): void {
    const { activeId, overId } = result

    if (!overId || activeId === overId) {
      return
    }

    // 使用工具函数处理拖拽逻辑
    const dragResult = handleWebsiteDrag(activeId, overId, activePrimaryGroup)
    if (!dragResult) {
      return
    }

    // 应用拖拽操作
    const updatedPrimaryGroup = applyDragOperation(activePrimaryGroup, dragResult)

    // 更新主要分组列表
    const updatedPrimaryGroups = primaryGroups.map((pg) =>
      pg.id === activePrimaryGroup.id ? updatedPrimaryGroup : pg
    )

    // 调用回调更新数据
    callbacks.onGroupsUpdate(updatedPrimaryGroups)

    // 触发网站重新排序回调（如果需要）
    if (callbacks.onWebsiteReorder) {
      const { sourceLocation, targetLocation } = dragResult

      // 如果源位置是二级分组，触发回调
      if (sourceLocation.type === 'secondary') {
        const updatedSourceGroup = updatedPrimaryGroup.secondaryGroups.find(
          (sg) => sg.id === sourceLocation.group.id
        )
        if (updatedSourceGroup) {
          callbacks.onWebsiteReorder(sourceLocation.group.id, updatedSourceGroup.websites)
        }
      }

      // 如果目标位置是二级分组且与源位置不同，触发回调
      if (
        targetLocation &&
        targetLocation.type === 'secondary' &&
        targetLocation.group.id !== sourceLocation.group.id
      ) {
        const updatedTargetGroup = updatedPrimaryGroup.secondaryGroups.find(
          (sg) => sg.id === targetLocation.group.id
        )
        if (updatedTargetGroup) {
          callbacks.onWebsiteReorder(targetLocation.group.id, updatedTargetGroup.websites)
        }
      }
    }
  }
}
