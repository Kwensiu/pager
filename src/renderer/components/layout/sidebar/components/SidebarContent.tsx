import React from 'react'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton
} from '@/ui/sidebar'
import { Folder, Plus } from 'lucide-react'
import { Favicon } from '@/components/features/Favicon'
import { PrimaryGroup, Website, SecondaryGroup } from '@/types/website'
import ContextMenu from './ContextMenu'

export interface SidebarContentProps {
  activePrimaryGroup: PrimaryGroup | null
  toggleSecondaryGroup: (secondaryGroupId: string) => void
  handleWebsiteClick: (website: Website) => void
  handleAddWebsite: (groupId: string, isSecondaryGroup: boolean) => void
  handleContextMenu: (e: React.MouseEvent, secondaryGroupId: string) => void
  handleWebsiteContextMenu: (e: React.MouseEvent, websiteId: string) => void
  handleWebsiteUpdate: (website: Website) => void
  handleDeleteWebsite: (websiteId: string) => void
  handleEditSecondaryGroup: (secondaryGroup: SecondaryGroup) => void
  handleDeleteSecondaryGroup: (secondaryGroupId: string) => void
  handleCloseContextMenu: () => void
  contextMenuWebsite: string | null
  contextMenuSecondaryGroup: string | null
  activeWebsiteId?: string | null
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  activePrimaryGroup,
  toggleSecondaryGroup,
  handleWebsiteClick,
  handleAddWebsite,
  handleContextMenu,
  handleWebsiteContextMenu,
  handleWebsiteUpdate,
  handleDeleteWebsite,
  handleEditSecondaryGroup,
  handleDeleteSecondaryGroup,
  handleCloseContextMenu,
  contextMenuWebsite,
  contextMenuSecondaryGroup,
  activeWebsiteId = null
}) => {
  if (!activePrimaryGroup) {
    return null
  }

  return (
    <SidebarGroup key={`primary-group-${activePrimaryGroup.id}`} className="pb-0">
      <SidebarMenu>
        {activePrimaryGroup.secondaryGroups.map((secondaryGroup) => (
          <div key={`menu-item-${secondaryGroup.id}`} className="relative">
            <SidebarMenuItem>
              <SidebarMenuButton
                data-secondary-group-id={secondaryGroup.id}
                onClick={() => {
                  toggleSecondaryGroup(secondaryGroup.id)
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleContextMenu(e, secondaryGroup.id)
                }}
                className={`${contextMenuSecondaryGroup === secondaryGroup.id ? 'bg-sidebar-accent' : ''}`}
              >
                <Folder className="mr-2 h-4 w-4" />
                <span>{secondaryGroup.name}</span>
              </SidebarMenuButton>

              {/* 渲染二级分组右键菜单 */}
              {contextMenuSecondaryGroup === secondaryGroup.id && (
                <ContextMenu
                  type="secondaryGroup"
                  targetSelector={`[data-secondary-group-id="${secondaryGroup.id}"]`}
                  onEdit={() => handleEditSecondaryGroup(secondaryGroup)}
                  onDelete={() => handleDeleteSecondaryGroup(secondaryGroup.id)}
                  onClose={handleCloseContextMenu}
                />
              )}
            </SidebarMenuItem>

            {secondaryGroup.expanded !== false && (
              <SidebarMenuSub key={`menu-sub-${secondaryGroup.id}-${secondaryGroup.expanded}`}>
                {(secondaryGroup.websites || []).map((website) => (
                  <div key={website.id} className="relative">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        data-website-id={website.id}
                        onClick={() => handleWebsiteClick(website)}
                        onContextMenu={(e) => handleWebsiteContextMenu(e, website.id)}
                        className={`${activeWebsiteId === website.id ? 'bg-sidebar-accent' : ''}
                          hover:bg-secondary cursor-pointer`}
                        style={{ userSelect: 'none' }}
                      >
                        <Favicon url={website.url} className="mr-2 h-6 w-6" />
                        <span>{website.name}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>

                    {contextMenuWebsite === website.id && (
                      <ContextMenu
                        type="website"
                        targetSelector={`[data-website-id="${website.id}"]`}
                        onEdit={() => handleWebsiteUpdate(website)}
                        onDelete={() => handleDeleteWebsite(website.id)}
                        onClose={handleCloseContextMenu}
                      />
                    )}
                  </div>
                ))}

                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddWebsite(secondaryGroup.id, true)
                    }}
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    <span>添加网站</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            )}
          </div>
        ))}

        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={(e) => {
              e.stopPropagation()
              handleAddWebsite(activePrimaryGroup.id, false)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>为此分类添加网站</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

export default SidebarContent
