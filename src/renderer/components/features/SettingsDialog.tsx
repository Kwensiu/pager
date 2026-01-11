import { useState, useEffect } from 'react'
import { Settings, Save, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog'
import { ConfirmDialog } from '@/components/features/ConfirmDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [clearCacheOnExit, setClearCacheOnExit] = useState(false)
  const [saveSession, setSaveSession] = useState(true)
  const [enableJavaScript, setEnableJavaScript] = useState(true)
  const [allowPopups, setAllowPopups] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // 加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setClearCacheOnExit(parsed.clearCacheOnExit || false)
      setSaveSession(parsed.saveSession || true)
      setEnableJavaScript(parsed.enableJavaScript || true)
      setAllowPopups(parsed.allowPopups || true)
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

    // 确保文字可读性
    const updateTextColors = () => {
      const isDarkMode = root.classList.contains('dark')
      const textElements = document.querySelectorAll('.text-muted-foreground')

      textElements.forEach((el) => {
        ;(el as HTMLElement).style.color = isDarkMode ? '#ffffff' : '#000000'
      })
    }

    updateTextColors()
  }, [theme])

  const handleSave = () => {
    // 保存设置到本地存储
    localStorage.setItem(
      'settings',
      JSON.stringify({
        clearCacheOnExit,
        saveSession,
        enableJavaScript,
        allowPopups,
        theme
      })
    )
    onOpenChange(false)
  }

  const handleReset = () => {
    setClearCacheOnExit(false)
    setSaveSession(true)
    setEnableJavaScript(true)
    setAllowPopups(true)
    setTheme('system')
  }

  const handleClearAllData = () => {
    setShowConfirmDialog(true)
  }

  const handleConfirmClearData = () => {
    localStorage.clear()
    location.reload()
    setShowConfirmDialog(false)
  }

  const handleCancelClearData = () => {
    setShowConfirmDialog(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            设置
          </DialogTitle>
          <DialogDescription>配置应用偏好设置</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 外观设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">外观</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>主题模式</Label>
                <p className="text-xs text-muted-foreground">选择应用的主题外观</p>
              </div>
              <Select
                value={theme}
                onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="选择主题" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">明亮</SelectItem>
                  <SelectItem value="dark">暗黑</SelectItem>
                  <SelectItem value="system">跟随系统</SelectItem>
                  <SelectItem value="follow-light-dark">亮暗跟随</SelectItem> // 添加亮暗跟随选项
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 浏览器设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">浏览器</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>启用 JavaScript</Label>
                <p className="text-xs text-muted-foreground">允许网页执行 JavaScript 代码</p>
              </div>
              <Switch checked={enableJavaScript} onCheckedChange={setEnableJavaScript} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>允许弹出窗口</Label>
                <p className="text-xs text-muted-foreground">允许网页打开新窗口</p>
              </div>
              <Switch checked={allowPopups} onCheckedChange={setAllowPopups} />
            </div>
          </div>

          {/* 隐私与数据 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">隐私与数据</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>保存会话数据</Label>
                <p className="text-xs text-muted-foreground">保存登录信息和浏览历史</p>
              </div>
              <Switch checked={saveSession} onCheckedChange={setSaveSession} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>退出时清除缓存</Label>
                <p className="text-xs text-muted-foreground">关闭应用时清除临时文件</p>
              </div>
              <Switch checked={clearCacheOnExit} onCheckedChange={setClearCacheOnExit} />
            </div>
          </div>

          {/* 数据管理 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">数据管理</h3>

            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              重置为默认设置
            </Button>

            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
              onClick={handleClearAllData}
            >
              <Trash2 className="h-4 w-4" />
              清除所有数据
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            保存设置
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="确认清除数据"
        description="确定要清除所有数据吗？这将删除所有保存的网站和分组。此操作不可撤销。"
        onConfirm={handleConfirmClearData}
        onCancel={handleCancelClearData}
      />
    </Dialog>
  )
}
