import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableEmptyPlaceholderProps {
  /** 占位符ID */
  id: string
  /** 所属一级分类ID */
  primaryGroupId: string
  /** 自定义类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 点击事件处理器 */
  onClick?: () => void
}

export const SortableEmptyPlaceholder: React.FC<SortableEmptyPlaceholderProps> = ({
  id,
  primaryGroupId,
  className = '',
  disabled = false,
  onClick
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({
      id,
      disabled,
      data: {
        type: 'empty-placeholder',
        primaryGroupId,
        isDropTarget: true
      }
    })

  // 简化拖拽状态检查，移除对 context state 的依赖
  const shouldShowDropIndicator = isOver

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1000 : 'auto',
    cursor: 'pointer'
  }

  // 处理点击事件
  const handleClick = (): void => {
    if (onClick && !isDragging) {
      onClick()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        sortable-empty-placeholder
        h-8
        rounded-md
        border
        border-dashed
        border-muted-foreground/30
        flex
        items-center
        justify-center
        transition-all
        duration-200
        ${shouldShowDropIndicator ? 'bg-accent/30 border-accent' : ''}
        ${isDragging ? 'shadow opacity-50' : ''}
        ${className}
      `}
      onClick={handleClick}
      aria-label="拖拽网站到此区域"
      data-testid={`empty-placeholder-${id}`}
      data-dragging={isDragging}
      data-drop-target={id}
      {...attributes}
      {...listeners}
    >
      {/* 放置指示器 */}
      {shouldShowDropIndicator && (
        <div className="absolute inset-0 border-2 border-accent rounded-md pointer-events-none" />
      )}

      <span className="text-xs text-muted-foreground">拖拽网站到此区域</span>
    </div>
  )
}

// 简化版本，用于不需要完整功能的场景
export const SimpleSortableEmptyPlaceholder: React.FC<{
  id: string
  primaryGroupId: string
  disabled?: boolean
}> = ({ id, primaryGroupId, disabled = false }) => {
  const { setNodeRef, transform, isDragging } = useSortable({
    id,
    disabled,
    data: {
      type: 'empty-placeholder',
      primaryGroupId,
      isDropTarget: true
    }
  })

  const style = transform ? { transform: CSS.Transform.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ml-2 h-8 rounded-md border border-dashed border-muted-foreground/30
        flex items-center justify-center
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <span className="text-xs text-muted-foreground">拖拽网站到此区域</span>
    </div>
  )
}
