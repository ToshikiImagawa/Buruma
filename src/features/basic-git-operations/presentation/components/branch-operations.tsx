import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BranchInfo } from '@domain'
import { ArrowRightLeft, GitBranch, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { MergeDialog } from '@/features/advanced-git-operations/presentation/components/merge-dialog'
import { RebaseEditor } from '@/features/advanced-git-operations/presentation/components/rebase-editor'
import { useBranchOpsViewModel } from '../use-branch-ops-viewmodel'

interface BranchOperationsProps {
  worktreePath: string
  currentBranch: string
  localBranches: BranchInfo[]
  remoteBranches?: BranchInfo[]
  hasDirtyFiles: boolean
  onRefresh: () => void
  onConflict?: (operationType: 'merge' | 'rebase' | 'cherry-pick') => void
  onBranchClick?: (hash: string) => void
  onCreateWorktree?: (branchName: string) => void
}

export function BranchOperations({
  worktreePath,
  currentBranch,
  remoteBranches = [],
  localBranches,
  hasDirtyFiles,
  onRefresh,
  onConflict,
  onBranchClick,
  onCreateWorktree,
}: BranchOperationsProps) {
  const { loading, lastError, createBranch, checkoutBranch, deleteBranch } = useBranchOpsViewModel()
  const [showCreate, setShowCreate] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [startPoint, setStartPoint] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [remoteDeleteTarget, setRemoteDeleteTarget] = useState<string | null>(null)
  const composingRef = useRef(false)
  const [showNotMergedWarning, setShowNotMergedWarning] = useState<string | null>(null)
  const pendingDeleteRef = useRef<string | null>(null)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeTargetBranch, setMergeTargetBranch] = useState<string>('')
  const [rebaseOpen, setRebaseOpen] = useState(false)
  const [rebaseTargetBranch, setRebaseTargetBranch] = useState<string | undefined>(undefined)
  const otherBranchNames = useMemo(
    () => localBranches.map((b) => b.name).filter((n) => n !== currentBranch),
    [localBranches, currentBranch],
  )

  // マージ未済エラー検出時に警告を表示
  useEffect(() => {
    if (lastError?.code === 'BRANCH_NOT_MERGED' && pendingDeleteRef.current) {
      setShowNotMergedWarning(pendingDeleteRef.current)
      pendingDeleteRef.current = null
    }
  }, [lastError])

  const handleCreate = useCallback(() => {
    if (!newBranchName.trim()) return
    createBranch(worktreePath, newBranchName.trim(), startPoint || undefined)
    setNewBranchName('')
    setStartPoint('')
    setShowCreate(false)
    onRefresh()
  }, [worktreePath, newBranchName, startPoint, createBranch, onRefresh])

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
      pendingDeleteRef.current = branch
      deleteBranch(worktreePath, branch, false, force)
      setDeleteTarget(null)
      setShowNotMergedWarning(null)
      onRefresh()
    },
    [worktreePath, deleteBranch, onRefresh],
  )

  const handleRemoteDelete = useCallback(
    (branchName: string) => {
      // リモートブランチ名は "origin/feature-x" 形式。"/" 以降がブランチ名
      const slashIndex = branchName.indexOf('/')
      const branch = slashIndex >= 0 ? branchName.substring(slashIndex + 1) : branchName
      deleteBranch(worktreePath, branch, true)
      setRemoteDeleteTarget(null)
      onRefresh()
    },
    [worktreePath, deleteBranch, onRefresh],
  )

  const handleMergeFromContext = useCallback((branchName: string) => {
    setMergeTargetBranch(branchName)
    setMergeOpen(true)
  }, [])

  const handleRebaseFromContext = useCallback((branchName: string) => {
    setRebaseTargetBranch(branchName)
    setRebaseOpen(true)
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col gap-2 p-2">
        {/* ブランチ操作ヘッダー */}
        <div className="flex items-center">
          <span className="text-xs font-semibold text-muted-foreground">ブランチ</span>
        </div>

        {showCreate && (
          <div className="flex flex-col gap-1">
            <Input
              className="h-7 text-xs"
              placeholder="ブランチ名"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !composingRef.current && handleCreate()}
              onCompositionStart={() => {
                composingRef.current = true
              }}
              onCompositionEnd={() =>
                requestAnimationFrame(() => {
                  composingRef.current = false
                })
              }
              disabled={loading}
            />
            <div className="flex items-center gap-1">
              <Select value={startPoint} onValueChange={setStartPoint}>
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue placeholder="起点（HEAD）" />
                </SelectTrigger>
                <SelectContent>
                  {localBranches.map((b) => (
                    <SelectItem key={b.name} value={b.name} className="text-xs">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleCreate}
                disabled={!newBranchName.trim() || loading}
              >
                作成
              </Button>
            </div>
          </div>
        )}

        {hasDirtyFiles && <p className="text-xs text-yellow-500">未コミットの変更があるためチェックアウトできません</p>}

        {/* マージ未済ブランチの強制削除警告 */}
        {showNotMergedWarning && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-2">
            <p className="text-xs text-destructive">
              ブランチ &apos;{showNotMergedWarning}&apos; はマージされていません。強制削除しますか？
            </p>
            <div className="mt-1 flex items-center gap-1">
              <Button
                variant="destructive"
                size="sm"
                className="h-6 text-xs"
                onClick={() => handleDelete(showNotMergedWarning, true)}
                disabled={loading}
              >
                強制削除
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowNotMergedWarning(null)}>
                キャンセル
              </Button>
            </div>
          </div>
        )}

        {/* ブランチ一覧 */}
        <div className="space-y-0.5">
          {localBranches.map((branch) => (
            <ContextMenu key={branch.name}>
              <ContextMenuTrigger asChild>
                <div className="group flex items-center gap-2 rounded px-2 py-0.5 text-sm hover:bg-accent">
                  <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <button
                    className={`flex-1 truncate text-left ${branch.name === currentBranch ? 'font-medium' : ''}`}
                    onClick={() => {
                      if (onBranchClick) {
                        onBranchClick(branch.hash)
                      } else if (branch.name !== currentBranch && !hasDirtyFiles) {
                        handleCheckout(branch.name)
                      }
                    }}
                    disabled={loading}
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
                        <div className="flex items-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="invisible text-muted-foreground hover:text-primary group-hover:visible"
                                onClick={() => handleCheckout(branch.name)}
                                disabled={loading || hasDirtyFiles}
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>チェックアウト</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="invisible text-muted-foreground hover:text-destructive group-hover:visible"
                                onClick={() => setDeleteTarget(branch.name)}
                                disabled={loading}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>ブランチ削除</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                {branch.name === currentBranch ? (
                  <>
                    <ContextMenuItem onClick={() => setMergeOpen(true)}>マージ</ContextMenuItem>
                    <ContextMenuItem onClick={() => setRebaseOpen(true)}>リベース</ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setShowCreate(true)}>新規ブランチを作成</ContextMenuItem>
                    <ContextMenuItem onClick={() => onCreateWorktree?.(branch.name)} disabled={!onCreateWorktree}>
                      新規ワークツリーで作成
                    </ContextMenuItem>
                  </>
                ) : (
                  <>
                    <ContextMenuItem onClick={() => handleCheckout(branch.name)} disabled={hasDirtyFiles || loading}>
                      チェックアウト
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => handleMergeFromContext(branch.name)}>
                      {branch.name} を現在のブランチにマージ
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleRebaseFromContext(branch.name)}>
                      {branch.name} へリベース
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setShowCreate(true)}>
                      {branch.name} から新規ブランチを作成
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onCreateWorktree?.(branch.name)} disabled={!onCreateWorktree}>
                      {branch.name} から新規ワークツリーを作成
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="text-destructive"
                      onClick={() => setDeleteTarget(branch.name)}
                      disabled={loading}
                    >
                      削除
                    </ContextMenuItem>
                  </>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>

        {/* リモートブランチ一覧 */}
        {remoteBranches.length > 0 && (
          <>
            <Separator />
            <span className="px-2 text-xs font-semibold text-muted-foreground">リモート ({remoteBranches.length})</span>
            <div className="space-y-0.5">
              {remoteBranches.map((branch) => (
                <ContextMenu key={branch.name}>
                  <ContextMenuTrigger asChild>
                    <div className="group flex items-center gap-2 rounded px-2 py-0.5 text-sm hover:bg-accent">
                      <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <button
                        className="flex-1 truncate text-left text-muted-foreground"
                        onClick={() => onBranchClick?.(branch.hash)}
                        disabled={!onBranchClick}
                      >
                        {branch.name}
                      </button>
                      {remoteDeleteTarget === branch.name ? (
                        <div className="flex items-center gap-1">
                          <Label className="text-xs text-destructive">削除？</Label>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-5 px-1 text-xs"
                            onClick={() => handleRemoteDelete(branch.name)}
                            disabled={loading}
                          >
                            確認
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 text-xs"
                            onClick={() => setRemoteDeleteTarget(null)}
                          >
                            取消
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="invisible text-muted-foreground hover:text-primary group-hover:visible"
                                onClick={() => handleCheckout(branch.name)}
                                disabled={loading || hasDirtyFiles}
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>チェックアウト</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="invisible text-muted-foreground hover:text-destructive group-hover:visible"
                                onClick={() => setRemoteDeleteTarget(branch.name)}
                                disabled={loading}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>リモートブランチ削除</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleCheckout(branch.name)} disabled={hasDirtyFiles || loading}>
                      チェックアウト
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => handleMergeFromContext(branch.name)}>
                      {branch.name} を現在のブランチにマージ
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleRebaseFromContext(branch.name)}>
                      {branch.name} へリベース
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => setShowCreate(true)}>
                      {branch.name} から新規ブランチを作成
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onCreateWorktree?.(branch.name)} disabled={!onCreateWorktree}>
                      {branch.name} から新規ワークツリーを作成
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="text-destructive"
                      onClick={() => setRemoteDeleteTarget(branch.name)}
                      disabled={loading}
                    >
                      リモートブランチを削除
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </>
        )}

        <MergeDialog
          worktreePath={worktreePath}
          currentBranch={currentBranch}
          branches={otherBranchNames}
          open={mergeOpen}
          onOpenChange={(open) => {
            setMergeOpen(open)
            if (!open) setMergeTargetBranch('')
          }}
          onConflict={() => {
            setMergeOpen(false)
            setMergeTargetBranch('')
            onConflict?.('merge')
          }}
          defaultTargetBranch={mergeTargetBranch}
        />

        {rebaseOpen && (
          <RebaseEditor
            worktreePath={worktreePath}
            initialOnto={rebaseTargetBranch}
            open={rebaseOpen}
            onOpenChange={(open) => {
              setRebaseOpen(open)
              if (!open) setRebaseTargetBranch(undefined)
            }}
            onConflict={() => {
              setRebaseOpen(false)
              setRebaseTargetBranch(undefined)
              onConflict?.('rebase')
            }}
            onComplete={() => {
              setRebaseOpen(false)
              setRebaseTargetBranch(undefined)
              onRefresh()
            }}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
