import { PrimaryGroup, SecondaryGroup, Website } from '@/types/website'

/**
 * 拖拽操作类型
 */
export type DragLocation =
  | { type: 'primary'; group: PrimaryGroup }
  | { type: 'secondary'; group: SecondaryGroup }

/**
 * 拖拽结果
 */
export interface DragResult {
  sourceLocation: DragLocation
  targetLocation: DragLocation | null
  targetIndex: number
  movedItem: Website
}

/**
 * 查找网站在主要分组中的位置
 */
export function findWebsiteLocation(
  websiteId: string,
  primaryGroup: PrimaryGroup
): DragLocation | null {
  // 检查一级分类
  if (primaryGroup.websites?.some((w) => w.id === websiteId)) {
    return { type: 'primary', group: primaryGroup }
  }

  // 检查二级分组
  for (const secondaryGroup of primaryGroup.secondaryGroups) {
    if (secondaryGroup.websites.some((w) => w.id === websiteId)) {
      return { type: 'secondary', group: secondaryGroup }
    }
  }

  return null
}

/**
 * 查找目标位置
 */
export function findTargetLocation(
  overId: string,
  primaryGroup: PrimaryGroup
): { location: DragLocation | null; index: number } {
  // 检查是否拖拽到一级分类中的网站
  if (primaryGroup.websites?.some((w) => w.id === overId)) {
    const index = primaryGroup.websites.findIndex((w) => w.id === overId)
    return { location: { type: 'primary', group: primaryGroup }, index }
  }

  // 检查是否拖拽到空的一级分类
  if (overId === 'primary-group-empty') {
    return { location: { type: 'primary', group: primaryGroup }, index: 0 }
  }

  // 检查是否拖拽到二级分组
  for (const secondaryGroup of primaryGroup.secondaryGroups) {
    const websiteIndex = secondaryGroup.websites.findIndex((w) => w.id === overId)
    if (websiteIndex !== -1) {
      return { location: { type: 'secondary', group: secondaryGroup }, index: websiteIndex }
    }

    // 检查是否拖拽到二级分组本身（拖拽到分组末尾）
    if (secondaryGroup.id === overId) {
      return {
        location: { type: 'secondary', group: secondaryGroup },
        index: secondaryGroup.websites.length
      }
    }
  }

  return { location: null, index: -1 }
}

/**
 * 从数组中移除元素并重新计算order
 */
export function removeAndUpdateOrder<T extends { id: string; order?: number }>(
  items: T[],
  itemId: string
): { removedItem: T; updatedItems: T[] } | null {
  const itemIndex = items.findIndex((item) => item.id === itemId)
  if (itemIndex === -1) return null

  const newItems = [...items]
  const [removedItem] = newItems.splice(itemIndex, 1)

  const updatedItems = newItems.map((item, index) => ({
    ...item,
    order: index * 100,
    updatedAt: Date.now()
  }))

  return { removedItem, updatedItems }
}

/**
 * 向数组中插入元素并重新计算order
 */
export function insertAndUpdateOrder<T extends { id: string; order?: number }>(
  items: T[],
  item: T,
  targetIndex: number
): T[] {
  const newItems = [...items]
  newItems.splice(targetIndex, 0, item)

  return newItems.map((item, index) => ({
    ...item,
    order: index * 100,
    updatedAt: Date.now()
  }))
}

/**
 * 处理网站拖拽的核心逻辑
 */
export function handleWebsiteDrag(
  activeId: string,
  overId: string,
  primaryGroup: PrimaryGroup
): DragResult | null {
  // 查找源位置
  const sourceLocation = findWebsiteLocation(activeId, primaryGroup)
  if (!sourceLocation) return null

  // 查找目标位置
  const { location: targetLocation, index: targetIndex } = findTargetLocation(overId, primaryGroup)
  if (!targetLocation || targetIndex === -1) return null

  // 获取被拖拽的网站
  const movedWebsite = (sourceLocation.group.websites || []).find((w) => w.id === activeId)
  if (!movedWebsite) return null

  return {
    sourceLocation,
    targetLocation,
    targetIndex,
    movedItem: movedWebsite
  }
}

/**
 * 应用拖拽操作到主要分组
 */
