import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { Edit3, Trash2 } from 'lucide-react'

export type ContextMenuType = 'website' | 'secondaryGroup'

export interface ContextMenuProps {
  type: ContextMenuType
  // 如果提供 targetSelector，则忽略 position，根据目标元素定位
  targetSelector?: string
  // 如果未提供 targetSelector，则使用 position
  position?: { x: number; y: number }
  onEdit: () => void
  onDelete: () => void
  onClose?: () => void
  className?: string
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  type,
  targetSelector,
  position,
  onEdit,
  onDelete,
  onClose,
  className = ''
}) => {
  const menuRef = useRef<HTMLDivElement>(null)

  // 定位菜单
  useEffect(() => {
    if (!menuRef.current) return

    let top = 0
    let left = 0

    if (targetSelector) {
      const element = document.querySelector(targetSelector)
      if (element) {
        const rect = element.getBoundingClientRect()
        top = rect.bottom + window.scrollY
        left = rect.left + window.scrollX + 20
      }
    } else if (position) {
      top = position.y
      left = position.x
    }

    menuRef.current.style.top = `${top}px`
    menuRef.current.style.left = `${left}px`
  }, [targetSelector, position])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const menuContent = (
    <div
      ref={menuRef}
      className={`fixed z-[99999] w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-xl animate-in fade-in-80 ${className}`}
      style={{ visibility: 'hidden' }} // 先隐藏，定位后显示
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={onEdit}
      >
        <Edit3 className="mr-2 h-4 w-4" />
        {type === 'website' ? '修改' : '修改'}
      </button>
      <button
        className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-100 hover:text-red-600 focus:bg-red-100 dark:hover:bg-red-900 dark:hover:text-red-100"
        onClick={onDelete}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        {type === 'website' ? '删除' : '删除'}
      </button>
    </div>
  )

  // 定位后显示菜单
  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.style.visibility = 'visible'
    }
  }, [])

  if (typeof document === 'undefined') {
    return null
  }

  return ReactDOM.createPortal(menuContent, document.body)
}

export default ContextMenu
