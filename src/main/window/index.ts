import { join } from 'path'
import { existsSync } from 'fs'
import { app, BrowserWindow, shell } from 'electron'

function getIconPath(): string | undefined {
  // 将 app.getAppPath() 移到函数内部，避免在模块加载时访问 app
  const appPath = app.getAppPath()
  const iconPath = join(appPath, 'resources', 'icon.ico')
  if (existsSync(iconPath)) {
    console.log('Icon found at', iconPath)
    return iconPath
  }
  // 回退到开发资源路径
  const devPath = join(__dirname, '../../resources/icon.ico')
  if (existsSync(devPath)) {
    console.log('Icon found at dev path', devPath)
    return devPath
  }
  console.warn('Icon not found at', iconPath, 'or', devPath)
  return undefined
}

export async function createWindow(): Promise<Electron.BrowserWindow> {
  const icon = getIconPath()
  console.log('Creating window with icon:', icon)

  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      // 启用网络相关功能
      allowRunningInsecureContent: true,
      experimentalFeatures: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('resize', () => {
    // 通知渲染进程窗口大小变化
    mainWindow.webContents.send('window-resized')
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发模式检测
  const isDev = process.env.NODE_ENV === 'development' || !!process.env.ELECTRON_RENDERER_URL

  // 开发模式下打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// 处理证书错误
export function registerCertificateErrorHandler(): void {
  app.on(
    'certificate-error',
    (
      event: Electron.Event,
      _webContents: Electron.WebContents,
      _url: string,
      _error: string,
      _certificate: Electron.Certificate,
      callback: (isTrusted: boolean) => void
    ) => {
      // 忽略证书错误，继续加载
      event.preventDefault()
      callback(true) // 信任证书，允许继续加载
    }
  )
}
