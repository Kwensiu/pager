import { useCallback } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DraggableAttributes } from '@dnd-kit/core'
import { SecondaryGroup } from '@/types/website'
import { getDraggableStyle, getSecondaryGroupDragHandleStyle } from '../utils/styleUtils'

interface UseSecondaryGroupDndProps {
  id: string
  secondaryGroup: SecondaryGroup
  disabled?: boolean
}

interface UseSecondaryGroupDndReturn {
  // 拖拽相关属性
  attributes: DraggableAttributes
  listeners: Record<string, unknown> | undefined
  setNodeRef: (node: HTMLElement | null) => void
  transform: string | undefined
  transition: string | undefined
  isDragging: boolean
  isOver: boolean
  isSorting: boolean
  style: React.CSSProperties
  dragHandleStyle: React.CSSProperties

  // 方法
  handleDragStart: () => void
  handleDragEnd: () => void
}

export function useSecondaryGroupDnd({
  id,
  secondaryGroup,
  disabled = false
}: UseSecondaryGroupDndProps): UseSecondaryGroupDndReturn {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    isSorting
  } = useSortable({
    id,
    disabled,
    data: {
      type: 'secondaryGroup',
      secondaryGroup
    },
    animateLayoutChanges: () => true,
    transition: {
      duration: 200,
      easing: 'ease'
    }
  })

  const style: React.CSSProperties = getDraggableStyle(
    CSS.Transform.toString(transform),
    transition,
    isDragging
  )

  const dragHandleStyle: React.CSSProperties = getSecondaryGroupDragHandleStyle(isDragging)

  const handleDragStart = useCallback(() => {
    // 可以在这里添加自定义逻辑，比如播放声音、显示提示等
  }, [])

  const handleDragEnd = useCallback(() => {
    // 可以在这里添加自定义逻辑
  }, [])

  return {
    // 拖拽相关属性
    attributes,
    listeners,
    setNodeRef,
    transform: CSS.Transform.toString(transform),
    transition,

    // 状态
    isDragging,
    isOver,
    isSorting,

    // 样式
    style,
    dragHandleStyle,

    // 方法
    handleDragStart,
    handleDragEnd
  }
}
