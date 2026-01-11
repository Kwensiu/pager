import { useState, useCallback } from 'react'
import { Website, SecondaryGroup } from '@/types/website'

export interface DialogManagementState {
  // 网站相关对话框
  isWebsiteDialogOpen: boolean
  isEditDialogOpen: boolean
  editingWebsite: Website | null
  selectedGroupId: string | null
  selectedSecondaryGroupId: string | null

  // 分组相关对话框
  isGroupDialogOpen: boolean
  dialogMode: 'primary' | 'secondary' | 'website'

  // 二级分组编辑对话框
  isSecondaryGroupEditDialogOpen: boolean
  editingSecondaryGroup: SecondaryGroup | null

  // 确认对话框
  confirmDialog: {
    open: boolean
    websiteId: string | null
  }
  secondaryGroupConfirmDelete: {
    open: boolean
    secondaryGroupId: string | null
  }
  clearDataDialogOpen: boolean
  resetDataDialogOpen: boolean
  clearSoftwareDataDialogOpen: boolean
  clearCacheDialogOpen: boolean
}

export interface DialogManagementActions {
  // 网站对话框操作
  openWebsiteDialog: (groupId: string, isSecondaryGroup: boolean) => void
  closeWebsiteDialog: () => void
  openEditWebsiteDialog: (website: Website) => void
  closeEditWebsiteDialog: () => void

  // 分组对话框操作
  openGroupDialog: (mode: 'primary' | 'secondary', groupId?: string) => void
  closeGroupDialog: () => void

  // 二级分组编辑对话框操作
  openSecondaryGroupEditDialog: (group: SecondaryGroup) => void
  closeSecondaryGroupEditDialog: () => void

  // 确认对话框操作
  openConfirmDeleteWebsite: (websiteId: string) => void
  closeConfirmDeleteWebsite: () => void
  openConfirmDeleteSecondaryGroup: (secondaryGroupId: string) => void
  closeConfirmDeleteSecondaryGroup: () => void
  openClearDataDialog: () => void
  closeClearDataDialog: () => void
  openResetDataDialog: () => void
  closeResetDataDialog: () => void
  openClearSoftwareDataDialog: () => void
  closeClearSoftwareDataDialog: () => void
  openClearCacheDialog: () => void
  closeClearCacheDialog: () => void

  // 状态设置函数
  setIsWebsiteDialogOpen: (open: boolean) => void
  setIsEditDialogOpen: (open: boolean) => void
  setEditingWebsite: (website: Website | null) => void
  setSelectedGroupId: (id: string | null) => void
  setSelectedSecondaryGroupId: (id: string | null) => void
  setIsGroupDialogOpen: (open: boolean) => void
  setDialogMode: (mode: 'primary' | 'secondary' | 'website') => void
  setIsSecondaryGroupEditDialogOpen: (open: boolean) => void
  setEditingSecondaryGroup: (group: SecondaryGroup | null) => void
  setConfirmDialog: (dialog: { open: boolean; websiteId: string | null }) => void
  setSecondaryGroupConfirmDelete: (dialog: {
    open: boolean
    secondaryGroupId: string | null
  }) => void
  setClearDataDialogOpen: (open: boolean) => void
  setResetDataDialogOpen: (open: boolean) => void
  setClearSoftwareDataDialogOpen: (open: boolean) => void
  setClearCacheDialogOpen: (open: boolean) => void
}

