import { useState, useEffect } from 'react'
import { Folder } from 'lucide-react'
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
import { WebsiteGroup } from '@/types/website'

interface AddGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddGroup: (group: Omit<WebsiteGroup, 'id' | 'createdAt' | 'updatedAt'>) => void
  groupType?: 'primary' | 'secondary'
}

export function AddGroupDialog({
  open,
  onOpenChange,
  onAddGroup,
  groupType = 'secondary'
}: AddGroupDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | undefined>()

  const resetForm = () => {
    setName('')
    setError(undefined)
  }

  useEffect(() => {
    if (open) {
      setTimeout(resetForm, 0)
    }
  }, [open])

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('分组名称不能为空')
      return
    }

    onAddGroup({
      name: name.trim(),
      category: groupType === 'primary' ? undefined : undefined,
      expanded: true,
      websites: []
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {groupType === 'primary' ? '添加分类' : '添加分组'}
          </DialogTitle>
          <DialogDescription>
            {groupType === 'primary' ? '创建一个新的分类' : '创建一个新的网站分组'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="group-name">
              分组名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-name"
              placeholder={groupType === 'primary' ? '例如：工作' : '例如：AI 工具'}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError(undefined)
              }}
              className={error ? 'border-destructive' : ''}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
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
