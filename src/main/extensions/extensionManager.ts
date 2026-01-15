import { join } from 'path'
import {
  existsSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  readFileSync as fsReadFileSync
} from 'fs'
import type { ExtensionInfo, ExtensionManifest, ExtensionConfig } from './types'
import { extensionIsolationManager } from '../services/extensionIsolation'
import { extensionPermissionManager } from '../services/extensionPermissionManager'
import { extensionErrorManager } from '../services/extensionErrorManager'
import {
  ExtensionSettings,
  ExtensionIsolationLevel,
  ExtensionRiskLevel
} from '../../shared/types/store'

// 动态导入 adm-zip 以避免在模块顶层导入
let AdmZip: typeof import('adm-zip').default | null = null
async function getAdmZip(): Promise<typeof import('adm-zip').default> {
  if (!AdmZip) {
    AdmZip = (await import('adm-zip')).default
  }
  return AdmZip
}

// 解析 CRX 文件
function parseCrxFile(crxPath: string): Buffer {
  const data = fsReadFileSync(crxPath)
  console.log(`[DEBUG] Parsing CRX file: ${crxPath}, total size: ${data.length} bytes`)

  // 检查文件大小
  if (data.length < 16) {
    throw new Error('Invalid CRX file: file too small (less than 16 bytes)')
  }

  // 检查 CRX 魔数
  const magic = data.toString('ascii', 0, 4)
  console.log(`[DEBUG] CRX magic number: "${magic}"`)

  if (magic !== 'Cr24') {
    throw new Error(`Invalid CRX file: magic number mismatch (expected "Cr24", got "${magic}")`)
  }

  // 读取版本号
  const version = data.readUInt32LE(4)
  console.log(`[DEBUG] CRX version: ${version}`)

  if (version !== 2 && version !== 3) {
    throw new Error(`Unsupported CRX version: ${version} (only version 2 and 3 are supported)`)
  }

  let headerSize = 16
  let zipDataOffset = 16

  if (version === 3) {
    // CRX v3 有不同的头部结构
    if (data.length < 32) {
      throw new Error('Invalid CRX v3 file: file too small for v3 header')
    }

    // v3 格式: [magic(4)][version(4)][headerLength(4)][pubkeyOffset(4)][pubkeyLength(4)][sigLength(4)]
    const headerLength = data.readUInt32LE(8)
    const pubkeyOffset = data.readUInt32LE(12)
    const publicKeyLength = data.readUInt32LE(16)
    const signatureLength = data.readUInt32LE(20)

    console.log(`[DEBUG] CRX v3 header length: ${headerLength}`)
    console.log(`[DEBUG] Public key offset: ${pubkeyOffset}`)
    console.log(`[DEBUG] Public key length: ${publicKeyLength} bytes`)
    console.log(`[DEBUG] Signature length: ${signatureLength} bytes`)

    // 验证参数的合理性 - CRX v3 的偏移和长度可能很大，需要更宽松的检查
    if (headerLength > data.length || pubkeyOffset > data.length) {
      console.log(`[DEBUG] Invalid header parameters, trying fallback...`)
      // 尝试搜索 ZIP 魔数
      return parseCrxV2Format(data)
    }

    // 对于 CRX v3，首先尝试使用 headerLength 作为 ZIP 数据偏移
    zipDataOffset = headerLength

    // 验证这个偏移是否有效
    if (zipDataOffset >= data.length) {
      console.log(`[DEBUG] Invalid ZIP offset, trying fallback...`)
      return parseCrxV2Format(data)
    }

    // 检查这个位置是否真的是 ZIP 数据
    if (zipDataOffset + 4 <= data.length) {
      const zipMagic = data.toString('ascii', zipDataOffset, zipDataOffset + 4)
      if (zipMagic !== 'PK\x03\x04' && zipMagic !== 'PK\x05\x06' && zipMagic !== 'PK\x07\x08') {
        console.log(`[DEBUG] No ZIP magic at offset ${zipDataOffset}, trying fallback...`)
        return parseCrxV2Format(data)
      }
    }

    console.log(`[DEBUG] ZIP data offset: ${zipDataOffset}`)
  } else {
    // CRX v2 格式
    const publicKeyLength = data.readUInt32LE(8)
    const signatureLength = data.readUInt32LE(12)
    console.log(`[DEBUG] Public key length: ${publicKeyLength} bytes`)
    console.log(`[DEBUG] Signature length: ${signatureLength} bytes`)

    // 验证公钥和签名长度的合理性
    if (publicKeyLength > 10000) {
      throw new Error(
        `Invalid CRX file: public key length too large (${publicKeyLength} bytes, max 10000)`
      )
    }

    if (signatureLength > 1000000) {
      throw new Error(
        `Invalid CRX file: signature length too large (${signatureLength} bytes, max 1000000)`
      )
    }

    headerSize = 16 + publicKeyLength + signatureLength
    zipDataOffset = headerSize
    console.log(`[DEBUG] Header size: ${headerSize} bytes`)
    console.log(`[DEBUG] ZIP data starts at offset: ${headerSize}`)
  }

  // 检查是否有足够的数据
  if (zipDataOffset >= data.length) {
    throw new Error(
      `Invalid CRX file: ZIP data offset (${zipDataOffset}) exceeds file size (${data.length} bytes)`
    )
  }

  const zipDataSize = data.length - zipDataOffset
  console.log(`[DEBUG] ZIP data size: ${zipDataSize} bytes`)

  // 返回 ZIP 数据
  return data.subarray(zipDataOffset)
}

