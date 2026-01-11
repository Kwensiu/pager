import React, { useState, useEffect } from 'react'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { Button } from '@/ui/button'

export interface SidebarSettingsProps {
  showDebugOptions: boolean
  setShowDebugOptions: (value: boolean) => void
  onClearData: () => void
  onResetToDefaults: () => void
  onClearSoftwareData: () => void
  onClearCache: () => void
}

export default function SidebarSettings({
  showDebugOptions,
  setShowDebugOptions,
  onClearData,
  onResetToDefaults,
  onClearSoftwareData,
  onClearCache
}: SidebarSettingsProps): React.ReactElement {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  // 加载保存的主题设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setTheme(parsed.theme || 'system')
    }
  }, [])

  // 应用主题
  useEffect(() => {
    const root = document.documentElement

    if (theme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', systemPrefersDark)
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }

    // 保存设置到本地存储
    const savedSettings = localStorage.getItem('settings')
    let settings = {}
    if (savedSettings) {
      settings = JSON.parse(savedSettings)
    }
    localStorage.setItem('settings', JSON.stringify({ ...settings, theme }))
  }, [theme])

  return (
    <div className="p-6 h-full overflow-y-auto bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-6 text-foreground">设置</h1>

      <div className="mb-6 p-4 border rounded-lg bg-muted/50 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-foreground">Debug模式</Label>
          </div>
          <Switch checked={showDebugOptions} onCheckedChange={setShowDebugOptions} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4 dark:border-gray-700 bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-2 text-foreground">常规设置</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">启动时自动检查更新</Label>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">最小化到系统托盘</Label>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 dark:border-gray-700 bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-2 text-foreground">界面设置</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-foreground">主题模式</Label>
              </div>
              <Select
                value={theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}
              >
                <SelectTrigger className="w-32 dark:border-gray-600 dark:bg-gray-800 dark:text-foreground">
                  <SelectValue placeholder="选择主题" className="dark:text-foreground" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-600 dark:text-foreground">
                  <SelectItem value="light" className="dark:text-foreground dark:focus:bg-gray-700">
                    明亮
                  </SelectItem>
                  <SelectItem value="dark" className="dark:text-foreground dark:focus:bg-gray-700">
                    暗黑
                  </SelectItem>
                  <SelectItem
                    value="system"
                    className="dark:text-foreground dark:focus:bg-gray-700"
                  >
                    跟随系统
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Debug选项：仅在Debug模式开启时显示 */}
        {showDebugOptions && (
          <div className="border-red-500 border-2 rounded-lg p-4 bg-red-50 dark:bg-red-900/20 dark:border-red-700">
            <h2 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-300">调试选项</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-red-600 dark:text-red-400">注意：这些操作将永久删除您的数据</p>

                <Button variant="destructive" className="w-full" onClick={onClearSoftwareData}>
                  清除所有软件数据
                </Button>

                <Button variant="secondary" className="w-full" onClick={onResetToDefaults}>
                  重置为默认数据
                </Button>

                <Button variant="destructive" className="w-full" onClick={onClearCache}>
                  清除所有缓存
                </Button>

                <Button variant="destructive" className="w-full" onClick={onClearData}>
                  清空所有数据
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="border rounded-lg p-4 dark:border-gray-700 bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-2 text-foreground">关于</h2>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">版本: 1.0.0</p>
            <p className="text-sm text-muted-foreground">Electron: v39.2.7</p>
            <p className="text-sm text-muted-foreground">Chromium: v142.0.7444.235</p>
            <p className="text-sm text-muted-foreground">Node.js: v22.21.1</p>
          </div>
        </div>
      </div>
    </div>
  )
}
