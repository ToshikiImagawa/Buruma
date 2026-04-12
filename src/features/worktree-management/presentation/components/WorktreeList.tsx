import { useEffect, useState } from 'react'
import type { BranchList, WorktreeInfo } from '@domain'
import { Plus, RefreshCw } from 'lucide-react'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { Button } from '@/components/ui/button'
import { useWorktreeListViewModel } from '../use-worktree-list-viewmodel'
import { WorktreeCreateDialog } from './WorktreeCreateDialog'
import { WorktreeDeleteDialog } from './WorktreeDeleteDialog'
import { WorktreeListItem } from './WorktreeListItem'

interface WorktreeListProps {
  repoPath: string
  onWorktreeSelected?: () => void
}

export function WorktreeList({ repoPath, onWorktreeSelected }: WorktreeListProps) {
  const {
    worktrees,
    selectedPath,
    selectWorktree,
    createWorktree,
    deleteWorktree,
    refreshWorktrees,
    getBranches,
    suggestPath,
    recoveryRequest,
    dismissRecovery,
  } = useWorktreeListViewModel()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<WorktreeInfo | null>(null)
  const [branchList, setBranchList] = useState<BranchList | null>(null)

  useEffect(() => {
    if (!createDialogOpen || !repoPath) return
    getBranches(repoPath)
      .then(setBranchList)
      .catch(() => setBranchList(null))
  }, [createDialogOpen, repoPath, getBranches])

  const localBranches = branchList?.local ?? []
  const remoteBranches = branchList?.remote ?? []
  const defaultBranch = branchList?.local.find((b) => b.isHead)?.name ?? branchList?.current ?? ''

  const handleSelect = (path: string) => {
    selectWorktree(path)
    onWorktreeSelected?.()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold">ワークツリー</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refreshWorktrees} aria-label="更新">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCreateDialogOpen(true)}
            aria-label="ワークツリーを作成"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {worktrees.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">ワークツリーがありません</p>
        ) : (
          <div className="space-y-0.5">
            {worktrees.map((wt) => (
              <WorktreeListItem
                key={wt.path}
                worktree={wt}
                selected={wt.path === selectedPath}
                onSelect={handleSelect}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <WorktreeCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        repoPath={repoPath}
        localBranches={localBranches}
        remoteBranches={remoteBranches}
        defaultBranch={defaultBranch}
        onSuggestPath={suggestPath}
        onSubmit={(params) => {
          createWorktree(params)
          setCreateDialogOpen(false)
        }}
      />

      {deleteTarget && (
        <WorktreeDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null)
          }}
          worktree={deleteTarget}
          repoPath={repoPath}
          onConfirm={(params) => {
            deleteWorktree(params)
            setDeleteTarget(null)
          }}
        />
      )}

      {recoveryRequest && (
        <ConfirmationDialog
          open
          title={recoveryRequest.title}
          description={recoveryRequest.message}
          confirmLabel={recoveryRequest.confirmLabel}
          onConfirm={() => {
            recoveryRequest.onConfirm()
            dismissRecovery()
          }}
          onCancel={dismissRecovery}
        />
      )}
    </div>
  )
}
