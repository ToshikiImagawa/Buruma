import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import type { RebaseAction, RebaseStep } from '@domain'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft } from 'lucide-react'
import { BranchCombobox } from '@/components/branch-combobox'
import { ConfirmationDialog } from '@/components/confirmation-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
      className="flex min-w-0 items-center gap-2 rounded border bg-background px-2 py-1 text-sm"
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
      <span className="min-w-0 flex-1 break-words">{step.message}</span>
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
    clearState,
  } = useRebaseViewModel()

  const [step, setStep] = useState<RebaseEditorStep>(initialOnto ? 'edit-commits' : 'select-onto')
  const [selectedOnto, setSelectedOnto] = useState(initialOnto ?? '')
  // 詳細モード: onto とは別に upstream（再適用するコミット範囲の起点）を指定する。
  // 有効時は `git rebase --onto <onto> <upstream>` となり、分岐元の付け替えが可能。
  const [advancedMode, setAdvancedMode] = useState(false)
  const [selectedUpstream, setSelectedUpstream] = useState('')
  const [editedSteps, setEditedSteps] = useState<RebaseStep[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  // 詳細モード OFF 時は upstream を使わない
  const effectiveUpstream = advancedMode && selectedUpstream ? selectedUpstream : undefined

  // 前回処理済みの rebaseResult を追跡し、同じ結果への二重反応を防ぐ
  const handledResultRef = useRef<typeof rebaseResult>(null)

  useEffect(() => {
    if (!open) return
    // ダイアログ再オープン時に前回のリベース結果が再配信されて誤発火するのを防ぐ
    clearState()
    fetchBranches(worktreePath)
    if (initialOnto) {
      setSelectedOnto(initialOnto)
      setStep('edit-commits')
      getRebaseCommits(worktreePath, initialOnto)
    } else {
      setStep('select-onto')
      setSelectedOnto('')
    }
    setAdvancedMode(false)
    setSelectedUpstream('')
    setEditedSteps([])
    setConfirmOpen(false)
    handledResultRef.current = null
  }, [open, worktreePath, initialOnto, fetchBranches, getRebaseCommits, clearState])

  // onto 変更等で rebaseCommits が更新されたら editedSteps を必ず同期する（空配列への更新も反映）
  useEffect(() => {
    setEditedSteps([...rebaseCommits])
  }, [rebaseCommits])

  // 同期 useEffect が走る前の 1 フレームで空表示にならないよう、
  // editedSteps が空の場合は rebaseCommits にフォールバックする
  const currentSteps = useMemo(
    () => (editedSteps.length > 0 ? editedSteps : rebaseCommits),
    [editedSteps, rebaseCommits],
  )

  const localBranches = useMemo(() => (branches ? branches.local.filter((b) => !b.isHead) : []), [branches])
  const remoteBranches = useMemo(() => (branches ? branches.remote : []), [branches])

  const handleNextStep = useCallback(() => {
    if (!selectedOnto) return
    // 詳細モード有効 かつ upstream 未選択ならブロック（明示的な起点指定が必要）
    if (advancedMode && !selectedUpstream) return
    setStep('edit-commits')
    setEditedSteps([])
    getRebaseCommits(worktreePath, selectedOnto, effectiveUpstream)
  }, [worktreePath, selectedOnto, advancedMode, selectedUpstream, effectiveUpstream, getRebaseCommits])

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

  const handleRequestExecute = useCallback(() => {
    if (!selectedOnto || currentSteps.length === 0) return
    setConfirmOpen(true)
  }, [selectedOnto, currentSteps])

  const handleConfirmExecute = useCallback(() => {
    setConfirmOpen(false)
    rebaseInteractive({ worktreePath, onto: selectedOnto, upstream: effectiveUpstream, steps: currentSteps })
  }, [worktreePath, selectedOnto, effectiveUpstream, currentSteps, rebaseInteractive])

  const hasNonPickAction = useMemo(() => currentSteps.some((s) => s.action !== 'pick'), [currentSteps])

  const handleAbort = useCallback(() => {
    rebaseAbort(worktreePath)
    setEditedSteps([])
    onOpenChange(false)
  }, [worktreePath, rebaseAbort, onOpenChange])

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
      <DialogContent className="w-fit min-w-96 max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {step === 'select-onto'
              ? 'リベース先ブランチを選択'
              : effectiveUpstream
                ? `インタラクティブリベース (onto: ${selectedOnto}, upstream: ${effectiveUpstream})`
                : `インタラクティブリベース (onto: ${selectedOnto})`}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 'select-onto'
              ? 'リベース先のブランチを選択してください'
              : 'コミットの順序やアクションを編集してください'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select-onto' ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">リベース先（onto / newbase）</Label>
              <BranchCombobox
                localBranches={localBranches}
                remoteBranches={remoteBranches}
                value={selectedOnto}
                onValueChange={setSelectedOnto}
                placeholder="リベース先ブランチ..."
              />
            </div>

            <div className="flex items-center justify-between rounded border px-2 py-1.5">
              <div className="flex flex-col">
                <Label className="text-xs">詳細モード（--onto）</Label>
                <span className="text-[11px] text-muted-foreground">
                  起点ブランチ（upstream）を別途指定し、分岐元を付け替える
                </span>
              </div>
              <Switch
                checked={advancedMode}
                onCheckedChange={(v) => {
                  setAdvancedMode(v)
                  if (!v) setSelectedUpstream('')
                }}
              />
            </div>

            {advancedMode && (
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">
                  起点（upstream） — <code>upstream..HEAD</code> のコミットが再適用されます
                </Label>
                <BranchCombobox
                  localBranches={localBranches}
                  remoteBranches={remoteBranches}
                  value={selectedUpstream}
                  onValueChange={setSelectedUpstream}
                  placeholder="起点ブランチ..."
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleNextStep}
                disabled={!selectedOnto || (advancedMode && !selectedUpstream) || loading}
              >
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
                    <div className="max-h-80 space-y-1 overflow-x-hidden overflow-y-auto">
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
                          <div className="min-w-0 flex-1">
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
                  <Button size="sm" className="text-xs" onClick={handleRequestExecute} disabled={loading}>
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
      <ConfirmationDialog
        open={confirmOpen}
        title="リベースを実行しますか？"
        description={`onto: ${selectedOnto}${
          effectiveUpstream ? `  /  upstream: ${effectiveUpstream}` : ''
        }  /  対象 ${currentSteps.length} コミット${
          hasNonPickAction ? '（pick 以外のアクションを含みます）' : ''
        }。\nリベースはコミット履歴を書き換える不可逆操作です。問題が発生した場合は Abort で中断できます。`}
        confirmLabel="リベース実行"
        variant="destructive"
        onConfirm={handleConfirmExecute}
        onCancel={() => setConfirmOpen(false)}
      />
    </Dialog>
  )
}
