import { useCallback, useState } from 'react'
import type { BranchInfo } from '@shared/domain'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { GitBranch, Plus, Trash2 } from 'lucide-react'
import { useBranchOpsViewModel } from '../use-branch-ops-viewmodel'

interface BranchOperationsProps {
  worktreePath: string
  currentBranch: string
  localBranches: BranchInfo[]
  hasDirtyFiles: boolean
  onRefresh: () => void
}

export function BranchOperations({
  worktreePath,
  currentBranch,
  localBranches,
  hasDirtyFiles,
  onRefresh,
}: BranchOperationsProps) {
  const { loading, createBranch, checkoutBranch, deleteBranch } = useBranchOpsViewModel()
  const [showCreate, setShowCreate] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const handleCreate = useCallback(() => {
    if (!newBranchName.trim()) return
    createBranch(worktreePath, newBranchName.trim())
    setNewBranchName('')
    setShowCreate(false)
    onRefresh()
  }, [worktreePath, newBranchName, createBranch, onRefresh])

  const handleCheckout = useCallback(
    (branch: string) => {
      if (branch === currentBranch) return
      if (hasDirtyFiles) return
      checkoutBranch(worktreePath, branch)
      onRefresh()
    },
    [worktreePath, currentBranch, hasDirtyFiles, checkoutBranch, onRefresh],
  )

  const handleDelete = useCallback(
    (branch: string, force: boolean) => {
      deleteBranch(worktreePath, branch, false, force)
      setDeleteTarget(null)
      onRefresh()
    },
    [worktreePath, deleteBranch, onRefresh],
  )

  return (
    <div className="flex flex-col gap-2 p-2">
      {/* 新規ブランチ作成 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">ブランチ操作</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1 h-3 w-3" />
          新規
        </Button>
      </div>

      {showCreate && (
        <div className="flex items-center gap-1">
          <Input
            className="h-7 text-xs"
            placeholder="ブランチ名"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            disabled={loading}
          />
          <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={!newBranchName.trim() || loading}>
            作成
          </Button>
        </div>
      )}

      {hasDirtyFiles && <p className="text-xs text-yellow-500">未コミットの変更があるためチェックアウトできません</p>}

      {/* ブランチ一覧 */}
      <div className="space-y-0.5">
        {localBranches.map((branch) => (
          <div key={branch.name} className="group flex items-center gap-2 rounded px-2 py-0.5 text-sm hover:bg-accent">
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <button
              className={`flex-1 truncate text-left ${branch.name === currentBranch ? 'font-medium' : ''} ${
                hasDirtyFiles && branch.name !== currentBranch ? 'opacity-50' : ''
              }`}
              onClick={() => handleCheckout(branch.name)}
              disabled={loading || branch.name === currentBranch || hasDirtyFiles}
            >
              {branch.name}
            </button>
            {branch.name === currentBranch && <span className="text-xs text-muted-foreground">HEAD</span>}
            {branch.name !== currentBranch && (
              <>
                {deleteTarget === branch.name ? (
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-destructive">削除？</Label>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-5 px-1 text-xs"
                      onClick={() => handleDelete(branch.name, false)}
                      disabled={loading}
                    >
                      確認
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs"
                      onClick={() => setDeleteTarget(null)}
                    >
                      取消
                    </Button>
                  </div>
                ) : (
                  <button
                    className="invisible text-muted-foreground hover:text-destructive group-hover:visible"
                    onClick={() => setDeleteTarget(branch.name)}
                    disabled={loading}
                    title="ブランチ削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
