import type { Theme } from '../../domain'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useSettingsViewModel } from '../use-settings-viewmodel'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, setTheme } = useSettingsViewModel()

  const handleThemeChange = (value: string) => {
    setTheme(value as Theme)
  }

  const handleGitPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ gitPath: e.target.value || null })
  }

  const handleDefaultWorkDirChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ defaultWorkDir: e.target.value || null })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
          <DialogDescription>アプリケーションの動作をカスタマイズします</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="theme">テーマ</Label>
              <Select value={settings.theme} onValueChange={handleThemeChange}>
                <SelectTrigger id="theme" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">ライト</SelectItem>
                  <SelectItem value="dark">ダーク</SelectItem>
                  <SelectItem value="system">システム連動</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div>
              <Label htmlFor="git-path">Git 実行パス</Label>
              <Input
                id="git-path"
                type="text"
                placeholder="システムデフォルトを使用"
                value={settings.gitPath || ''}
                onChange={handleGitPathChange}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                カスタム Git 実行パスを指定します（空欄でシステムデフォルト）
              </p>
            </div>
            <Separator />
            <div>
              <Label htmlFor="default-work-dir">デフォルト作業ディレクトリ</Label>
              <Input
                id="default-work-dir"
                type="text"
                placeholder="未設定"
                value={settings.defaultWorkDir || ''}
                onChange={handleDefaultWorkDirChange}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">リポジトリ選択時のデフォルトディレクトリを指定します</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
