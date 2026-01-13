import { app, BrowserWindow } from 'electron'
import { createWindow } from './window'
import { registerIpcHandlers } from './ipc'
import { registerSimpleExtensionHandlers } from './ipc/simpleExtensionHandlers'
import { SimpleExtensionManager } from './extensions/simpleManager'

let mainWindow: BrowserWindow | null = null

app.whenReady().then(async () => {
  // 设置忽略SSL错误
  app.commandLine.appendSwitch('ignore-certificate-errors')
  app.commandLine.appendSwitch('allow-running-insecure-content')
  // 设置 App User Model ID for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.pager.app')
  }

  // 监听窗口创建事件，设置快捷键优化
  app.on('browser-window-created', (_, window) => {
    // 为新窗口设置快捷键优化
    // 这里简化处理，实际可以添加更多优化
    window.webContents.on('before-input-event', () => {
      // 可以在这里添加快捷键处理逻辑
    })
  })

  // 创建窗口
  mainWindow = await createWindow()
  await registerIpcHandlers(mainWindow)

  // 注册扩展相关的 IPC 处理器
  registerSimpleExtensionHandlers()

  // 初始化扩展管理器并加载所有已启用的扩展
  const extensionManager = SimpleExtensionManager.getInstance()
  extensionManager.initialize(app.getPath('userData'))

  extensionManager.loadAllExtensions().catch((error) => {
    console.error('Failed to load extensions:', error)
  })

  app.on('activate', async function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = await createWindow()
    }
    mainWindow?.show()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
