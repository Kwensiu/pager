import { ExtensionManager } from '../extensions'
import { ipcMain } from 'electron'

let extensionManager: ExtensionManager | null = null

/**
 * 注册扩展相关的 IPC 处理器
 * @param manager 扩展管理器实例
 */
export function registerExtensionHandlers(manager: ExtensionManager): void {
  extensionManager = manager

  // 获取所有扩展
  ipcMain.handle('extension:getAll', async () => {
    if (!extensionManager) {
      throw new Error('Extension manager not initialized')
    }
    return await extensionManager.getAllExtensions()
  })

  // 添加扩展
  ipcMain.handle('extension:add', async (_, extensionPath: string) => {
    if (!extensionManager) {
      throw new Error('Extension manager not initialized')
    }
    return await extensionManager.addExtension(extensionPath)
  })

  // 删除扩展
  ipcMain.handle('extension:remove', async (_, extensionId: string) => {
    if (!extensionManager) {
      throw new Error('Extension manager not initialized')
    }
    await extensionManager.removeExtension(extensionId)
  })

  // 启用/禁用扩展
  ipcMain.handle('extension:toggle', async (_, extensionId: string, enabled: boolean) => {
    if (!extensionManager) {
      throw new Error('Extension manager not initialized')
    }
    await extensionManager.toggleExtension(extensionId, enabled)
  })

  // 验证扩展
  ipcMain.handle('extension:validate', async (_, extensionPath: string) => {
    if (!extensionManager) {
      throw new Error('Extension manager not initialized')
    }
    return await extensionManager.validateExtension(extensionPath)
  })

  // 获取已加载的扩展
  ipcMain.handle('extension:getLoaded', async () => {
    if (!extensionManager) {
      throw new Error('Extension manager not initialized')
    }
    return extensionManager.getLoadedExtensions()
  })
}
