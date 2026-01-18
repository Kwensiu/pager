import React from 'react'

interface DropIndicatorProps {
  /** 是否激活 */
  isActive?: boolean
  /** 位置：'top' | 'bottom' | 'left' | 'right' */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** 类型：'insert' | 'over' */
  type?: 'insert' | 'over'
  /** 自定义类名 */
  className?: string
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 动画效果 */
  animated?: boolean
  /** 预设类型 */
  variant?: 'default' | 'secondary' | 'website'
}

export const DropIndicator: React.FC<DropIndicatorProps> = ({
  isActive = false,
  position = 'bottom',
  type = 'insert',
  className = '',
  showArrow = true,
  animated = true,
  variant = 'default'
}) => {
  // 根据预设类型设置默认属性
  const getDefaultProps = (): {
    position: 'top' | 'bottom' | 'left' | 'right'
    className: string
    showArrow: boolean
  } => {
    switch (variant) {
      case 'secondary':
        return { position: 'bottom', className: 'rounded-full', showArrow }
      case 'website':
        return { position: 'bottom', className: 'rounded-sm', showArrow: false }
      default:
        return { position, className: '', showArrow }
    }
  }

  const {
    position: finalPosition,
    className: variantClassName,
    showArrow: finalShowArrow
  } = getDefaultProps()
  const finalClassName = `${variantClassName} ${className}`.trim()

  if (!isActive && type === 'insert') {
    return null
  }

  const positionClasses = {
    top: 'top-0 left-0 right-0 h-0.5',
    bottom: 'bottom-0 left-0 right-0 h-0.5',
    left: 'left-0 top-0 bottom-0 w-0.5',
    right: 'right-0 top-0 bottom-0 w-0.5'
  }

  const typeClasses = {
    insert: 'bg-primary border-primary',
    over: 'bg-primary/20 border-primary/40'
  }

  const arrowPosition = {
    top: 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2',
    left: 'left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2',
    right: 'right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2'
  }

  const arrowDirection = {
    top: 'border-t-primary',
    bottom: 'border-b-primary',
    left: 'border-l-primary',
    right: 'border-r-primary'
  }

  return (
    <div
      className={`
        drop-indicator
        absolute
        ${positionClasses[finalPosition]}
        ${typeClasses[type]}
        ${animated ? 'transition-all duration-200' : ''}
        ${isActive ? 'opacity-100' : 'opacity-0'}
        ${finalClassName}
      `}
      role="presentation"
      aria-hidden="true"
    >
      {/* 主要指示线 */}
      <div
        className={`
          absolute
          ${positionClasses[finalPosition]}
          ${type === 'insert' ? 'bg-primary' : 'bg-primary/20'}
          ${animated && isActive ? 'animate-pulse' : ''}
        `}
      />

      {/* 箭头指示器 */}
      {finalShowArrow && showArrow && type === 'insert' && isActive && (
        <div
          className={`
            absolute
            ${arrowPosition[finalPosition]}
            w-0 h-0
            border-4 border-transparent
            ${arrowDirection[finalPosition]}
          `}
        />
      )}

      {/* 发光效果 */}
      {isActive && animated && (
        <div
          className={`
            absolute
            ${positionClasses[finalPosition]}
            bg-primary/10
            blur-sm
            ${type === 'insert' ? 'animate-ping' : ''}
          `}
        />
      )}
    </div>
  )
}
