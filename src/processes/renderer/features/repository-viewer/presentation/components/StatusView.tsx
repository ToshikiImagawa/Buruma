import { useEffect } from 'react'
import type { FileChange } from '@domain'
import { Separator } from '@renderer/components/ui/separator'
import { FileEdit, FilePlus, FileSymlink, FileX } from 'lucide-react'
import { useStatusViewModel } from '../use-status-viewmodel'

interface StatusViewProps {
  worktreePath: string
  onFileSelect: (filePath: string, staged: boolean) => void
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

function FileList({
  files,
  onSelect,
  staged,
}: {
  files: FileChange[]
  onSelect: (path: string, staged: boolean) => void
  staged: boolean
}) {
  return (
    <div className="space-y-0.5">
      {files.map((file) => (
        <button
          key={file.path}
          className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent"
          onClick={() => onSelect(file.path, staged)}
        >
          <FileChangeIcon status={file.status} />
          <span className="truncate">{file.path}</span>
        </button>
      ))}
    </div>
  )
}

export function StatusView({ worktreePath, onFileSelect }: StatusViewProps) {
  const { status, loading, loadStatus } = useStatusViewModel()

  useEffect(() => {
    loadStatus(worktreePath)
  }, [worktreePath, loadStatus])

  if (loading && !status) {
    return <div className="p-4 text-sm text-muted-foreground">読み込み中...</div>
  }

  if (!status) {
    return <div className="p-4 text-sm text-muted-foreground">ステータスを取得できません</div>
  }

  const hasChanges = status.staged.length > 0 || status.unstaged.length > 0 || status.untracked.length > 0

  if (!hasChanges) {
    return <div className="p-4 text-sm text-muted-foreground">変更はありません</div>
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {status.staged.length > 0 && (
        <div>
          <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            ステージ済み ({status.staged.length})
          </h3>
          <FileList files={status.staged} onSelect={onFileSelect} staged={true} />
        </div>
      )}
      {status.staged.length > 0 && (status.unstaged.length > 0 || status.untracked.length > 0) && <Separator />}
      {status.unstaged.length > 0 && (
        <div>
          <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground">
            未ステージ ({status.unstaged.length})
          </h3>
          <FileList files={status.unstaged} onSelect={onFileSelect} staged={false} />
        </div>
      )}
      {status.unstaged.length > 0 && status.untracked.length > 0 && <Separator />}
      {status.untracked.length > 0 && (
        <div>
          <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground">未追跡 ({status.untracked.length})</h3>
          <div className="space-y-0.5">
            {status.untracked.map((path) => (
              <button
                key={path}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent"
                onClick={() => onFileSelect(path, false)}
              >
                <FilePlus className="h-3.5 w-3.5 text-green-500" />
                <span className="truncate">{path}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
