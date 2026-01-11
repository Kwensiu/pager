import { useState } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/ui/dialog'
import { Website } from '@/types/website'

interface AddWebsiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWebsite: (website: Omit<Website, 'id' | 'createdAt' | 'updatedAt'>) => void
  groupId: string
}

export function AddWebsiteDialog({ open, onOpenChange, onAddWebsite }: AddWebsiteDialogProps) {
  const [formData, setFormData] = useState(() => {
    // 初始化表单数据
    return {
      name: '',
      url: '',
      description: '',
      errors: {} as { name?: string; url?: string }
    }
  })

  // 当对话框关闭再打开时，组件会重新挂载，因此状态会自动重置

  const { name, url, description, errors } = formData

  const validate = () => {
    const newErrors: { name?: string; url?: string } = {}

    if (!name.trim()) {
      newErrors.name = '网站名称不能为空'
    }

    if (!url.trim()) {
      newErrors.url = '网站地址不能为空'
    } else if (!isValidUrl(url.trim())) {
      newErrors.url = '请输入有效的网站地址'
    }

    const hasErrors = Object.keys(newErrors).length > 0
    if (hasErrors) {
      setFormData((prev) => ({ ...prev, errors: newErrors }))
    } else {
      setFormData((prev) => ({ ...prev, errors: {} }))
    }

    return !hasErrors
  }

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleSubmit = () => {
    if (validate()) {
      onAddWebsite({
        name: name.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        order: 0
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" key={open.toString()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            添加网站
          </DialogTitle>
          <DialogDescription>添加一个新的网站到当前分组中</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="website-name">
              网站名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="website-name"
              placeholder="例如：ChatGPT"
              value={name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website-url">
              网站地址 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="website-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
              className={errors.url ? 'border-destructive' : ''}
            />
            {errors.url && <p className="text-sm text-destructive">{errors.url}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="website-description">网站描述（可选）</Label>
            <Input
              id="website-description"
              placeholder="简短描述这个网站的用途"
              value={description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>添加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
