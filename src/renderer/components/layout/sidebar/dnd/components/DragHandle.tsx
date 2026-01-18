import React from 'react'
import { GripVertical } from 'lucide-react'

interface DragHandleProps {
  /** 是否正在拖拽 */
  isDragging?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 点击事件处理器 */
  onClick?: (e: React.MouseEvent) => void
  /** 自定义类名 */
  className?: string
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否显示提示文本 */
  showTooltip?: boolean
  /** 预设类型 */
  variant?: 'default' | 'secondary' | 'website'
}

export const DragHandle: React.FC<DragHandleProps> = ({
  isDragging = false,
  disabled = false,
  onClick,
  className = '',
  size = 'md',
  showTooltip = true,
  variant = 'default'
}) => {
  // 根据预设类型设置默认尺寸和边距
  const getDefaultProps = (): { size: 'sm' | 'md' | 'lg'; className: string } => {
    switch (variant) {
      case 'secondary':
        return { size: 'md', className: 'mr-2' }
      case 'website':
        return { size: 'sm', className: 'mr-1.5' }
      default:
        return { size, className: '' }
    }
  }

  const { size: finalSize, className: variantClassName } = getDefaultProps()
  const finalClassName = `${variantClassName} ${className}`.trim()

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (onClick && !disabled) {
      onClick(e)
    }
  }

  return (
    <div
      className={`
        drag-handle
        inline-flex
        items-center
        justify-center
        rounded
        transition-all
        duration-200
        ${disabled ? 'cursor-not-allowed opacity-30' : isDragging ? 'cursor-grabbing opacity-100' : 'cursor-grab opacity-70 hover:opacity-100'}
        ${sizeClasses[finalSize]}
        ${finalClassName}
      `}
      onClick={handleClick}
      role="button"
      aria-label={disabled ? '拖拽已禁用' : '拖拽手柄'}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      title={showTooltip ? (disabled ? '拖拽已禁用' : '拖拽排序') : undefined}
    >
      <GripVertical
        className={`w-full h-full ${disabled ? 'text-muted-foreground' : 'text-foreground'}`}
        strokeWidth={1.5}
      />

      {/* 键盘导航提示（仅对屏幕阅读器可见） */}
      <span className="sr-only">
        按空格键开始拖拽，使用方向键移动，按Enter键放置，按Escape键取消
      </span>
    </div>
  )
}
