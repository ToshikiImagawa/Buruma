import { GitBranch, GitCommit, FolderOpen, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { useWorktreeDetailViewModel } from '../use-worktree-detail-viewmodel'

export function WorktreeDetail() {
  const { selectedWorktree } = useWorktreeDetailViewModel()

  if (!selectedWorktree) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">ワークツリーを選択してください</p>
      </div>
    )
  }

  const displayName = selectedWorktree.path.split('/').pop() ?? selectedWorktree.path

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-lg font-semibold">{displayName}</h2>
        <p className="text-sm text-muted-foreground">{selectedWorktree.path}</p>
      </div>

      <Separator />

      <div className="grid gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GitBranch className="h-4 w-4" />
              ブランチ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">
              {selectedWorktree.branch ?? (
                <span className="text-muted-foreground">detached HEAD</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <GitCommit className="h-4 w-4" />
              HEAD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">{selectedWorktree.head}</p>
            <p className="mt-1 text-xs text-muted-foreground">{selectedWorktree.headMessage}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <FolderOpen className="h-4 w-4" />
              ステータス
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {selectedWorktree.isDirty ? (
                <>
                  <Circle className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
                  <span className="text-sm">未コミットの変更あり</span>
                </>
              ) : (
                <>
                  <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                  <span className="text-sm">クリーン</span>
                </>
              )}
            </div>
            {selectedWorktree.isMain && (
              <p className="mt-2 text-xs text-muted-foreground">メインワークツリー</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
