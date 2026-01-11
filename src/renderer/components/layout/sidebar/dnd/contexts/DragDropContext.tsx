import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
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
  verticalListSortingStrategy
} from '@dnd-kit/sortable'

import {
  DragDropState,
  DragEndResult,
  DragDropConfig,
  defaultDragDropConfig
} from '../types/dnd.types'

interface DragDropContextType {
  state: DragDropState
  startDrag: (id: string, type: 'secondaryGroup' | 'website') => void
  endDrag: (result: DragEndResult) => void
  cancelDrag: () => void
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
}: DragDropProviderProps) {
  const [state, setState] = useState<DragDropState>({
    activeId: null,
    overId: null,
    isDragging: false,
    dragType: null
  })

  const mergedConfig = { ...defaultDragDropConfig, ...config }

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

      // 从拖拽数据中获取类型，而不是通过ID前缀判断
      const dragData = active.data.current
      let dragType: 'secondaryGroup' | 'website' = 'secondaryGroup'

      if (dragData) {
        // 根据数据中的type字段判断
        if (dragData.type === 'website') {
          dragType = 'website'
        } else if (dragData.type === 'secondaryGroup') {
          dragType = 'secondaryGroup'
        } else {
          // 如果没有type字段，尝试通过数据结构判断
          if (dragData.website) {
            dragType = 'website'
          } else if (dragData.secondaryGroup) {
            dragType = 'secondaryGroup'
          }
        }
      }

      setState((prev) => ({
        ...prev,
        activeId,
        isDragging: true,
        dragType
      }))

      if (onDragStart) {
        onDragStart(activeId, dragType)
      }
    },
    [onDragStart]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      // 获取插入位置信息（上方或下方）
      let insertPosition: 'above' | 'below' | null = null
      if (over) {
        // 从over事件的数据中获取插入位置
        const overData = over.data.current
        if (overData && overData.sortable) {
          // @dnd-kit的sortable数据可能包含插入位置信息
          // 这里我们根据鼠标位置判断：如果鼠标在元素的上半部分，插入到上方；否则插入到下方
          // 但我们需要在DragOver事件中获取这个信息，而不是在DragEnd事件中
        }
      }

      const result: DragEndResult = {
        activeId: active.id.toString(),
        overId: over?.id?.toString() || null,
        type: state.dragType || 'secondaryGroup',
        insertPosition: insertPosition || 'below' // 默认插入到下方
      }

      setState({
        activeId: null,
        overId: null,
        isDragging: false,
        dragType: null
      })

      if (onDragEnd) {
        onDragEnd(result)
      }
    },
    [onDragEnd, state.dragType]
  )

  const handleDragCancel = useCallback(() => {
    setState({
      activeId: null,
      overId: null,
      isDragging: false,
      dragType: null
    })
  }, [])

  const contextValue: DragDropContextType = {
    state,
    startDrag: (id, type) => {
      setState((prev) => ({ ...prev, activeId: id, isDragging: true, dragType: type }))
    },
    endDrag: (result) => {
      setState({ activeId: null, overId: null, isDragging: false, dragType: null })
      if (onDragEnd) {
        onDragEnd(result)
      }
    },
    cancelDrag: handleDragCancel,
    config: mergedConfig
  }

  return (
    <DragDropContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
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

export function useDragDrop() {
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
  strategy?: any
  children: ReactNode
}) {
  return (
    <SortableContext items={items} strategy={strategy}>
      {children}
    </SortableContext>
  )
}

export function useSortableContainer(items: string[], strategy = verticalListSortingStrategy) {
  return {
    sortableProps: {
      items,
      strategy
    }
  }
}
