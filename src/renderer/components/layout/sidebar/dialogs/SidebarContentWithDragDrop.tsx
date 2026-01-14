import React from 'react'
import { SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/ui/sidebar'
import { useSidebar } from '@/ui/sidebar.types'
import { Plus } from 'lucide-react'
import { PrimaryGroup, Website, SecondaryGroup } from '@/types/website'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem
} from '@/ui/context-menu'

// 拖拽相关导入
import { DragDropProvider, SortableContainer } from '../dnd/contexts/DragDropContext'
import { SortableSecondaryGroup } from '../dnd/components/SortableSecondaryGroup'
import { SortableWebsiteItem } from '../dnd/components/SortableWebsiteItem'
import { SortableEmptyPlaceholder } from '../dnd/components/SortableEmptyPlaceholder'
import { getSortedSecondaryGroups } from '../dnd/utils/migrationUtils'
import { DragEndResult } from '../dnd/types/dnd.types'
import { SortingService } from '../dnd/services/sortingService'

export interface SidebarContentWithDragDropProps {
  activePrimaryGroup: PrimaryGroup | null
  toggleSecondaryGroup: (secondaryGroupId: string) => void
  handleWebsiteClick: (website: Website) => void
  handleAddWebsite: (groupId: string, isSecondaryGroup: boolean) => void
  handleWebsiteUpdate: (website: Website) => void
  handleDeleteWebsite: (websiteId: string) => void
  handleEditSecondaryGroup: (secondaryGroup: SecondaryGroup) => void
  handleDeleteSecondaryGroup: (secondaryGroupId: string) => void
  contextMenuSecondaryGroup: string | null
  activeWebsiteId?: string | null
  // 新增的拖拽相关props
  primaryGroups: PrimaryGroup[]
  onGroupsUpdate: (groups: PrimaryGroup[]) => void
  onSecondaryGroupReorder?: (primaryGroupId: string, groups: SecondaryGroup[]) => void
  onWebsiteReorder?: (secondaryGroupId: string, websites: Website[]) => void
  // 打开添加选项对话框
  onOpenAddOptionsDialog?: (primaryGroupId: string) => void
  // 折叠态显示模式
  collapsedSidebarMode?: 'all' | 'expanded'
}

