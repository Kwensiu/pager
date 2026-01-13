import { screen, BrowserWindow } from 'electron'

/**
 * 窗口边缘吸附服务
 * 实现窗口拖动到屏幕边缘时自动吸附的功能
 */
class WindowAdsorptionService {
  private isAdjusting = false
  private adsorptionEnabled = true
  private threshold = 30 // 吸附阈值（像素）
  private mainWindow: BrowserWindow | null = null

  /**
   * 初始化窗口吸附服务
   * @param mainWindow 主窗口引用
   */
  initialize(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow
    this.setupMoveListener()
  }

  /**
   * 设置窗口移动监听器
   */
  private setupMoveListener(): void {
    if (!this.mainWindow) return

    this.mainWindow.on('move', () => {
      if (!this.adsorptionEnabled || this.isAdjusting) return
      this.handleEdgeAdsorption()
    })
  }

  /**
   * 处理窗口边缘吸附
   */
  private handleEdgeAdsorption(): void {
    if (!this.mainWindow || this.isAdjusting) return

    const windowBounds = this.mainWindow.getBounds()
    const centerPoint = {
      x: windowBounds.x + windowBounds.width / 2,
      y: windowBounds.y + windowBounds.height / 2
    }

    const display = screen.getDisplayNearestPoint(centerPoint)
    const workArea = display.workArea
    const scaleFactor = display.scaleFactor
    const threshold = this.threshold * scaleFactor

    // 计算窗口到各边缘的距离
    const leftEdgeDistance = windowBounds.x - workArea.x
    const rightEdgeDistance = workArea.x + workArea.width - (windowBounds.x + windowBounds.width)
    const topEdgeDistance = windowBounds.y - workArea.y
    const bottomEdgeDistance = workArea.y + workArea.height - (windowBounds.y + windowBounds.height)

    const newBounds = { ...windowBounds }
    let shouldAdjust = false

    // 左侧吸附
    if (Math.abs(leftEdgeDistance) <= threshold) {
      Object.assign(newBounds, {
        x: workArea.x,
        y: workArea.y,
        height: workArea.height
      })
      shouldAdjust = true
    }
    // 右侧吸附
    else if (Math.abs(rightEdgeDistance) <= threshold) {
      Object.assign(newBounds, {
        x: workArea.x + workArea.width - windowBounds.width,
        y: workArea.y,
        height: workArea.height
      })
      shouldAdjust = true
    }
    // 顶部吸附
    else if (Math.abs(topEdgeDistance) <= threshold) {
      Object.assign(newBounds, {
        x: workArea.x,
        y: workArea.y,
        width: workArea.width
      })
      shouldAdjust = true
    }
    // 底部吸附
    else if (Math.abs(bottomEdgeDistance) <= threshold) {
      Object.assign(newBounds, {
        x: workArea.x,
        y: workArea.y + workArea.height - windowBounds.height,
        width: workArea.width
      })
      shouldAdjust = true
    }

    // 角落吸附（左上、右上、左下、右下）
    if (!shouldAdjust) {
      // 左上角
      if (Math.abs(leftEdgeDistance) <= threshold && Math.abs(topEdgeDistance) <= threshold) {
        Object.assign(newBounds, {
          x: workArea.x,
          y: workArea.y
        })
        shouldAdjust = true
      }
      // 右上角
      else if (Math.abs(rightEdgeDistance) <= threshold && Math.abs(topEdgeDistance) <= threshold) {
        Object.assign(newBounds, {
          x: workArea.x + workArea.width - windowBounds.width,
          y: workArea.y
        })
        shouldAdjust = true
      }
      // 左下角
      else if (
        Math.abs(leftEdgeDistance) <= threshold &&
        Math.abs(bottomEdgeDistance) <= threshold
      ) {
        Object.assign(newBounds, {
          x: workArea.x,
          y: workArea.y + workArea.height - windowBounds.height
        })
        shouldAdjust = true
      }
      // 右下角
      else if (
        Math.abs(rightEdgeDistance) <= threshold &&
        Math.abs(bottomEdgeDistance) <= threshold
      ) {
        Object.assign(newBounds, {
          x: workArea.x + workArea.width - windowBounds.width,
          y: workArea.y + workArea.height - windowBounds.height
        })
        shouldAdjust = true
      }
    }

    if (shouldAdjust && JSON.stringify(newBounds) !== JSON.stringify(windowBounds)) {
      this.isAdjusting = true
      this.mainWindow.setBounds(newBounds, true)
      this.isAdjusting = false
    }
  }

