/**
 * 拖拽样式工具函数
 */

/**
 * 获取拖拽项目的通用样式
 */
export function getDraggableStyle(
  transform: string | null | undefined,
  transition: string | undefined,
  isDragging: boolean
): React.CSSProperties {
  return {
    transform: transform || undefined,
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 1000 : 'auto',
    cursor: isDragging ? 'grabbing' : 'pointer'
  }
}

/**
 * 获取拖拽手柄的通用样式
 */
export function getDragHandleStyle(
  isDragging: boolean,
  size: 'sm' | 'md' | 'lg' = 'md'
): React.CSSProperties {
  const sizeMap = {
    sm: { width: '16px', height: '16px', marginRight: '6px' },
    md: { width: '20px', height: '20px', marginRight: '8px' },
    lg: { width: '24px', height: '24px', marginRight: '10px' }
  }

  return {
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 1 : 0.6,
    transition: 'opacity 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...sizeMap[size]
  }
}

/**
 * 获取网站拖拽手柄样式
 */
export function getWebsiteDragHandleStyle(isDragging: boolean): React.CSSProperties {
  return getDragHandleStyle(isDragging, 'sm')
}

/**
 * 获取二级分组拖拽手柄样式
 */
export function getSecondaryGroupDragHandleStyle(isDragging: boolean): React.CSSProperties {
  return getDragHandleStyle(isDragging, 'md')
}