export function applyDragOperation(
  primaryGroup: PrimaryGroup,
  dragResult: DragResult
): PrimaryGroup {
  const { sourceLocation, targetLocation, targetIndex, movedItem } = dragResult

  // 检查 targetLocation 是否为 null
  if (!targetLocation) {
    return primaryGroup // 如果没有目标位置，返回原始分组
  }

  // 如果源和目标是同一个位置，不需要处理
  if (
    sourceLocation.type === targetLocation.type &&
    sourceLocation.group.id === targetLocation.group.id
  ) {
    return handleSameLocationDrag(primaryGroup, sourceLocation, targetIndex, movedItem.id)
  }

  // 处理跨位置拖拽
  return handleCrossLocationDrag(primaryGroup, dragResult)
}

/**
 * 处理同一位置内的拖拽
 */
function handleSameLocationDrag(
  primaryGroup: PrimaryGroup,
  location: DragLocation,
  targetIndex: number,
  movedItemId: string
): PrimaryGroup {
  if (location.type === 'primary') {
    // 一级分类内拖拽
    const websites = location.group.websites || []
    const reorderedWebsites = reorderArray(websites, movedItemId, targetIndex)

    return {
      ...primaryGroup,
      websites: reorderedWebsites
    }
  } else {
    // 二级分组内拖拽
    const updatedSecondaryGroups = primaryGroup.secondaryGroups.map((sg) => {
      if (sg.id === location.group.id) {
        const reorderedWebsites = reorderArray(sg.websites, movedItemId, targetIndex)
        return { ...sg, websites: reorderedWebsites }
      }
      return sg
    })

    return {
      ...primaryGroup,
      secondaryGroups: updatedSecondaryGroups
    }
  }
}

/**
 * 处理跨位置拖拽
 */
function handleCrossLocationDrag(primaryGroup: PrimaryGroup, dragResult: DragResult): PrimaryGroup {
  const { sourceLocation, targetLocation, targetIndex, movedItem } = dragResult

  // 这个函数只在 targetLocation 不为 null 时被调用
  // 但为了类型安全，我们仍然检查
  if (!targetLocation) {
    return primaryGroup
  }

  let updatedPrimaryGroup = { ...primaryGroup }

  // 从源位置移除
  if (sourceLocation.type === 'primary') {
    const result = removeAndUpdateOrder(sourceLocation.group.websites || [], movedItem.id)
    if (result) {
      updatedPrimaryGroup = { ...updatedPrimaryGroup, websites: result.updatedItems }
    }
  } else {
    const updatedSecondaryGroups = updatedPrimaryGroup.secondaryGroups.map((sg) => {
      if (sg.id === sourceLocation.group.id) {
        const result = removeAndUpdateOrder(sg.websites, movedItem.id)
        return result ? { ...sg, websites: result.updatedItems } : sg
      }
      return sg
    })
    updatedPrimaryGroup = { ...updatedPrimaryGroup, secondaryGroups: updatedSecondaryGroups }
  }

  // 添加到目标位置
  if (targetLocation.type === 'primary') {
    const updatedWebsites = insertAndUpdateOrder(
      updatedPrimaryGroup.websites || [],
      movedItem,
      targetIndex
    )
    updatedPrimaryGroup = { ...updatedPrimaryGroup, websites: updatedWebsites }
  } else {
    const updatedSecondaryGroups = updatedPrimaryGroup.secondaryGroups.map((sg) => {
      if (sg.id === targetLocation.group.id) {
        const updatedWebsites = insertAndUpdateOrder(sg.websites, movedItem, targetIndex)
        return { ...sg, websites: updatedWebsites }
      }
      return sg
    })
    updatedPrimaryGroup = { ...updatedPrimaryGroup, secondaryGroups: updatedSecondaryGroups }
  }

  return updatedPrimaryGroup
}

/**
 * 重新排序数组的通用函数
 */
function reorderArray<T extends { id: string; order?: number }>(
  items: T[],
  itemId: string,
  targetIndex: number
): T[] {
  const sortedItems = [...items].sort((a, b) => {
    const orderA = a.order !== undefined ? a.order : 0
    const orderB = b.order !== undefined ? b.order : 0
    return orderA - orderB
  })

  const itemIndex = sortedItems.findIndex((item) => item.id === itemId)
  if (itemIndex === -1) return items

  const [movedItem] = sortedItems.splice(itemIndex, 1)
  sortedItems.splice(targetIndex, 0, movedItem)

  return sortedItems.map((item, index) => ({
    ...item,
    order: index * 100,
    updatedAt: Date.now()
  }))
}