  /**
   * 启用窗口边缘吸附
   */
  enable(): void {
    this.adsorptionEnabled = true
  }

  /**
   * 禁用窗口边缘吸附
   */
  disable(): void {
    this.adsorptionEnabled = false
  }

  /**
   * 切换窗口边缘吸附状态
   */
  toggle(): boolean {
    this.adsorptionEnabled = !this.adsorptionEnabled
    return this.adsorptionEnabled
  }

  /**
   * 获取窗口边缘吸附状态
   */
  isEnabled(): boolean {
    return this.adsorptionEnabled
  }

  /**
   * 设置吸附阈值
   * @param threshold 新的阈值（像素）
   */
  setThreshold(threshold: number): void {
    if (threshold >= 5 && threshold <= 100) {
      this.threshold = threshold
    }
  }

  /**
   * 获取吸附阈值
   */
  getThreshold(): number {
    return this.threshold
  }

  /**
   * 手动触发窗口吸附
   * @param edge 吸附边缘（'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'）
   */
  snapToEdge(edge: string): void {
    if (!this.mainWindow) return

    const windowBounds = this.mainWindow.getBounds()
    const display = screen.getDisplayNearestPoint({
      x: windowBounds.x + windowBounds.width / 2,
      y: windowBounds.y + windowBounds.height / 2
    })
    const workArea = display.workArea

    const newBounds = { ...windowBounds }

    switch (edge) {
      case 'left':
        Object.assign(newBounds, {
          x: workArea.x,
          y: workArea.y,
          height: workArea.height
        })
        break
      case 'right':
        Object.assign(newBounds, {
          x: workArea.x + workArea.width - windowBounds.width,
          y: workArea.y,
          height: workArea.height
        })
        break
      case 'top':
        Object.assign(newBounds, {
          x: workArea.x,
          y: workArea.y,
          width: workArea.width
        })
        break
      case 'bottom':
        Object.assign(newBounds, {
          x: workArea.x,
          y: workArea.y + workArea.height - windowBounds.height,
          width: workArea.width
        })
        break
      case 'top-left':
        Object.assign(newBounds, {
          x: workArea.x,
          y: workArea.y
        })
        break
      case 'top-right':
        Object.assign(newBounds, {
          x: workArea.x + workArea.width - windowBounds.width,
          y: workArea.y
        })
        break
      case 'bottom-left':
        Object.assign(newBounds, {
          x: workArea.x,
          y: workArea.y + workArea.height - windowBounds.height
        })
        break
      case 'bottom-right':
        Object.assign(newBounds, {
          x: workArea.x + workArea.width - windowBounds.width,
          y: workArea.y + workArea.height - windowBounds.height
        })
        break
      default:
        return
    }

    this.mainWindow.setBounds(newBounds, true)
  }

  /**
   * 获取窗口当前所在的屏幕信息
   */
  getCurrentScreenInfo(): {
    id: number
    bounds: Electron.Rectangle
    workArea: Electron.Rectangle
    scaleFactor: number
  } | null {
    if (!this.mainWindow) return null

    const windowBounds = this.mainWindow.getBounds()
    const centerPoint = {
      x: windowBounds.x + windowBounds.width / 2,
      y: windowBounds.y + windowBounds.height / 2
    }

    const display = screen.getDisplayNearestPoint(centerPoint)
    return {
      id: display.id,
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.mainWindow = null
    this.isAdjusting = false
  }
}

// 导出单例实例
export const windowAdsorptionService = new WindowAdsorptionService()
