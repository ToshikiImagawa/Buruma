import type { Theme } from '@domain'
import { DEFAULT_COMMIT_MESSAGE_RULES } from '@domain'
import { CheckCircle2, Loader2, LogIn, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useClaudeAuth } from '@/features/claude-code-integration/presentation/use-claude-auth'
import { useSettingsViewModel } from '../use-settings-viewmodel'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, updateSettings, setTheme } = useSettingsViewModel()
  const { authStatus, isAuthChecking, isLoggingIn, login, logout } = useClaudeAuth()

  const handleThemeChange = (value: string) => {
    setTheme(value as Theme)
  }

  const handleGitPathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ gitPath: e.target.value || null })
  }

  const handleDefaultWorkDirChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ defaultWorkDir: e.target.value || null })
  }

  const handleCommitMessageRulesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateSettings({ commitMessageRules: e.target.value || null })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
          <DialogDescription>アプリケーションの動作をカスタマイズします</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-6 px-2 py-4">
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
            <Separator />
            <div>
              <Label htmlFor="commit-message-rules">コミットメッセージルール</Label>
              <Textarea
                id="commit-message-rules"
                placeholder={DEFAULT_COMMIT_MESSAGE_RULES}
                value={settings.commitMessageRules || ''}
                onChange={handleCommitMessageRulesChange}
                rows={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                コミットメッセージ生成時のルールをカスタマイズします（空欄でデフォルトルール使用）
              </p>
            </div>
            <Separator />
            <div>
              <Label>Claude Code 認証</Label>
              <div className="mt-2 flex items-center gap-2">
                {isAuthChecking ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    確認中...
                  </div>
                ) : authStatus?.authenticated ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      認証済み{authStatus.accountEmail && `（${authStatus.accountEmail}）`}
                    </div>
                    <Button size="sm" variant="outline" onClick={logout} className="gap-1.5">
                      <LogOut className="h-3.5 w-3.5" />
                      ログアウト
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={login} disabled={isLoggingIn} className="gap-1.5">
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ログイン中...
                        </>
                      ) : (
                        <>
                          <LogIn className="h-3.5 w-3.5" />
                          ログイン
                        </>
                      )}
                    </Button>
                    {isLoggingIn && (
                      <span className="text-xs text-muted-foreground">ブラウザで認証を完了してください</span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Claude Code CLI の認証状態です。コミットメッセージ生成やセッション機能に必要です
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
