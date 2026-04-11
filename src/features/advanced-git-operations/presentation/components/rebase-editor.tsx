import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import type { RebaseAction, RebaseStep } from '@domain'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft } from 'lucide-react'
import { BranchCombobox } from '@/components/branch-combobox'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useRebaseViewModel } from '../use-rebase-viewmodel'

interface RebaseEditorProps {
  worktreePath: string
  initialOnto?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConflict?: (files: string[]) => void
  onComplete?: () => void
}

type RebaseEditorStep = 'select-onto' | 'edit-commits'

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
      <button
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        &#8942;&#8942;
      </button>

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

      <span className="shrink-0 font-mono text-xs text-muted-foreground">{step.hash.substring(0, 7)}</span>
      <span className="flex-1 truncate">{step.message}</span>
    </div>
  )
}

export function RebaseEditor({
  worktreePath,
  initialOnto,
  open,
  onOpenChange,
  onConflict,
  onComplete,
}: RebaseEditorProps) {
  const {
    loading,
    rebaseResult,
    rebaseCommits,
    branches,
    rebaseInteractive,
    rebaseAbort,
    getRebaseCommits,
    fetchBranches,
  } = useRebaseViewModel()

  const [step, setStep] = useState<RebaseEditorStep>(initialOnto ? 'edit-commits' : 'select-onto')
  const [selectedOnto, setSelectedOnto] = useState(initialOnto ?? '')
  const [editedSteps, setEditedSteps] = useState<RebaseStep[]>([])

  // 前回処理済みの rebaseResult を追跡し、同じ結果への二重反応を防ぐ
  const handledResultRef = useRef<typeof rebaseResult>(null)

  useEffect(() => {
    if (!open) return
    fetchBranches(worktreePath)
    if (initialOnto) {
      setSelectedOnto(initialOnto)
      setStep('edit-commits')
      getRebaseCommits(worktreePath, initialOnto)
    } else {
      setStep('select-onto')
      setSelectedOnto('')
    }
    setEditedSteps([])
    handledResultRef.current = null
  }, [open, worktreePath, initialOnto, fetchBranches, getRebaseCommits])

  useEffect(() => {
    if (rebaseCommits.length > 0) {
      setEditedSteps([...rebaseCommits])
    }
  }, [rebaseCommits])

  const currentSteps = useMemo(
    () => (editedSteps.length > 0 ? editedSteps : rebaseCommits),
    [editedSteps, rebaseCommits],
  )

  const localBranches = useMemo(() => (branches ? branches.local.filter((b) => !b.isHead) : []), [branches])
  const remoteBranches = useMemo(() => (branches ? branches.remote : []), [branches])

  const handleNextStep = useCallback(() => {
    if (!selectedOnto) return
    setStep('edit-commits')
    setEditedSteps([])
    getRebaseCommits(worktreePath, selectedOnto)
  }, [worktreePath, selectedOnto, getRebaseCommits])

  const handleBackStep = useCallback(() => {
    setStep('select-onto')
    setEditedSteps([])
  }, [])

  const getStepsOrFallback = useCallback(
    (prev: RebaseStep[]) => (prev.length > 0 ? prev : [...rebaseCommits]),
    [rebaseCommits],
  )

  const handleActionChange = useCallback(
    (hash: string, action: RebaseAction) => {
      setEditedSteps((prev) => getStepsOrFallback(prev).map((s) => (s.hash === hash ? { ...s, action } : s)))
    },
    [getStepsOrFallback],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setEditedSteps((prev) => {
        const steps = getStepsOrFallback(prev)
        const oldIndex = steps.findIndex((s) => s.hash === active.id)
        const newIndex = steps.findIndex((s) => s.hash === over.id)
        const reordered = arrayMove(steps, oldIndex, newIndex)
        return reordered.map((s, i) => ({ ...s, order: i }))
      })
    },
    [getStepsOrFallback],
  )

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index <= 0) return
      setEditedSteps((prev) => {
        const reordered = arrayMove(getStepsOrFallback(prev), index, index - 1)
        return reordered.map((s, i) => ({ ...s, order: i }))
      })
    },
    [getStepsOrFallback],
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      setEditedSteps((prev) => {
        const steps = getStepsOrFallback(prev)
        if (index >= steps.length - 1) return steps
        const reordered = arrayMove(steps, index, index + 1)
        return reordered.map((s, i) => ({ ...s, order: i }))
      })
    },
    [getStepsOrFallback],
  )

  const handleExecute = useCallback(() => {
    if (!selectedOnto || currentSteps.length === 0) return
    rebaseInteractive({ worktreePath, onto: selectedOnto, steps: currentSteps })
  }, [worktreePath, selectedOnto, currentSteps, rebaseInteractive])

  const handleAbort = useCallback(() => {
    rebaseAbort(worktreePath)
    setEditedSteps([])
    onOpenChange(false)
    onComplete?.()
  }, [worktreePath, rebaseAbort, onOpenChange, onComplete])

  const handleClose = useCallback(() => {
    onOpenChange(false)
    setEditedSteps([])
    onComplete?.()
  }, [onOpenChange, onComplete])

  useEffect(() => {
    if (!rebaseResult || rebaseResult === handledResultRef.current) return
    handledResultRef.current = rebaseResult

    if (rebaseResult.status === 'conflict' && rebaseResult.conflictFiles && onConflict) {
      onConflict(rebaseResult.conflictFiles)
      onOpenChange(false)
    }
    if (rebaseResult.status === 'success') {
      handleClose()
    }
  }, [rebaseResult, onConflict, onOpenChange, handleClose])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {step === 'select-onto' ? 'リベース先ブランチを選択' : `インタラクティブリベース (onto: ${selectedOnto})`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 'select-onto'
              ? 'リベース先のブランチを選択してください'
              : 'コミットの順序やアクションを編集してください'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select-onto' ? (
          <div className="flex flex-col gap-4">
            <BranchCombobox
              localBranches={localBranches}
              remoteBranches={remoteBranches}
              value={selectedOnto}
              onValueChange={setSelectedOnto}
              placeholder="リベース先ブランチ..."
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleNextStep} disabled={!selectedOnto || loading}>
                次へ
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {!initialOnto && (
              <Button variant="ghost" size="sm" className="w-fit gap-1 text-xs" onClick={handleBackStep}>
                <ArrowLeft className="h-3.5 w-3.5" />
                ブランチ選択に戻る
              </Button>
            )}

            {currentSteps.length > 0 ? (
              <>
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={currentSteps.map((s) => s.hash)} strategy={verticalListSortingStrategy}>
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {currentSteps.map((s, index) => (
                        <div key={s.hash} className="flex items-center gap-1">
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
                              step={s}
                              onActionChange={(action) => handleActionChange(s.hash, action)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <Separator />

                {rebaseResult && rebaseResult.status !== 'success' && (
                  <div
                    className={`rounded border p-2 text-sm ${
                      rebaseResult.status === 'aborted'
                        ? 'border-muted bg-muted/50 text-muted-foreground'
                        : 'border-destructive/50 bg-destructive/10 text-destructive'
                    }`}
                  >
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

                <div className="flex items-center justify-end gap-2">
                  <Button variant="destructive" size="sm" className="text-xs" onClick={handleAbort} disabled={loading}>
                    Abort
                  </Button>
                  <Button size="sm" className="text-xs" onClick={handleExecute} disabled={loading}>
                    {loading ? 'リベース中...' : 'Execute Rebase'}
                  </Button>
                </div>
              </>
            ) : loading ? (
              <p className="py-4 text-center text-sm text-muted-foreground">コミットを読み込み中...</p>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">コミットがありません</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