// 回退到 v2 格式解析
function parseCrxV2Format(data: Buffer): Buffer {
  console.log(`[DEBUG] Trying v2 format fallback...`)

  const publicKeyLength = data.readUInt32LE(8)
  const signatureLength = data.readUInt32LE(12)

  // 如果长度不合理，尝试搜索 ZIP 魔数
  if (publicKeyLength > 10000 || signatureLength > 1000000) {
    console.log(`[DEBUG] Searching for ZIP magic in file...`)

    // 搜索 ZIP 魔数 - 扩大搜索范围
    const maxSearchOffset = Math.min(data.length - 4, 10000) // 扩大到 10000 字节
    console.log(`[DEBUG] Searching ZIP magic in range 16-${maxSearchOffset}`)
    for (let i = 16; i < maxSearchOffset; i++) {
      if (data.toString('ascii', i, i + 4) === 'PK\x03\x04') {
        console.log(`[DEBUG] Found ZIP magic at offset: ${i}`)
        return data.subarray(i)
      }
    }

    // 如果没找到 PK\x03\x04，尝试其他 ZIP 魔数
    console.log(`[DEBUG] Trying other ZIP magic numbers...`)
    for (let i = 16; i < maxSearchOffset; i++) {
      const magic = data.toString('ascii', i, i + 4)
      if (magic === 'PK\x05\x06' || magic === 'PK\x07\x08') {
        console.log(`[DEBUG] Found ZIP magic "${magic}" at offset: ${i}`)
        return data.subarray(i)
      }
    }

    throw new Error('Could not find valid ZIP data in CRX file')
  }

  const headerSize = 16 + publicKeyLength + signatureLength
  if (headerSize >= data.length) {
    throw new Error(
      `Invalid CRX file: header size (${headerSize}) exceeds file size (${data.length})`
    )
  }

  return data.subarray(headerSize)
}

// 检查是否是有效的 CRX 文件
function isValidCrxFile(crxPath: string): boolean {
  try {
    const data = fsReadFileSync(crxPath)
    console.log(`[DEBUG] Checking CRX file: ${crxPath}, size: ${data.length} bytes`)

    if (data.length < 4) {
      console.log(`[DEBUG] File too small to be a CRX file`)
      return false
    }

    const magic = data.toString('ascii', 0, 4)
    console.log(`[DEBUG] File magic number: "${magic}"`)

    const isValid = magic === 'Cr24'
    console.log(`[DEBUG] CRX file valid: ${isValid}`)

    return isValid
  } catch (error) {
    console.error(`[DEBUG] Error checking CRX file:`, error)
    return false
  }
}

export class ExtensionManager {
  private static instance: ExtensionManager
  private extensions: Map<string, ExtensionInfo> = new Map()
  private configPath: string = ''
  private config: ExtensionConfig = { extensions: [] }
  private settings: ExtensionSettings = {
    enableExtensions: true,
    autoLoadExtensions: true,
    defaultIsolationLevel: ExtensionIsolationLevel.STANDARD,
    defaultRiskTolerance: ExtensionRiskLevel.MEDIUM
  }
  private extensionSessions: Map<
    string,
    import('../services/extensionIsolation').ExtensionSession
  > = new Map()

