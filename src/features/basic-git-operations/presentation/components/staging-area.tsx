import { useEffect, useState } from 'react'
import type { FileChange } from '@domain'
import { cn } from '@lib/utils'
import { Check, ChevronDown, ChevronRight, Minus, Plus } from 'lucide-react'
import { FileChangeIcon } from '@/components/FileChangeIcon'
import { FileContextMenu } from '@/components/FileContextMenu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useMultiFileSelection } from '@/features/repository-viewer/presentation/use-multi-file-selection'
import { useStagingViewModel } from '../use-staging-viewmodel'

interface StagingAreaProps {
  worktreePath: string
  staged: FileChange[]
  unstaged: FileChange[]
  untracked: string[]
  onRefresh: () => void
  onFileSelect?: (filePath: string, staged: boolean) => void
  onSelectionChange?: (selectedFiles: Set<string>) => void
}

export function StagingArea({
  worktreePath,
  staged,
  unstaged,
  untracked,
  onRefresh,
  onFileSelect,
  onSelectionChange,
}: StagingAreaProps) {
  const { loading, stageFiles, unstageFiles, stageAll, unstageAll } = useStagingViewModel()
  const [stagedOpen, setStagedOpen] = useState(true)
  const [unstagedOpen, setUnstagedOpen] = useState(true)

  const allUnstaged: FileChange[] = [...unstaged, ...untracked.map((path) => ({ path, status: 'added' as const }))]

  const stagedSelection = useMultiFileSelection(staged.map((f) => f.path))
  const unstagedSelection = useMultiFileSelection(allUnstaged.map((f) => f.path))

  // 選択状態を親に通知（staged + unstaged の選択を統合）
  useEffect(() => {
    if (!onSelectionChange) return
    const combined = new Set<string>([...stagedSelection.selectedFiles, ...unstagedSelection.selectedFiles])
    onSelectionChange(combined)
  }, [stagedSelection.selectedFiles, unstagedSelection.selectedFiles, onSelectionChange])

  const handleStageFile = (filePath: string) => {
    stageFiles(worktreePath, [filePath])
    onRefresh()
  }

  const handleUnstageFile = (filePath: string) => {
    unstageFiles(worktreePath, [filePath])
    onRefresh()
  }

  const handleStageAll = () => {
    stageAll(worktreePath)
    onRefresh()
  }

  const handleUnstageAll = () => {
    unstageAll(worktreePath)
    onRefresh()
  }

  const handleStageSelected = () => {
    const files = Array.from(unstagedSelection.selectedFiles)
    if (files.length === 0) return
    stageFiles(worktreePath, files)
    unstagedSelection.clearSelection()
    onRefresh()
  }

  const handleUnstageSelected = () => {
    const files = Array.from(stagedSelection.selectedFiles)
    if (files.length === 0) return
    unstageFiles(worktreePath, files)
    stagedSelection.clearSelection()
    onRefresh()
  }

  return (
    <div className="flex flex-col gap-1">
      {/* ステージ済みセクション */}
      <div>
        <div className="flex items-center justify-between px-2 py-1">
          <button
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"
            onClick={() => setStagedOpen(!stagedOpen)}
          >
            {stagedOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            ステージ済み ({staged.length})
          </button>
          <div className="flex items-center gap-1">
            {stagedSelection.selectedFiles.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-xs"
                onClick={handleUnstageSelected}
                disabled={loading}
              >
                <Minus className="mr-1 h-3 w-3" />
                選択解除 ({stagedSelection.selectedFiles.size})
              </Button>
            )}
            {staged.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-xs"
                onClick={handleUnstageAll}
                disabled={loading}
              >
                <Minus className="mr-1 h-3 w-3" />
                すべて解除
              </Button>
            )}
          </div>
        </div>
        {stagedOpen && staged.length > 0 && (
          <div className="space-y-0.5">
            {staged.map((file) => {
              const isSelected = stagedSelection.selectedFiles.has(file.path)
              return (
                <FileContextMenu key={file.path} filePath={`${worktreePath}/${file.path}`}>
                  <div
                    className={cn(
                      'group flex items-center gap-1.5 rounded px-2 py-0.5 text-sm hover:bg-accent',
                      isSelected && 'bg-accent/70',
                    )}
                  >
                    <button
                      type="button"
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        stagedSelection.toggleFileSelect(file.path)
                        onFileSelect?.(file.path, true)
                      }}
                      aria-label={isSelected ? '選択解除' : '選択'}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </button>
                    <FileChangeIcon status={file.status} />
                    <button
                      className="flex-1 truncate text-left"
                      onClick={(e) => {
                        if (e.shiftKey) {
                          stagedSelection.handleFileSelect(file.path, e)
                        } else {
                          stagedSelection.toggleFileSelect(file.path)
                          onFileSelect?.(file.path, true)
                        }
                      }}
                    >
                      {file.path}
                    </button>
                    <button
                      className="invisible text-muted-foreground hover:text-foreground group-hover:visible"
                      onClick={() => handleUnstageFile(file.path)}
                      disabled={loading}
                      title="アンステージ"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </FileContextMenu>
              )
            })}
          </div>
        )}
      </div>

      {staged.length > 0 && allUnstaged.length > 0 && <Separator />}

      {/* 未ステージセクション */}
      <div>
        <div className="flex items-center justify-between px-2 py-1">
          <button
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"
            onClick={() => setUnstagedOpen(!unstagedOpen)}
          >
            {unstagedOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            変更 ({allUnstaged.length})
          </button>
          <div className="flex items-center gap-1">
            {unstagedSelection.selectedFiles.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-xs"
                onClick={handleStageSelected}
                disabled={loading}
              >
                <Plus className="mr-1 h-3 w-3" />
                選択ステージ ({unstagedSelection.selectedFiles.size})
              </Button>
            )}
            {allUnstaged.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-xs"
                onClick={handleStageAll}
                disabled={loading}
              >
                <Plus className="mr-1 h-3 w-3" />
                すべてステージ
              </Button>
            )}
          </div>
        </div>
        {unstagedOpen && allUnstaged.length > 0 && (
          <div className="space-y-0.5">
            {allUnstaged.map((file) => {
              const isSelected = unstagedSelection.selectedFiles.has(file.path)
              return (
                <FileContextMenu key={file.path} filePath={`${worktreePath}/${file.path}`}>
                  <div
                    className={cn(
                      'group flex items-center gap-1.5 rounded px-2 py-0.5 text-sm hover:bg-accent',
                      isSelected && 'bg-accent/70',
                    )}
                  >
                    <button
                      type="button"
                      className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        unstagedSelection.toggleFileSelect(file.path)
                        onFileSelect?.(file.path, false)
                      }}
                      aria-label={isSelected ? '選択解除' : '選択'}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                    </button>
                    <FileChangeIcon status={file.status} />
                    <button
                      className="flex-1 truncate text-left"
                      onClick={(e) => {
                        if (e.shiftKey) {
                          unstagedSelection.handleFileSelect(file.path, e)
                        } else {
                          unstagedSelection.toggleFileSelect(file.path)
                          onFileSelect?.(file.path, false)
                        }
                      }}
                    >
                      {file.path}
                    </button>
                    <button
                      className="invisible text-muted-foreground hover:text-foreground group-hover:visible"
                      onClick={() => handleStageFile(file.path)}
                      disabled={loading}
                      title="ステージ"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </FileContextMenu>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
