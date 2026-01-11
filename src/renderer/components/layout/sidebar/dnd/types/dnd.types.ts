// 拖拽排序相关类型定义

export interface DragDropItem {
  id: string
  type: 'secondaryGroup' | 'website'
  data?: any
}

export interface DragDropState {
  activeId: string | null
  overId: string | null
  isDragging: boolean
  dragType: 'secondaryGroup' | 'website' | null
  insertPosition?: 'above' | 'below' // 当前悬停位置的插入位置
}

export interface DragEndResult {
  activeId: string
  overId: string | null
  type: 'secondaryGroup' | 'website'
  insertPosition?: 'above' | 'below' // 插入位置：上方或下方
}

export interface SortableItemProps {
  id: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export interface SortableSecondaryGroupProps {
  id: string
  secondaryGroup: any // 实际类型应该是 SecondaryGroup
  onToggle?: (id: string) => void
  onContextMenu?: (e: React.MouseEvent, id: string) => void
  onWebsiteClick?: (website: any) => void
  onAddWebsite?: (groupId: string, isSecondaryGroup: boolean) => void
  activeWebsiteId?: string | null
}

export interface SortableWebsiteItemProps {
  id: string
  website: any // 实际类型应该是 Website
  secondaryGroupId: string
  onClick?: (website: any) => void
  onContextMenu?: (e: React.MouseEvent, id: string) => void
  active?: boolean
}

export interface DragDropConfig {
  animationDuration: number
  dragDelay: number
  dropAnimationDuration: number
  keyboardSortingDistance: number
}

export const defaultDragDropConfig: DragDropConfig = {
  animationDuration: 200,
  dragDelay: 0,
  dropAnimationDuration: 250,
  keyboardSortingDistance: 20
}