  static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager()
    }
    return ExtensionManager.instance
  }

  initialize(userDataPath: string): void {
    this.configPath = join(userDataPath, 'extensions', 'extensions.json')
    this.loadConfig()
  }

  private loadConfig(): void {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf-8')
        const config = JSON.parse(data)

        this.config = { extensions: config.extensions || [] }
        this.settings = { ...this.settings, ...(config.settings || {}) }

        // 将配置中的扩展加载到内存
        this.config.extensions.forEach((ext) => {
          this.extensions.set(ext.id, ext)
        })
      } else {
        this.config = { extensions: [] }
        this.saveConfig()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Failed to load extension config:', errorMessage)
      this.config = { extensions: [] }
    }
  }

  private saveConfig(): void {
    try {
      const dir = join(this.configPath, '..')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      this.config.extensions = Array.from(this.extensions.values())
      // 将 settings 和 config 一起保存
      const configWithSettings = {
        extensions: this.config.extensions,
        settings: this.settings
      }
      writeFileSync(this.configPath, JSON.stringify(configWithSettings, null, 2))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Failed to save extension config:', errorMessage)
    }
  }

  // 验证扩展 manifest
  private validateManifest(manifest: ExtensionManifest): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []

    // 检查 manifest 版本
    if (!manifest.manifest_version) {
      return { valid: false, warnings: ['manifest_version is required'] }
    }

    // 检查 Manifest V2 兼容性
    if (manifest.manifest_version === 2) {
      warnings.push('Manifest V2 is deprecated, consider upgrading to V3')

      // 检查 background.scripts
      if (manifest.background?.scripts) {
        warnings.push('background.scripts is only supported in Manifest V2')
      }
    }

    // 检查不支持的权限
    const unsupportedPermissions = [
      'contextMenus',
      'webNavigation',
      'background',
      'debugger',
      'pageCapture',
      'privacy'
    ]

    if (manifest.permissions) {
      const foundUnsupported = manifest.permissions.filter((p) =>
        unsupportedPermissions.includes(p)
      )
      if (foundUnsupported.length > 0) {
        warnings.push(`Unsupported permissions: ${foundUnsupported.join(', ')}`)
      }
    }

    // 检查必需字段
    if (!manifest.name) {
      return { valid: false, warnings: ['Extension name is required'] }
    }

    if (!manifest.version) {
      return { valid: false, warnings: ['Extension version is required'] }
    }

    return { valid: true, warnings }
  }

  async validateExtension(
    extensionPath: string
  ): Promise<{ valid: boolean; manifest?: ExtensionManifest; error?: string }> {
    try {
      // 检查是否是 CRX 文件
      if (extensionPath.toLowerCase().endsWith('.crx')) {
        return await this.validateExtensionFromCrx(extensionPath)
      }

      // 检查是否是 ZIP 文件
      if (extensionPath.toLowerCase().endsWith('.zip')) {
        return await this.validateExtensionFromZip(extensionPath)
      }

      if (!existsSync(extensionPath)) {
        return { valid: false, error: 'Extension path does not exist' }
      }

      const manifestPath = join(extensionPath, 'manifest.json')
      if (!existsSync(manifestPath)) {
        return { valid: false, error: 'manifest.json not found' }
      }

      const manifestData = readFileSync(manifestPath, 'utf-8')
      const manifest = JSON.parse(manifestData)

      // 基本验证
      if (!manifest.name) {
        return { valid: false, error: 'Extension name is required' }
      }

      if (!manifest.version) {
        return { valid: false, error: 'Extension version is required' }
      }

      // Chrome 扩展需要 manifest_version
      if (!manifest.manifest_version) {
        return { valid: false, error: 'manifest_version is required' }
      }

      return { valid: true, manifest }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { valid: false, error: `Failed to validate extension: ${errorMessage}` }
    }
  }

  async validateExtensionFromZip(
    zipPath: string
  ): Promise<{ valid: boolean; manifest?: ExtensionManifest; error?: string }> {
    try {
      const AdmZip = await getAdmZip()
      const zip = new AdmZip(zipPath)

      // 读取 manifest.json
      const manifestEntry = zip.getEntry('manifest.json')
      if (!manifestEntry) {
        return { valid: false, error: 'manifest.json not found in ZIP file' }
      }

      const manifestData = manifestEntry.getData().toString('utf-8')
      const manifest: ExtensionManifest = JSON.parse(manifestData)

      // 验证扩展 manifest
      const manifestValidation = this.validateManifest(manifest)
      if (!manifestValidation.valid) {
        return { valid: false, error: manifestValidation.warnings.join(', ') }
      }

      // 显示兼容性警告
      if (manifestValidation.warnings.length > 0) {
        console.log(`[EXTENSION WARNING] ${manifest.name}:`)
        manifestValidation.warnings.forEach((warning) => {
          console.log(`  - ${warning}`)
        })
      }

      // 基本验证
      if (!manifest.name) {
        return { valid: false, error: 'Extension name is required' }
      }

      if (!manifest.version) {
        return { valid: false, error: 'Extension version is required' }
      }

      if (!manifest.manifest_version) {
        return { valid: false, error: 'manifest_version is required' }
      }

      return { valid: true, manifest }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { valid: false, error: `Failed to validate ZIP extension: ${errorMessage}` }
    }
  }

  async addExtension(
    extensionPath: string
  ): Promise<{ success: boolean; extension?: ExtensionInfo; error?: string }> {
    try {
      // 检查是否是 CRX 文件
      if (extensionPath.toLowerCase().endsWith('.crx')) {
        return await this.addExtensionFromCrx(extensionPath)
      }

      // 检查是否是 ZIP 文件
      if (extensionPath.toLowerCase().endsWith('.zip')) {
        return await this.addExtensionFromZip(extensionPath)
      }

      const validation = await this.validateExtension(extensionPath)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      const manifest = validation.manifest!
      const extensionId = this.generateExtensionId(manifest.name, manifest.version)

      // 检查是否已存在
      if (this.extensions.has(extensionId)) {
        return { success: false, error: 'Extension already exists' }
      }

      const extension: ExtensionInfo = {
        id: extensionId,
        name: manifest.name,
        version: manifest.version,
        path: extensionPath,
        enabled: true,
        manifest
      }

      this.extensions.set(extensionId, extension)
      this.saveConfig()

      // 如果启用，立即加载
      if (extension.enabled) {
        await this.loadExtension(extension)
      }

      return { success: true, extension }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to add extension: ${errorMessage}` }
    }
  }

  async addExtensionFromZip(
    zipPath: string
  ): Promise<{ success: boolean; extension?: ExtensionInfo; error?: string }> {
    try {
      const AdmZip = await getAdmZip()
      const zip = new AdmZip(zipPath)

      // 读取 manifest.json
      const manifestEntry = zip.getEntry('manifest.json')
      if (!manifestEntry) {
        return { success: false, error: 'manifest.json not found in ZIP file' }
      }

      const manifestData = manifestEntry.getData().toString('utf-8')
      const manifest: ExtensionManifest = JSON.parse(manifestData)

      // 基本验证
      if (!manifest.name) {
        return { success: false, error: 'Extension name is required' }
      }

      if (!manifest.version) {
        return { success: false, error: 'Extension version is required' }
      }

      if (!manifest.manifest_version) {
        return { success: false, error: 'manifest_version is required' }
      }

      const extensionId = this.generateExtensionId(manifest.name, manifest.version)

      // 检查是否已存在
      if (this.extensions.has(extensionId)) {
        return { success: false, error: 'Extension already exists' }
      }

      // 创建解压目录
      const extractDir = join(this.configPath, '..', 'extracted', extensionId)
      if (existsSync(extractDir)) {
        rmSync(extractDir, { recursive: true, force: true })
      }
      mkdirSync(extractDir, { recursive: true })

      // 解压 ZIP 文件
      zip.extractAllTo(extractDir, true)

      const extension: ExtensionInfo = {
        id: extensionId,
        name: manifest.name,
        version: manifest.version,
        path: extractDir,
        enabled: true,
        manifest
      }

      this.extensions.set(extensionId, extension)
      this.saveConfig()

      // 如果启用，立即加载
      if (extension.enabled) {
        await this.loadExtension(extension)
      }

      return { success: true, extension }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to add extension from ZIP: ${errorMessage}` }
    }
  }

  async addExtensionFromCrx(
    crxPath: string
  ): Promise<{ success: boolean; extension?: ExtensionInfo; error?: string }> {
    try {
      // 检查是否是有效的 CRX 文件
      if (!isValidCrxFile(crxPath)) {
        // 如果不是 CRX 格式，尝试作为 ZIP 文件处理
        return await this.addExtensionFromZip(crxPath)
      }

      // 解析 CRX 文件获取 ZIP 数据
      const zipData = parseCrxFile(crxPath)

      // 使用 adm-zip 处理 ZIP 数据
      const AdmZip = await getAdmZip()
      const zip = new AdmZip(zipData)

      // 读取 manifest.json
      const manifestEntry = zip.getEntry('manifest.json')
      if (!manifestEntry) {
        return { success: false, error: 'manifest.json not found in CRX file' }
      }

      const manifestData = manifestEntry.getData().toString('utf-8')
      const manifest: ExtensionManifest = JSON.parse(manifestData)

      // 基本验证
      if (!manifest.name) {
        return { success: false, error: 'Extension name is required' }
      }

      if (!manifest.version) {
        return { success: false, error: 'Extension version is required' }
      }

      if (!manifest.manifest_version) {
        return { success: false, error: 'manifest_version is required' }
      }

      const extensionId = this.generateExtensionId(manifest.name, manifest.version)

      // 检查是否已存在
      if (this.extensions.has(extensionId)) {
        return { success: false, error: 'Extension already exists' }
      }

      // 创建解压目录
      const extractDir = join(this.configPath, '..', 'extracted', extensionId)
      if (existsSync(extractDir)) {
        rmSync(extractDir, { recursive: true, force: true })
      }
      mkdirSync(extractDir, { recursive: true })

      // 解压 ZIP 数据
      zip.extractAllTo(extractDir, true)

      const extension: ExtensionInfo = {
        id: extensionId,
        name: manifest.name,
        version: manifest.version,
        path: extractDir,
        enabled: true,
        manifest
      }

      this.extensions.set(extensionId, extension)
      this.saveConfig()

      // 如果启用，立即加载
      if (extension.enabled) {
        await this.loadExtension(extension)
      }

      return { success: true, extension }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to add extension from CRX: ${errorMessage}` }
    }
  }

  async validateExtensionFromCrx(
    crxPath: string
  ): Promise<{ valid: boolean; manifest?: ExtensionManifest; error?: string }> {
    try {
      console.log(`[DEBUG] Validating CRX file: ${crxPath}`)

      // 检查文件是否存在
      if (!existsSync(crxPath)) {
        return { valid: false, error: `CRX file does not exist: ${crxPath}` }
      }

      // 检查文件大小
      const stats = fsReadFileSync(crxPath)
      console.log(`[DEBUG] CRX file size: ${stats.length} bytes`)

      // 检查是否是有效的 CRX 文件
      if (!isValidCrxFile(crxPath)) {
        console.log(`[DEBUG] Not a valid CRX file, trying as ZIP...`)
        // 如果不是 CRX 格式，尝试作为 ZIP 文件处理
        return await this.validateExtensionFromZip(crxPath)
      }

      console.log(`[DEBUG] Valid CRX format detected, parsing...`)

      try {
        // 解析 CRX 文件获取 ZIP 数据
        const zipData = parseCrxFile(crxPath)
        console.log(`[DEBUG] Extracted ZIP data size: ${zipData.length} bytes`)

        // 使用 adm-zip 处理 ZIP 数据
        const AdmZip = await getAdmZip()
        const zip = new AdmZip(zipData)

        // 读取 manifest.json
        const manifestEntry = zip.getEntry('manifest.json')
        if (!manifestEntry) {
          return { valid: false, error: 'manifest.json not found in CRX file' }
        }

        const manifestData = manifestEntry.getData().toString('utf-8')
        console.log(`[DEBUG] Manifest data: ${manifestData.substring(0, 200)}...`)

        const manifest: ExtensionManifest = JSON.parse(manifestData)

        // 基本验证
        if (!manifest.name) {
          return { valid: false, error: 'Extension name is required' }
        }

        if (!manifest.version) {
          return { valid: false, error: 'Extension version is required' }
        }

        if (!manifest.manifest_version) {
          return { valid: false, error: 'manifest_version is required' }
        }

        console.log(`[DEBUG] CRX validation successful for: ${manifest.name} v${manifest.version}`)
        return { valid: true, manifest }
      } catch (crxError) {
        console.error(`[DEBUG] CRX parsing failed:`, crxError)
        console.log(`[DEBUG] Trying fallback to ZIP processing...`)

        // 如果 CRX 解析失败，尝试直接作为 ZIP 处理
        // 这可能对某些损坏的 CRX 文件有效
        try {
          return await this.validateExtensionFromZip(crxPath)
        } catch (zipError) {
          console.error(`[DEBUG] ZIP fallback also failed:`, zipError)
          return {
            valid: false,
            error: `CRX parsing failed: ${(crxError as Error).message}. ZIP fallback also failed: ${(zipError as Error).message}`
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[DEBUG] CRX validation failed:`, error)
      return { valid: false, error: `Failed to validate CRX extension: ${errorMessage}` }
    }
  }

  async removeExtension(extensionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const extension = this.extensions.get(extensionId)
      if (!extension) {
        return { success: false, error: 'Extension not found' }
      }

      // 销毁扩展会话
      await this.destroyExtensionSession(extensionId)

      // 如果已加载，先卸载
      if (extension.enabled) {
        await this.unloadExtension(extensionId)
      }

      this.extensions.delete(extensionId)
      this.saveConfig()

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to remove extension: ${errorMessage}` }
    }
  }

  async toggleExtension(extensionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const extension = this.extensions.get(extensionId)
      if (!extension) {
        return { success: false, error: 'Extension not found' }
      }

      extension.enabled = !extension.enabled
      this.saveConfig()

      if (extension.enabled) {
        await this.loadExtension(extension)
      } else {
        await this.unloadExtension(extensionId)
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to toggle extension: ${errorMessage}` }
    }
  }

  getAllExtensions(): ExtensionInfo[] {
    return Array.from(this.extensions.values())
  }

  getExtension(extensionId: string): ExtensionInfo | undefined {
    return this.extensions.get(extensionId)
  }

  async loadAllExtensions(): Promise<void> {
    // 检查是否启用扩展功能
    if (!this.settings.enableExtensions) {
      console.log('Extensions are disabled in settings')
      return
    }

    // 检查是否自动加载扩展
    if (!this.settings.autoLoadExtensions) {
      console.log('Auto-load extensions is disabled in settings')
      return
    }

    const extensions = this.getAllExtensions()
    for (const extension of extensions) {
      if (extension.enabled) {
        try {
          await this.loadExtension(extension)
        } catch (error) {
          console.error(`Failed to load extension ${extension.name}:`, error)
        }
      }
    }
  }

  getSettings(): ExtensionSettings {
    return { ...this.settings }
  }

  updateSettings(newSettings: Partial<ExtensionSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveConfig()
    console.log('Extension settings updated:', this.settings)
  }

  private async loadExtension(extension: ExtensionInfo): Promise<void> {
    try {
      // 验证扩展权限
      const riskLevel = this.settings.defaultRiskTolerance
      const permissionValidation = await extensionPermissionManager.validateExtensionPermissions(
        extension,
        riskLevel
      )

      if (!permissionValidation.valid) {
        throw new Error(
          `Permission validation failed: ${permissionValidation.blockedPermissions.map((p) => p.permission).join(', ')}`
        )
      }

      // 创建扩展会话
      const isolationLevel = this.settings.defaultIsolationLevel
      const extensionSession = await extensionIsolationManager.createExtensionSession(
        extension,
        isolationLevel
      )

      // 存储会话信息
      this.extensionSessions.set(extension.id, extensionSession)

      // 使用隔离的 session 加载扩展
      const isolationSession = extensionIsolationManager.getExtensionSession(extension.id)
      if (!isolationSession) {
        throw new Error('Failed to create extension session')
      }

      // 同时加载扩展到主窗口的 session 中，以便访问扩展页面
      try {
        const { session } = await import('electron')
        if (session.defaultSession.extensions && session.defaultSession.extensions.loadExtension) {
          await session.defaultSession.extensions.loadExtension(extension.path)
          console.log(`Extension ${extension.name} also loaded in main session`)
        } else {
          await session.defaultSession.loadExtension(extension.path)
          console.log(`Extension ${extension.name} also loaded in main session (legacy API)`)
        }
      } catch (mainSessionError) {
        console.warn(
          `Failed to load extension ${extension.name} in main session:`,
          mainSessionError
        )
        // 不抛出错误，因为隔离 session 加载已经成功
        // 但记录错误以便调试
        console.log('Main session loading failed, but extension still works in isolation')
      }

      // 使用新的 API (session.extensions.loadExtension) 如果可用
      if (
        isolationSession.session.extensions &&
        isolationSession.session.extensions.loadExtension
      ) {
        await isolationSession.session.extensions.loadExtension(extension.path)
      } else {
        // 回退到旧的 API
        await isolationSession.session.loadExtension(extension.path)
      }
    } catch (error) {
      console.error(`Failed to load extension ${extension.name}:`, error)

      // 使用错误管理器处理错误
      await extensionErrorManager.handleLoadError(extension, error as Error)

      throw error
    }
  }

  private async unloadExtension(extensionId: string): Promise<void> {
    try {
      // 销毁扩展会话
      await this.destroyExtensionSession(extensionId)

      const extension = this.extensions.get(extensionId)
      if (extension) {
        console.log(`Extension unloaded: ${extension.name}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Failed to unload extension ${extensionId}:`, errorMessage)
    }
  }

  private async destroyExtensionSession(extensionId: string): Promise<void> {
    try {
      // 从隔离管理器销毁会话
      await extensionIsolationManager.destroyExtensionSession(extensionId)

      // 从本地会话映射中移除
      this.extensionSessions.delete(extensionId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Failed to destroy extension session:', errorMessage)
    }
  }

  private generateExtensionId(name: string, version: string): string {
    // 简单的 ID 生成逻辑
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    return `${cleanName}-${version}`
  }

  getLoadedExtensions(): string[] {
    // 返回已加载的扩展 ID 列表
    const extensions = this.getAllExtensions()
    return extensions.filter((ext) => ext.enabled).map((ext) => ext.id)
  }

  // 新增方法：使用隔离加载扩展
  async loadExtensionWithIsolation(
    extensionPath: string,
    isolationLevel?: ExtensionIsolationLevel
  ): Promise<{
    success: boolean
    extension?: { id: string; name: string; version: string; enabled: boolean }
    sessionId?: string
    error?: string
  }> {
    try {
      console.log('[DEBUG] loadExtensionWithIsolation called with path:', extensionPath)
      console.log(
        '[DEBUG] File extension:',
        extensionPath.toLowerCase().endsWith('.zip')
          ? 'ZIP'
          : extensionPath.toLowerCase().endsWith('.crx')
            ? 'CRX'
            : 'Directory'
      )

      // 验证扩展
      const validation = await this.validateExtension(extensionPath)
      console.log('[DEBUG] Validation result:', validation)

      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      const manifest = validation.manifest!
      const extensionId = this.generateExtensionId(manifest.name, manifest.version)

      // 检查是否已存在
      if (this.extensions.has(extensionId)) {
        return { success: false, error: 'Extension already exists' }
      }

      // 处理 ZIP 和 CRX 文件 - 需要先解压
      let actualPath = extensionPath
      if (
        extensionPath.toLowerCase().endsWith('.zip') ||
        extensionPath.toLowerCase().endsWith('.crx')
      ) {
        console.log(
          `[DEBUG] ${extensionPath.toLowerCase().endsWith('.zip') ? 'ZIP' : 'CRX'} file detected, extracting...`
        )

        let zipData: Buffer

        if (extensionPath.toLowerCase().endsWith('.crx')) {
          // 处理 CRX 文件 - 先解析获取 ZIP 数据
          zipData = parseCrxFile(extensionPath)
          console.log('[DEBUG] CRX parsed, ZIP data extracted')
        } else {
          // 处理 ZIP 文件 - 直接读取
          zipData = fsReadFileSync(extensionPath)
        }

        const AdmZip = await getAdmZip()
        const zip = new AdmZip(zipData)

        // 创建解压目录
        const extractDir = join(this.configPath, '..', 'extracted', extensionId)
        console.log('[DEBUG] Extracting to:', extractDir)

        if (existsSync(extractDir)) {
          rmSync(extractDir, { recursive: true, force: true })
        }
        mkdirSync(extractDir, { recursive: true })

        // 解压 ZIP 文件
        zip.extractAllTo(extractDir, true)
        actualPath = extractDir
        console.log('[DEBUG] Extraction complete, actual path:', actualPath)
      }

      const extension: ExtensionInfo = {
        id: extensionId,
        name: manifest.name,
        version: manifest.version,
        path: actualPath,
        enabled: true,
        manifest
      }

      // 创建扩展会话
      const level = isolationLevel || undefined
      const extensionSession = await extensionIsolationManager.createExtensionSession(
        extension,
        level
      )

      // 验证权限
      const riskLevel = this.settings.defaultRiskTolerance
      const permissionValidation = await extensionPermissionManager.validateExtensionPermissions(
        extension,
        riskLevel
      )

      if (!permissionValidation.valid) {
        // 销毁会话
        await extensionIsolationManager.destroyExtensionSession(extensionId)
        throw new Error(
          `Permission validation failed: ${permissionValidation.blockedPermissions.map((p) => p.permission).join(', ')}`
        )
      }

      // 注册扩展
      this.extensions.set(extensionId, extension)
      this.saveConfig()

      // 使用隔离的 session 加载扩展
      console.log('[DEBUG] Loading extension from path:', actualPath)

      // 同时加载扩展到主窗口的 session 中，以便访问扩展页面
      try {
        const { session } = await import('electron')
        if (session.defaultSession.extensions && session.defaultSession.extensions.loadExtension) {
          await session.defaultSession.extensions.loadExtension(actualPath)
          console.log(`[DEBUG] Extension ${extension.name} also loaded in main session`)
        } else {
          await session.defaultSession.loadExtension(actualPath)
          console.log(
            `[DEBUG] Extension ${extension.name} also loaded in main session (legacy API)`
          )
        }
      } catch (mainSessionError) {
        console.warn(
          `[DEBUG] Failed to load extension ${extension.name} in main session:`,
          mainSessionError
        )
        // 不抛出错误，因为隔离 session 加载已经成功
        console.log('[DEBUG] Main session loading failed, but extension still works in isolation')
      }

      if (
        extensionSession.session.extensions &&
        extensionSession.session.extensions.loadExtension
      ) {
        await extensionSession.session.extensions.loadExtension(actualPath)
      } else {
        await extensionSession.session.loadExtension(actualPath)
      }
      console.log('[DEBUG] Extension loaded successfully')

      return {
        success: true,
        extension: {
          id: extension.id,
          name: extension.name,
          version: extension.version,
          enabled: true
        },
        sessionId: extensionSession.id
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to load extension with isolation: ${errorMessage}` }
    }
  }

  // 新增方法：使用隔离卸载扩展
  async unloadExtensionWithIsolation(
    extensionId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const extension = this.extensions.get(extensionId)
      if (!extension) {
        return { success: false, error: 'Extension not found' }
      }

      // 销毁扩展会话
      await this.destroyExtensionSession(extensionId)

      // 注销扩展
      this.extensions.delete(extensionId)
      this.saveConfig()

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to unload extension with isolation: ${errorMessage}` }
    }
  }

  // 新增方法：获取扩展及其权限信息
  async getExtensionWithPermissions(extensionId: string): Promise<{
    success: boolean
    extension?: {
      id: string
      name: string
      version: string
      enabled: boolean
      manifest?: ExtensionManifest
    }
    session?: {
      id: string
      isolationLevel: ExtensionIsolationLevel
      isActive: boolean
      memoryUsage: number
    } | null
    permissions?: { settings: string[]; riskLevel: ExtensionRiskLevel }
    error?: string
  }> {
    try {
      const extension = this.getExtension(extensionId)
      if (!extension) {
        return { success: false, error: 'Extension not found' }
      }

      const isolationSession = extensionIsolationManager.getExtensionSession(extensionId)
      const permissionSettings = extensionPermissionManager.getUserPermissionSettings(extensionId)

      return {
        success: true,
        extension: {
          id: extension.id,
          name: extension.name,
          version: extension.version,
          enabled: extension.enabled,
          manifest: extension.manifest
        },
        session: isolationSession
          ? {
              id: isolationSession.id,
              isolationLevel: isolationSession.isolationLevel,
              isActive: isolationSession.isActive,
              memoryUsage: isolationSession.memoryUsage
            }
          : null,
        permissions: {
          settings: Array.from(permissionSettings),
          riskLevel:
            extensionPermissionManager.getUserPermissionSettings().size > 0
              ? ExtensionRiskLevel.MEDIUM
              : ExtensionRiskLevel.LOW
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to get extension with permissions: ${errorMessage}` }
    }
  }

  // 新增方法：更新权限设置
  async updatePermissionSettings(
    extensionId: string,
    permissions: string[],
    allowed: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      extensionPermissionManager.updateUserPermissionSettings(extensionId, permissions, allowed)
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to update permission settings: ${errorMessage}` }
    }
  }

  /**
   * 注册扩展到管理器
   */
  registerExtension(extension: ExtensionInfo): void {
    this.extensions.set(extension.id, extension)
    this.saveConfig()
  }

  /**
   * 从管理器中注销扩展
   */
  unregisterExtension(extensionId: string): void {
    this.extensions.delete(extensionId)
    this.saveConfig()
  }

  /**
   * 保存扩展配置
   */
  saveExtensionConfig(): void {
    this.saveConfig()
  }

  // 新增方法：获取错误统计
  async getErrorStats(): Promise<{
    success: boolean
    stats?: {
      totalErrors: number
      errorsByType: Record<string, number>
      recentErrors: Array<{ type: string; message: string; timestamp: number }>
    }
    error?: string
  }> {
    try {
      const stats = extensionErrorManager.getErrorStats()
      return { success: true, stats }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to get error stats: ${errorMessage}` }
    }
  }

  // 新增方法：获取权限统计
  async getPermissionStats(): Promise<{
    success: boolean
    stats?: {
      totalExtensions: number
      totalPermissions: number
      permissionsByCategory: Record<string, number>
      permissionsByRisk: Record<string, number>
      userSettingsCount: number
    }
    error?: string
  }> {
    try {
      const rawStats = extensionPermissionManager.getPermissionStats()
      const stats = {
        totalExtensions: this.extensions.size,
        totalPermissions: rawStats.totalPermissions,
        permissionsByCategory: rawStats.permissionsByCategory,
        permissionsByRisk: rawStats.permissionsByRisk,
        userSettingsCount: rawStats.userSettings.size
      }
      return { success: true, stats }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to get permission stats: ${errorMessage}` }
    }
  }

  // 新增方法：清除错误历史
  async clearErrorHistory(): Promise<{ success: boolean; error?: string }> {
    try {
      extensionErrorManager.clearErrorHistory()
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: `Failed to clear error history: ${errorMessage}` }
    }
  }
}