// 内部组件，使用拖拽上下文
const DragDropSidebarContentInner: React.FC<SidebarContentWithDragDropProps> = ({
  activePrimaryGroup,
  toggleSecondaryGroup,
  handleWebsiteClick,
  handleAddWebsite,
  handleEditSecondaryGroup,
  handleDeleteSecondaryGroup,
  contextMenuSecondaryGroup,
  activeWebsiteId = null,
  handleWebsiteUpdate,
  handleDeleteWebsite,
  onOpenAddOptionsDialog,
  collapsedSidebarMode = 'all'
}) => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  if (!activePrimaryGroup) {
    return null
  }

  // 获取排序后的二级分组
  const sortedSecondaryGroups = getSortedSecondaryGroups(activePrimaryGroup.secondaryGroups)
  const secondaryGroupIds = sortedSecondaryGroups.map((g) => g.id)

  // 获取一级分类下的网站
  const primaryGroupWebsites = activePrimaryGroup.websites || []
  const primaryGroupWebsiteIds = primaryGroupWebsites.map((w) => w.id)
  // 当没有网站时，添加一个虚拟ID以确保SortableContainer能识别拖拽目标
  const effectivePrimaryGroupWebsiteIds =
    primaryGroupWebsiteIds.length > 0 ? primaryGroupWebsiteIds : ['primary-group-empty']

  return (
    <SidebarGroup
      key={`primary-group-${activePrimaryGroup.id}-${collapsedSidebarMode}-${isCollapsed}`}
      className="pb-0"
    >
      <SidebarMenu>
        {/* 折叠状态下的简化显示 */}
        {isCollapsed ? (
          <div className="space-y-1">
            {/* 一级分类下的网站 */}
            {primaryGroupWebsites.map((website) => (
              <div key={`primary-website-${website.id}`}>
                <SortableWebsiteItem
                  website={website}
                  primaryGroupId={activePrimaryGroup.id}
                  active={activeWebsiteId === website.id}
                  onClick={() => handleWebsiteClick(website)}
                  onEdit={() => handleWebsiteUpdate(website)}
                  onDelete={() => handleDeleteWebsite(website.id)}
                  className="ml-0"
                  isCollapsed={isCollapsed}
                />
              </div>
            ))}
            {/* 二级分组下的网站 */}
            {sortedSecondaryGroups.map((secondaryGroup) => {
              // 根据模式决定是否显示该分组的网站
              // 如果 expanded 是 undefined，默认视为 true（展开状态）
              const isExpanded = secondaryGroup.expanded !== false
              const shouldShowWebsites = collapsedSidebarMode === 'all' || isExpanded

              return (
                <div key={`collapsed-group-${secondaryGroup.id}`}>
                  {shouldShowWebsites &&
                    secondaryGroup.websites.map((website) => (
                      <div key={`website-${website.id}`}>
                        <SortableWebsiteItem
                          website={website}
                          primaryGroupId={activePrimaryGroup.id}
                          active={activeWebsiteId === website.id}
                          onClick={() => handleWebsiteClick(website)}
                          onEdit={() => handleWebsiteUpdate(website)}
                          onDelete={() => handleDeleteWebsite(website.id)}
                          className="ml-0"
                          isCollapsed={isCollapsed}
                        />
                      </div>
                    ))}
                </div>
              )
            })}
          </div>
        ) : (
          <>
            {/* 展开状态下的完整显示 */}
            {/* 一级分类下的网站列表 - 即使为空也渲染，作为拖拽目标 */}
            <div className="mb-1">
              <div className="text-xs font-medium text-foreground mb-2 pl-1">未分组网站</div>
              <div className="space-y-1">
                <SortableContainer items={effectivePrimaryGroupWebsiteIds}>
                  {primaryGroupWebsites.map((website) => (
                    <div key={`primary-website-${website.id}`} className="ml-2">
                      <SortableWebsiteItem
                        website={website}
                        primaryGroupId={activePrimaryGroup.id}
                        active={activeWebsiteId === website.id}
                        onClick={() => handleWebsiteClick(website)}
                        onEdit={() => handleWebsiteUpdate(website)}
                        onDelete={() => handleDeleteWebsite(website.id)}
                        className="ml-0"
                        isCollapsed={isCollapsed}
                      />
                    </div>
                  ))}
                  {/* 当没有网站时，渲染一个可排序的空占位符作为拖拽目标 */}
                  {primaryGroupWebsites.length === 0 && (
                    <div className="">
                      <SortableEmptyPlaceholder
                        id="primary-group-empty"
                        primaryGroupId={activePrimaryGroup.id}
                        onClick={() => handleAddWebsite(activePrimaryGroup.id, false)}
                      />
                    </div>
                  )}
                </SortableContainer>
              </div>
            </div>

            <SortableContainer items={secondaryGroupIds}>
              {sortedSecondaryGroups.map((secondaryGroup) => (
                <div key={`menu-item-${secondaryGroup.id}`} className="relative mb-2">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div>
                        {/* 使用可排序的二级分组组件 */}
                        <SortableSecondaryGroup
                          secondaryGroup={secondaryGroup}
                          active={contextMenuSecondaryGroup === secondaryGroup.id}
                          onClick={() => toggleSecondaryGroup(secondaryGroup.id)}
                          onWebsiteClick={handleWebsiteClick}
                          onWebsiteEdit={handleWebsiteUpdate}
                          onWebsiteDelete={handleDeleteWebsite}
                          onAddWebsite={() => handleAddWebsite(secondaryGroup.id, true)}
                          activeWebsiteId={activeWebsiteId}
                          isCollapsed={isCollapsed}
                        />
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleEditSecondaryGroup(secondaryGroup)}>
                        修改
                      </ContextMenuItem>
                      <ContextMenuItem
                        className="text-red-600 focus:bg-red-100 dark:focus:bg-red-900"
                        onClick={() => handleDeleteSecondaryGroup(secondaryGroup.id)}
                      >
                        删除
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              ))}
            </SortableContainer>
          </>
        )}

        {/* 添加网站到主要分组的按钮 - 折叠状态下隐藏 */}
        {!isCollapsed && (
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={(e) => {
                e.stopPropagation()
                if (onOpenAddOptionsDialog) {
                  onOpenAddOptionsDialog(activePrimaryGroup.id)
                } else {
                  handleAddWebsite(activePrimaryGroup.id, false)
                }
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              <span>为此分类添加网站</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

// 主组件，提供拖拽上下文
const SidebarContentWithDragDrop: React.FC<SidebarContentWithDragDropProps> = (props) => {
  const {
    activePrimaryGroup,
    primaryGroups,
    onGroupsUpdate,
    onSecondaryGroupReorder,
    onWebsiteReorder
  } = props

  const handleDragEnd = (result: DragEndResult): void => {
    // 使用排序服务处理拖拽结果
    if (!result || !activePrimaryGroup) {
      return
    }

    const { activeId, overId, type } = result

    if (!overId || activeId === overId) {
      return
    }

    if (type === 'secondaryGroup') {
      // 处理二级分组拖拽
      SortingService.handleSecondaryGroupDrag(result, activePrimaryGroup, primaryGroups, {
        onGroupsUpdate,
        onSecondaryGroupReorder
      })
    } else if (type === 'website') {
      // 处理网站拖拽
      SortingService.handleWebsiteDrag(result, activePrimaryGroup, primaryGroups, {
        onGroupsUpdate,
        onWebsiteReorder
      })
    }
  }

  const handleDragStart = (): void => {
    // 拖拽开始处理
  }

  return (
    <DragDropProvider
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      config={{
        animationDuration: 200,
        dragDelay: 0,
        dropAnimationDuration: 250
      }}
    >
      <DragDropSidebarContentInner {...props} />
    </DragDropProvider>
  )
}

export default SidebarContentWithDragDrop
