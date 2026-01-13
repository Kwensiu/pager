import { ipcMain } from 'electron'
import { SimpleExtensionManager } from '../extensions/simpleManager'

export function registerSimpleExtensionHandlers(): void {
  const extensionManager = SimpleExtensionManager.getInstance()

  // 获取所有扩展
  ipcMain.handle('extension:getAll', async () => {
    try {
      return { success: true, extensions: extensionManager.getAllExtensions() }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // 添加扩展
  ipcMain.handle('extension:add', async (_, extensionPath: string) => {
    try {
      return await extensionManager.addExtension(extensionPath)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // 移除扩展
  ipcMain.handle('extension:remove', async (_, extensionId: string) => {
    try {
      return await extensionManager.removeExtension(extensionId)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // 切换扩展状态
  ipcMain.handle('extension:toggle', async (_, extensionId: string) => {
    try {
      return await extensionManager.toggleExtension(extensionId)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // 验证扩展
  ipcMain.handle('extension:validate', async (_, extensionPath: string) => {
    try {
      return await extensionManager.validateExtension(extensionPath)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { valid: false, error: errorMessage }
    }
  })

  // 获取已加载的扩展
  ipcMain.handle('extension:getLoaded', async () => {
    try {
      return { success: true, loaded: extensionManager.getLoadedExtensions() }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // 获取扩展设置
  ipcMain.handle('extension:getSettings', async () => {
    try {
      return { success: true, settings: extensionManager.getSettings() }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  })

  // 更新扩展设置
  ipcMain.handle(
    'extension:updateSettings',
    async (_, settings: { enableExtensions?: boolean; autoLoadExtensions?: boolean }) => {
      try {
        extensionManager.updateSettings(settings)
        return { success: true }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { success: false, error: errorMessage }
      }
    }
  )
}
