import { useState } from 'react'
import type { FileChange } from '@shared/domain'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { ChevronDown, ChevronRight, FileEdit, FilePlus, FileSymlink, FileX, Minus, Plus } from 'lucide-react'
import { useStagingViewModel } from '../use-staging-viewmodel'

interface StagingAreaProps {
  worktreePath: string
  staged: FileChange[]
  unstaged: FileChange[]
  untracked: string[]
  onRefresh: () => void
}

function FileChangeIcon({ status }: { status: string }) {
  switch (status) {
    case 'added':
      return <FilePlus className="h-3.5 w-3.5 text-green-500" />
    case 'modified':
      return <FileEdit className="h-3.5 w-3.5 text-yellow-500" />
    case 'deleted':
      return <FileX className="h-3.5 w-3.5 text-red-500" />
    case 'renamed':
      return <FileSymlink className="h-3.5 w-3.5 text-blue-500" />
    default:
      return <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

export function StagingArea({ worktreePath, staged, unstaged, untracked, onRefresh }: StagingAreaProps) {
  const { loading, stageFiles, unstageFiles, stageAll, unstageAll } = useStagingViewModel()
  const [stagedOpen, setStagedOpen] = useState(true)
  const [unstagedOpen, setUnstagedOpen] = useState(true)

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

  const allUnstaged: FileChange[] = [...unstaged, ...untracked.map((path) => ({ path, status: 'added' as const }))]

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
        {stagedOpen && staged.length > 0 && (
          <div className="space-y-0.5">
            {staged.map((file) => (
              <div
                key={file.path}
                className="group flex items-center gap-2 rounded px-2 py-0.5 text-sm hover:bg-accent"
              >
                <FileChangeIcon status={file.status} />
                <span className="flex-1 truncate">{file.path}</span>
                <button
                  className="invisible text-muted-foreground hover:text-foreground group-hover:visible"
                  onClick={() => handleUnstageFile(file.path)}
                  disabled={loading}
                  title="アンステージ"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
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
          {allUnstaged.length > 0 && (
            <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={handleStageAll} disabled={loading}>
              <Plus className="mr-1 h-3 w-3" />
              すべてステージ
            </Button>
          )}
        </div>
        {unstagedOpen && allUnstaged.length > 0 && (
          <div className="space-y-0.5">
            {allUnstaged.map((file) => (
              <div
                key={file.path}
                className="group flex items-center gap-2 rounded px-2 py-0.5 text-sm hover:bg-accent"
              >
                <FileChangeIcon status={file.status} />
                <span className="flex-1 truncate">{file.path}</span>
                <button
                  className="invisible text-muted-foreground hover:text-foreground group-hover:visible"
                  onClick={() => handleStageFile(file.path)}
                  disabled={loading}
                  title="ステージ"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