export function useDialogManagement(): DialogManagementState & DialogManagementActions {
  // 网站相关对话框状态
  const [isWebsiteDialogOpen, setIsWebsiteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedSecondaryGroupId, setSelectedSecondaryGroupId] = useState<string | null>(null)

  // 分组相关对话框状态
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'primary' | 'secondary' | 'website'>('primary')

  // 二级分组编辑对话框状态
  const [isSecondaryGroupEditDialogOpen, setIsSecondaryGroupEditDialogOpen] = useState(false)
  const [editingSecondaryGroup, setEditingSecondaryGroup] = useState<SecondaryGroup | null>(null)

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; websiteId: string | null }>({
    open: false,
    websiteId: null
  })
  const [secondaryGroupConfirmDelete, setSecondaryGroupConfirmDelete] = useState<{
    open: boolean
    secondaryGroupId: string | null
  }>({ open: false, secondaryGroupId: null })
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false)
  const [resetDataDialogOpen, setResetDataDialogOpen] = useState(false)
  const [clearSoftwareDataDialogOpen, setClearSoftwareDataDialogOpen] = useState(false)
  const [clearCacheDialogOpen, setClearCacheDialogOpen] = useState(false)

  // 网站对话框操作
  const openWebsiteDialog = useCallback((groupId: string, isSecondaryGroup: boolean) => {
    setSelectedGroupId(isSecondaryGroup ? null : groupId)
    setSelectedSecondaryGroupId(isSecondaryGroup ? groupId : null)
    setIsWebsiteDialogOpen(true)
    setDialogMode('website')
  }, [])

  const closeWebsiteDialog = useCallback(() => {
    setIsWebsiteDialogOpen(false)
    setSelectedGroupId(null)
    setSelectedSecondaryGroupId(null)
  }, [])

  const openEditWebsiteDialog = useCallback((website: Website) => {
    setEditingWebsite(website)
    setIsEditDialogOpen(true)
  }, [])

  const closeEditWebsiteDialog = useCallback(() => {
    setIsEditDialogOpen(false)
    setEditingWebsite(null)
  }, [])

  // 分组对话框操作
  const openGroupDialog = useCallback((mode: 'primary' | 'secondary', groupId?: string) => {
    setSelectedGroupId(groupId || null)
    setIsGroupDialogOpen(true)
    setDialogMode(mode)
  }, [])

  const closeGroupDialog = useCallback(() => {
    setIsGroupDialogOpen(false)
    setSelectedGroupId(null)
  }, [])

  // 二级分组编辑对话框操作
  const openSecondaryGroupEditDialog = useCallback((group: SecondaryGroup) => {
    setSelectedSecondaryGroupId(group.id)
    setEditingSecondaryGroup(group)
    setIsSecondaryGroupEditDialogOpen(true)
  }, [])

  const closeSecondaryGroupEditDialog = useCallback(() => {
    setIsSecondaryGroupEditDialogOpen(false)
    setEditingSecondaryGroup(null)
    setSelectedSecondaryGroupId(null)
  }, [])

  // 确认对话框操作
  const openConfirmDeleteWebsite = useCallback((websiteId: string) => {
    setConfirmDialog({ open: true, websiteId })
  }, [])

  const closeConfirmDeleteWebsite = useCallback(() => {
    setConfirmDialog({ open: false, websiteId: null })
  }, [])

  const openConfirmDeleteSecondaryGroup = useCallback((secondaryGroupId: string) => {
    setSecondaryGroupConfirmDelete({ open: true, secondaryGroupId })
  }, [])

  const closeConfirmDeleteSecondaryGroup = useCallback(() => {
    setSecondaryGroupConfirmDelete({ open: false, secondaryGroupId: null })
  }, [])

  const openClearDataDialog = useCallback(() => {
    setClearDataDialogOpen(true)
  }, [])

  const closeClearDataDialog = useCallback(() => {
    setClearDataDialogOpen(false)
  }, [])

  const openResetDataDialog = useCallback(() => {
    setResetDataDialogOpen(true)
  }, [])

  const closeResetDataDialog = useCallback(() => {
    setResetDataDialogOpen(false)
  }, [])

  const openClearSoftwareDataDialog = useCallback(() => {
    setClearSoftwareDataDialogOpen(true)
  }, [])

  const closeClearSoftwareDataDialog = useCallback(() => {
    setClearSoftwareDataDialogOpen(false)
  }, [])

  const openClearCacheDialog = useCallback(() => {
    setClearCacheDialogOpen(true)
  }, [])

  const closeClearCacheDialog = useCallback(() => {
    setClearCacheDialogOpen(false)
  }, [])

  return {
    // 状态
    isWebsiteDialogOpen,
    isEditDialogOpen,
    editingWebsite,
    selectedGroupId,
    selectedSecondaryGroupId,
    isGroupDialogOpen,
    dialogMode,
    isSecondaryGroupEditDialogOpen,
    editingSecondaryGroup,
    confirmDialog,
    secondaryGroupConfirmDelete,
    clearDataDialogOpen,
    resetDataDialogOpen,
    clearSoftwareDataDialogOpen,
    clearCacheDialogOpen,

    // 操作函数
    openWebsiteDialog,
    closeWebsiteDialog,
    openEditWebsiteDialog,
    closeEditWebsiteDialog,
    openGroupDialog,
    closeGroupDialog,
    openSecondaryGroupEditDialog,
    closeSecondaryGroupEditDialog,
    openConfirmDeleteWebsite,
    closeConfirmDeleteWebsite,
    openConfirmDeleteSecondaryGroup,
    closeConfirmDeleteSecondaryGroup,
    openClearDataDialog,
    closeClearDataDialog,
    openResetDataDialog,
    closeResetDataDialog,
    openClearSoftwareDataDialog,
    closeClearSoftwareDataDialog,
    openClearCacheDialog,
    closeClearCacheDialog,

    // 状态设置函数
    setIsWebsiteDialogOpen,
    setIsEditDialogOpen,
    setEditingWebsite,
    setSelectedGroupId,
    setSelectedSecondaryGroupId,
    setIsGroupDialogOpen,
    setDialogMode,
    setIsSecondaryGroupEditDialogOpen,
    setEditingSecondaryGroup,
    setConfirmDialog,
    setSecondaryGroupConfirmDelete,
    setClearDataDialogOpen,
    setResetDataDialogOpen,
    setClearSoftwareDataDialogOpen,
    setClearCacheDialogOpen
  }
}
