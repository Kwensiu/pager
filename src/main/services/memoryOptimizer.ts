import type { Website } from '../../shared/types/store'

/**
 * 内存优化服务
 * 自动清理不活跃的站点，减少内存占用
 */
class MemoryOptimizerService {
  private cleanupTimer: NodeJS.Timeout | null = null
  private INACTIVE_THRESHOLD = 10 * 60 * 1000 // 10分钟（毫秒）
  private CLEANUP_INTERVAL = 5 * 60 * 1000 // 5分钟（毫秒）
  private optimizationEnabled = true
  private activeWebsites: Map<string, number> = new Map() // websiteId -> lastAccessTime

  /**
   * 开始内存优化清理
   */
  startCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    if (!this.optimizationEnabled) return

    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.CLEANUP_INTERVAL)

    console.log('Memory optimization cleanup started')
  }

  /**
   * 停止内存优化清理
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    console.log('Memory optimization cleanup stopped')
  }

  /**
   * 执行清理操作
   */
  private performCleanup(): void {
    if (!this.optimizationEnabled) return

    const now = Date.now()
    const inactiveWebsiteIds: string[] = []

    // 找出不活跃的网站
    for (const [websiteId, lastAccessTime] of this.activeWebsites.entries()) {
      if (now - lastAccessTime > this.INACTIVE_THRESHOLD) {
        inactiveWebsiteIds.push(websiteId)
      }
    }

    if (inactiveWebsiteIds.length > 0) {
      console.log(`Found ${inactiveWebsiteIds.length} inactive websites for cleanup`)
      this.emitCleanupEvent(inactiveWebsiteIds)
    }
  }

  /**
   * 标记网站为活跃
   * @param websiteId 网站ID
   */
  markWebsiteActive(websiteId: string): void {
    this.activeWebsites.set(websiteId, Date.now())
  }

  /**
   * 移除网站活跃记录
   * @param websiteId 网站ID
   */
  removeWebsite(websiteId: string): void {
    this.activeWebsites.delete(websiteId)
  }

  /**
   * 获取不活跃的网站ID列表
   */
  getInactiveWebsiteIds(): string[] {
    const now = Date.now()
    const inactiveIds: string[] = []

    for (const [websiteId, lastAccessTime] of this.activeWebsites.entries()) {
      if (now - lastAccessTime > this.INACTIVE_THRESHOLD) {
        inactiveIds.push(websiteId)
      }
    }

    return inactiveIds
  }

  /**
   * 获取活跃网站数量
   */
  getActiveWebsiteCount(): number {
    return this.activeWebsites.size
  }

  /**
   * 获取不活跃网站数量
   */
  getInactiveWebsiteCount(): number {
    return this.getInactiveWebsiteIds().length
  }

  /**
   * 启用内存优化
   */
  enable(): void {
    this.optimizationEnabled = true
    this.startCleanup()
  }

  /**
   * 禁用内存优化
   */
  disable(): void {
    this.optimizationEnabled = false
    this.stopCleanup()
  }

  /**
   * 切换内存优化状态
   */
  toggle(): boolean {
    this.optimizationEnabled = !this.optimizationEnabled
    if (this.optimizationEnabled) {
      this.startCleanup()
    } else {
      this.stopCleanup()
    }
    return this.optimizationEnabled
  }

  /**
   * 获取内存优化状态
   */
  isEnabled(): boolean {
    return this.optimizationEnabled
  }

  /**
   * 设置不活跃阈值
   * @param minutes 分钟数
   */
  setInactiveThreshold(minutes: number): void {
    if (minutes >= 1 && minutes <= 60) {
      this.INACTIVE_THRESHOLD = minutes * 60 * 1000
    }
  }

  /**
   * 设置清理间隔
   * @param minutes 分钟数
   */
  setCleanupInterval(minutes: number): void {
    if (minutes >= 1 && minutes <= 30) {
      this.CLEANUP_INTERVAL = minutes * 60 * 1000
      this.restartCleanup()
    }
  }

  /**
   * 重新启动清理定时器
   */
  private restartCleanup(): void {
    this.stopCleanup()
    this.startCleanup()
  }

  /**
   * 清理所有网站记录
   */
  clearAll(): void {
    this.activeWebsites.clear()
  }

  /**
   * 获取内存使用统计
   */
  getMemoryStats(): {
    activeCount: number
    inactiveCount: number
    totalCount: number
    optimizationEnabled: boolean
    inactiveThreshold: number
    cleanupInterval: number
  } {
    return {
      activeCount: this.getActiveWebsiteCount(),
      inactiveCount: this.getInactiveWebsiteCount(),
      totalCount: this.activeWebsites.size,
      optimizationEnabled: this.optimizationEnabled,
      inactiveThreshold: this.INACTIVE_THRESHOLD / (60 * 1000), // 转换为分钟
      cleanupInterval: this.CLEANUP_INTERVAL / (60 * 1000) // 转换为分钟
    }
  }

  /**
   * 手动触发清理
   */
  forceCleanup(): string[] {
    const inactiveIds = this.getInactiveWebsiteIds()
    this.emitCleanupEvent(inactiveIds)
    return inactiveIds
  }

  /**
   * 发出清理事件（供其他模块监听）
   */
  private emitCleanupEvent(inactiveWebsiteIds: string[]): void {
    // 这里可以添加事件发射逻辑
    // 例如：EventEmitter.emit('websites:cleanup', inactiveWebsiteIds)
    console.log(`Emitting cleanup event for ${inactiveWebsiteIds.length} websites`)
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.stopCleanup()
    this.clearAll()
  }

  /**
   * 根据网站列表更新活跃记录
   * @param websites 网站列表
   */
  updateActiveWebsites(websites: Website[]): void {
    const now = Date.now()
    const websiteIds = websites.map((w) => w.id)

    // 移除不存在的网站
    for (const websiteId of this.activeWebsites.keys()) {
      if (!websiteIds.includes(websiteId)) {
        this.activeWebsites.delete(websiteId)
      }
    }

    // 添加或更新存在的网站
    for (const website of websites) {
      if (!this.activeWebsites.has(website.id)) {
        this.activeWebsites.set(website.id, now)
      }
    }
  }
}

// 导出单例实例
export const memoryOptimizerService = new MemoryOptimizerService()
