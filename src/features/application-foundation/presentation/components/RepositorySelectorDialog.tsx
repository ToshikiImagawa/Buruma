import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FolderOpen } from 'lucide-react'
import { useRepositorySelectorViewModel } from '../use-repository-selector-viewmodel'
import { RecentRepositoriesList } from './RecentRepositoriesList'

interface RepositorySelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RepositorySelectorDialog({
  open,
  onOpenChange,
}: RepositorySelectorDialogProps) {
  const { openWithDialog } = useRepositorySelectorViewModel()

  const handleOpenFolder = () => {
    openWithDialog()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>リポジトリを選択</DialogTitle>
          <DialogDescription>
            Git リポジトリを開いて作業を開始します
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 flex-1 overflow-auto">
          <Button
            onClick={handleOpenFolder}
            className="w-full"
            size="lg"
            variant="default"
          >
            <FolderOpen className="mr-2 h-5 w-5" />
            フォルダを選択
          </Button>
          <div>
            <h3 className="text-sm font-semibold mb-2">最近開いたリポジトリ</h3>
            <RecentRepositoriesList />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
