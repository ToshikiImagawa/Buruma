import { useCallback, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import type { RebaseAction, RebaseStep } from '@domain'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useRebaseViewModel } from '../use-rebase-viewmodel'

interface RebaseEditorProps {
  worktreePath: string
  currentBranch: string
  branches: string[]
  onConflict?: (files: string[]) => void
}

const REBASE_ACTIONS: RebaseAction[] = ['pick', 'squash', 'fixup', 'edit', 'drop']

function SortableCommitItem({
  step,
  onActionChange,
}: {
  step: RebaseStep
  onActionChange: (action: RebaseAction) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.hash })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded border bg-background px-2 py-1 text-sm"
    >
      {/* ドラッグハンドル */}
      <button
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        &#8942;&#8942;
      </button>

      {/* アクション選択 */}
      <Select value={step.action} onValueChange={(value) => onActionChange(value as RebaseAction)}>
        <SelectTrigger className="h-6 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REBASE_ACTIONS.map((action) => (
            <SelectItem key={action} value={action} className="text-xs">
              {action}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* コミットハッシュ（短縮表示） */}
      <span className="shrink-0 font-mono text-xs text-muted-foreground">{step.hash.substring(0, 7)}</span>

      {/* コミットメッセージ */}
      <span className="flex-1 truncate">{step.message}</span>
    </div>
  )
}

export function RebaseEditor({ worktreePath, currentBranch, branches, onConflict }: RebaseEditorProps) {
  const { loading, rebaseResult, rebaseCommits, rebaseInteractive, rebaseAbort, getRebaseCommits } =
    useRebaseViewModel()

  const [ontoBranch, setOntoBranch] = useState('')
  const [editedSteps, setEditedSteps] = useState<RebaseStep[]>([])
  const [isEditing, setIsEditing] = useState(false)

  const handleLoadCommits = useCallback(() => {
    if (!ontoBranch) return
    getRebaseCommits(worktreePath, ontoBranch)
    setIsEditing(true)
  }, [worktreePath, ontoBranch, getRebaseCommits])

  // rebaseCommits が更新されたら editedSteps にコピー
  const currentSteps = isEditing && editedSteps.length > 0 ? editedSteps : rebaseCommits

  // rebaseCommits が変わったら editedSteps を更新
  if (isEditing && rebaseCommits.length > 0 && editedSteps.length === 0) {
    setEditedSteps([...rebaseCommits])
  }

  const handleActionChange = useCallback(
    (hash: string, action: RebaseAction) => {
      setEditedSteps((prev) => {
        const steps = prev.length > 0 ? prev : [...rebaseCommits]
        return steps.map((s) => (s.hash === hash ? { ...s, action } : s))
      })
    },
    [rebaseCommits],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setEditedSteps((prev) => {
        const steps = prev.length > 0 ? prev : [...rebaseCommits]
        const oldIndex = steps.findIndex((s) => s.hash === active.id)
        const newIndex = steps.findIndex((s) => s.hash === over.id)
        const reordered = arrayMove(steps, oldIndex, newIndex)
        return reordered.map((s, i) => ({ ...s, order: i }))
      })
    },
    [rebaseCommits],
  )

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return
      setEditedSteps((prev) => {
        const steps = prev.length > 0 ? prev : [...rebaseCommits]
        const reordered = arrayMove(steps, index, index - 1)
        return reordered.map((s, i) => ({ ...s, order: i }))
      })
    },
    [rebaseCommits],
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      setEditedSteps((prev) => {
        const steps = prev.length > 0 ? prev : [...rebaseCommits]
        if (index >= steps.length - 1) return steps
        const reordered = arrayMove(steps, index, index + 1)
        return reordered.map((s, i) => ({ ...s, order: i }))
      })
    },
    [rebaseCommits],
  )

  const handleExecute = useCallback(() => {
    if (!ontoBranch || currentSteps.length === 0) return
    rebaseInteractive({ worktreePath, onto: ontoBranch, steps: currentSteps })
  }, [worktreePath, ontoBranch, currentSteps, rebaseInteractive])

  const handleAbort = useCallback(() => {
    rebaseAbort(worktreePath)
    setEditedSteps([])
    setIsEditing(false)
  }, [worktreePath, rebaseAbort])

  // コンフリクト発生時にコールバック
  if (rebaseResult?.status === 'conflict' && rebaseResult.conflictFiles && onConflict) {
    onConflict(rebaseResult.conflictFiles)
  }

  const availableBranches = branches.filter((b) => b !== currentBranch)

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="text-sm">インタラクティブリベース</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-3 pt-0">
        {/* ブランチ選択 + コミット読み込み */}
        <div className="flex items-center gap-2">
          <Select value={ontoBranch} onValueChange={setOntoBranch}>
            <SelectTrigger className="h-8 flex-1 text-sm">
              <SelectValue placeholder="リベース先ブランチ..." />
            </SelectTrigger>
            <SelectContent>
              {availableBranches.map((branch) => (
                <SelectItem key={branch} value={branch} className="text-sm">
                  {branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-xs" onClick={handleLoadCommits} disabled={!ontoBranch || loading}>
            コミット読み込み
          </Button>
        </div>

        {/* コミット一覧（ドラッグ&ドロップ） */}
        {currentSteps.length > 0 && (
          <>
            <Separator />
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={currentSteps.map((s) => s.hash)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {currentSteps.map((step, index) => (
                    <div key={step.hash} className="flex items-center gap-1">
                      <div className="flex flex-col">
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || loading}
                          title="上へ移動"
                        >
                          &#9650;
                        </button>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === currentSteps.length - 1 || loading}
                          title="下へ移動"
                        >
                          &#9660;
                        </button>
                      </div>
                      <div className="flex-1">
                        <SortableCommitItem
                          step={step}
                          onActionChange={(action) => handleActionChange(step.hash, action)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}

        {/* 結果表示 */}
        {rebaseResult && (
          <div
            className={`rounded border p-2 text-sm ${
              rebaseResult.status === 'success'
                ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
                : rebaseResult.status === 'aborted'
                  ? 'border-muted bg-muted/50 text-muted-foreground'
                  : 'border-destructive/50 bg-destructive/10 text-destructive'
            }`}
          >
            {rebaseResult.status === 'success' && <p>リベースが完了しました。</p>}
            {rebaseResult.status === 'aborted' && <p>リベースを中断しました。</p>}
            {rebaseResult.status === 'conflict' && (
              <>
                <p>
                  コンフリクトが発生しました。
                  {rebaseResult.currentStep !== undefined &&
                    rebaseResult.totalSteps !== undefined &&
                    ` (ステップ ${rebaseResult.currentStep}/${rebaseResult.totalSteps})`}
                </p>
                {rebaseResult.conflictFiles && (
                  <ul className="mt-1 list-inside list-disc text-xs">
                    {rebaseResult.conflictFiles.map((file) => (
                      <li key={file}>{file}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        {/* アクションボタン */}
        {currentSteps.length > 0 && (
          <div className="flex items-center justify-end gap-2">
            <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={handleAbort} disabled={loading}>
              Abort
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleExecute} disabled={loading}>
              {loading ? 'リベース中...' : 'Execute Rebase'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
