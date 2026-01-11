import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/ui/dialog'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Website } from '@/types/website'
import { Favicon } from './Favicon'

interface EditWebsiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  website: Website | null
  onSave: (updatedWebsite: Website) => void
}

export function EditWebsiteDialog({ open, onOpenChange, website, onSave }: EditWebsiteDialogProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [faviconUrl, setFaviconUrl] = useState('')

  useEffect(() => {
    if (website) {
      setName(website.name)
      setUrl(website.url)
      setFaviconUrl(website.favicon || website.url || '')
    } else {
      // 重置表单
      setName('')
      setUrl('')
      setFaviconUrl('')
    }
  }, [website])

  const handleSave = () => {
    if (!website) return

    const updatedWebsite = {
      ...website,
      name,
      url,
      favicon: faviconUrl || undefined
    }

    onSave(updatedWebsite)
    onOpenChange(false)
  }

  const handleRefreshFavicon = async () => {
    if (!url) return

    setIsRefreshing(true)
    try {
      const response = await window.api.getFavicon(url)
      if (response) {
        setFaviconUrl(response)
      } else {
        alert('未能获取到网站图标，请检查网址是否正确')
      }
    } catch (error) {
      console.error('Error refreshing favicon:', error)
      alert('刷新图标时发生错误')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑网站</DialogTitle>
          <DialogDescription>修改网站名称、URL 或刷新网站图标</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">网站名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入网站名称"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">网站地址</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>网站图标</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefreshFavicon}
                disabled={isRefreshing || !url}
                aria-label={
                  isRefreshing ? '正在从网站获取图标' : '点击刷新网站图标，重新从网站地址获取图标'
                }
              >
                {isRefreshing ? '刷新中...' : '刷新图标'}
              </Button>
            </div>

            <div
              className="flex items-center gap-3 p-2 border rounded-md min-h-[40px]"
              role="img"
              aria-label={faviconUrl ? `网站图标，来源：${faviconUrl}` : '暂无网站图标'}
            >
              <Favicon url={faviconUrl} className="h-5 w-5" />
              <span className="text-sm truncate max-w-[200px]">{faviconUrl || '暂无图标'}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} aria-label="取消编辑网站">
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !url.trim()}
            aria-label={!name.trim() || !url.trim() ? '请输入网站名称和地址以保存' : '保存网站更改'}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
