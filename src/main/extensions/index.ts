import path from 'path'
import fs from 'fs/promises'
import { app } from 'electron'
import { ExtensionLoader } from './loader'
import { ExtensionInfo, ExtensionConfig } from './types'

/**
 * 扩展管理器类
 * 负责管理扩展的配置、加载和持久化
 */
export class ExtensionManager {
  private loader = new ExtensionLoader()
  private configPath: string | null = null
  private extensionsDir: string | null = null

  /**
   * 初始化扩展管理器
   * 必须在 app.whenReady() 之后调用
   */
  private ensureInitialized(): void {
    if (!this.extensionsDir) {
      this.extensionsDir = path.join(app.getPath('userData'), 'extensions')
      this.configPath = path.join(this.extensionsDir, 'extensions.json')
    }
  }

  /**
   * 确保扩展目录存在
   */
  private async ensureDirectories(): Promise<void> {
    this.ensureInitialized()
    if (!this.extensionsDir) return

    try {
      await fs.mkdir(this.extensionsDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create extensions directory:', error)
    }
  }

  /**
   * 加载所有已启用的扩展
   */
  async loadAllExtensions(): Promise<ExtensionInfo[]> {
    this.ensureInitialized()
    await this.ensureDirectories()
    const config = await this.loadConfig()
    const loaded: ExtensionInfo[] = []

    for (const ext of config.extensions) {
      if (ext.enabled) {
        try {
          // 检查扩展路径是否仍然存在
          await fs.access(ext.path)

          const info = await this.loader.loadExtension(ext.path)
          loaded.push(info)
        } catch (error) {
          console.error(`Failed to load extension ${ext.name}:`, error)
          // 如果扩展加载失败，将其标记为禁用
          ext.enabled = false
        }
      }
    }

    // 保存更新后的配置
    await this.saveConfig(config)

    return loaded
  }

  /**
   * 添加扩展
   * @param extensionPath 扩展文件夹路径
   */
  async addExtension(extensionPath: string): Promise<ExtensionInfo> {
    this.ensureInitialized()
    // 规范化路径
    const normalizedPath = path.normalize(extensionPath)

    // 检查扩展是否已存在
    const config = await this.loadConfig()
    const extensionName = await this.getExtensionName(normalizedPath)
    const existingExtension = config.extensions.find(
      (ext) => ext.path === normalizedPath || ext.name === extensionName
    )

    if (existingExtension) {
      throw new Error('Extension already exists')
    }

    // 加载扩展
    const info = await this.loader.loadExtension(normalizedPath)

    // 保存到配置
    config.extensions.push(info)
    await this.saveConfig(config)

    return info
  }

  /**
   * 删除扩展
   * @param extensionId 扩展 ID
   */
  async removeExtension(extensionId: string): Promise<void> {
    this.ensureInitialized()
    // 卸载扩展
    await this.loader.unloadExtension(extensionId)

    // 从配置中删除
    const config = await this.loadConfig()
    config.extensions = config.extensions.filter((e) => e.id !== extensionId)
    await this.saveConfig(config)
  }

  /**
   * 启用/禁用扩展
   * @param extensionId 扩展 ID
   * @param enabled 是否启用
   */
  async toggleExtension(extensionId: string, enabled: boolean): Promise<void> {
    this.ensureInitialized()
    const config = await this.loadConfig()
    const ext = config.extensions.find((e) => e.id === extensionId)

    if (!ext) {
      throw new Error('Extension not found')
    }

    if (enabled) {
      // 启用扩展
      try {
        await this.loader.loadExtension(ext.path)
        ext.enabled = true
      } catch (error) {
        console.error(`Failed to enable extension ${ext.name}:`, error)
        throw error
      }
    } else {
      // 禁用扩展
      try {
        await this.loader.unloadExtension(extensionId)
        ext.enabled = false
      } catch (error) {
        console.error(`Failed to disable extension ${ext.name}:`, error)
        throw error
      }
    }

    await this.saveConfig(config)
  }

  /**
   * 获取所有扩展（包括已加载和未加载的）
   */
  async getAllExtensions(): Promise<ExtensionInfo[]> {
    this.ensureInitialized()
    const config = await this.loadConfig()
    return config.extensions
  }

  /**
   * 获取已加载的扩展
   */
  getLoadedExtensions(): ExtensionInfo[] {
    return this.loader.getLoadedExtensions()
  }

  /**
   * 获取指定扩展的信息
   * @param extensionId 扩展 ID
   */
  async getExtension(extensionId: string): Promise<ExtensionInfo | undefined> {
    this.ensureInitialized()
    const config = await this.loadConfig()
    return config.extensions.find((e) => e.id === extensionId)
  }

  /**
   * 验证扩展文件夹
   * @param extensionPath 扩展文件夹路径
   */
  async validateExtension(
    extensionPath: string
  ): Promise<{ valid: boolean; error?: string; manifest?: unknown }> {
    this.ensureInitialized()
    try {
      const manifestPath = path.join(extensionPath, 'manifest.json')
      await fs.access(manifestPath)

      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(manifestContent)

      if (!manifest.name || !manifest.version) {
        return { valid: false, error: 'Manifest must contain name and version' }
      }

      return { valid: true, manifest }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 从扩展路径获取扩展名称
   * @param extensionPath 扩展文件夹路径
   */
  private async getExtensionName(extensionPath: string): Promise<string> {
    try {
      const manifestPath = path.join(extensionPath, 'manifest.json')
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      const manifest = JSON.parse(manifestContent)
      return manifest.name
    } catch {
      return ''
    }
  }

  /**
   * 加载配置文件
   */
  private async loadConfig(): Promise<ExtensionConfig> {
    this.ensureInitialized()
    if (!this.configPath) {
      return { extensions: [] }
    }
    try {
      const content = await fs.readFile(this.configPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return { extensions: [] }
    }
  }

  /**
   * 保存配置文件
   */
  private async saveConfig(config: ExtensionConfig): Promise<void> {
    this.ensureInitialized()
    if (!this.configPath) {
      return
    }
    try {
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2))
    } catch (error) {
      console.error('Failed to save extension config:', error)
    }
  }

  /**
   * 清空所有扩展
   */
  async clearAllExtensions(): Promise<void> {
    await this.loader.unloadAllExtensions()
    await this.saveConfig({ extensions: [] })
  }
}
