/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useCallback, ReactNode, useRef } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  defaultDropAnimation,
  MeasuringStrategy
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  SortingStrategy
} from '@dnd-kit/sortable'

import { DragEndResult, DragDropConfig, defaultDragDropConfig } from '../dnd/types/dnd.types'

interface DragDropContextType {
  config: DragDropConfig
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined)

interface DragDropProviderProps {
  children: ReactNode
  onDragEnd?: (result: DragEndResult) => void
  onDragStart?: (id: string, type: 'secondaryGroup' | 'website') => void
  config?: Partial<DragDropConfig>
}

const defaultDropAnimationConfig = {
  ...defaultDropAnimation,
  dragSourceOpacity: 0.5
}

export function DragDropProvider({
  children,
  onDragEnd,
  onDragStart,
  config = {}
}: DragDropProviderProps): React.JSX.Element {
  const mergedConfig = { ...defaultDragDropConfig, ...config }

  // 使用 ref 来存储拖拽状态，避免不必要的重新渲染
  const dragStateRef = useRef<{
    dragType: 'secondaryGroup' | 'website'
    insertPosition: 'above' | 'below' | undefined
  }>({
    dragType: 'secondaryGroup',
    insertPosition: undefined
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // 需要移动8像素才开始拖拽
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const activeId = active.id.toString()

      // 从拖拽数据中获取类型
      const dragData = active.data.current
      let dragType: 'secondaryGroup' | 'website' = 'secondaryGroup'

      if (dragData) {
        if (dragData.type === 'website') {
          dragType = 'website'
        } else if (dragData.type === 'secondaryGroup') {
          dragType = 'secondaryGroup'
        } else {
          if (dragData.website) {
            dragType = 'website'
          } else if (dragData.secondaryGroup) {
            dragType = 'secondaryGroup'
          }
        }
      }

      // 存储拖拽类型
      dragStateRef.current.dragType = dragType
      dragStateRef.current.insertPosition = undefined

      if (onDragStart) {
        onDragStart(activeId, dragType)
      }
    },
    [onDragStart]
  )

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event

    if (!over) {
      dragStateRef.current.insertPosition = undefined
      return
    }

    // 计算插入位置
    const overRect = over.rect
    const activeRect = active.rect.current?.translated || active.rect.current?.initial

    if (overRect && activeRect) {
      const overCenterY = overRect.top + overRect.height / 2
      const activeCenterY = activeRect.top + activeRect.height / 2
      dragStateRef.current.insertPosition = activeCenterY < overCenterY ? 'above' : 'below'
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      const result: DragEndResult = {
        activeId: active.id.toString(),
        overId: over?.id?.toString() || null,
        type: dragStateRef.current.dragType || 'secondaryGroup',
        insertPosition: dragStateRef.current.insertPosition || 'below'
      }

      // 重置拖拽状态
      dragStateRef.current.dragType = 'secondaryGroup'
      dragStateRef.current.insertPosition = undefined

      if (onDragEnd) {
        onDragEnd(result)
      }
    },
    [onDragEnd]
  )

  const handleDragCancel = useCallback(() => {
    // 重置拖拽状态
    dragStateRef.current.dragType = 'secondaryGroup'
    dragStateRef.current.insertPosition = undefined
  }, [])

  const contextValue: DragDropContextType = {
    config: mergedConfig
  }

  return (
    <DragDropContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always
          }
        }}
      >
        {children}
        <DragOverlay dropAnimation={defaultDropAnimationConfig}>
          {/* 拖拽覆盖层内容由具体组件提供 */}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  )
}

export function useDragDrop(): DragDropContextType {
  const context = useContext(DragDropContext)
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider')
  }
  return context
}

export function SortableContainer({
  items,
  strategy = verticalListSortingStrategy,
  children
}: {
  items: string[]
  strategy?: SortingStrategy
  children: ReactNode
}): React.JSX.Element {
  return (
    <SortableContext items={items} strategy={strategy}>
      {children}
    </SortableContext>
  )
}

export function useSortableContainer(
  items: string[],
  strategy: SortingStrategy = verticalListSortingStrategy
): { sortableProps: { items: string[]; strategy: SortingStrategy } } {
  return {
    sortableProps: {
      items,
      strategy
    }
  }
}
