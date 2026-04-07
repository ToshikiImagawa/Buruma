import { useEffect } from 'react'
import { cn } from '@lib/utils'
import { Separator } from '@renderer/components/ui/separator'
import { FileEdit, FilePlus, FileX } from 'lucide-react'
import { useCommitLogViewModel } from '../use-commit-log-viewmodel'
import { useMultiFileSelection } from '../use-multi-file-selection'

interface CommitDetailViewProps {
  worktreePath: string
  commitHash: string
  onFileSelect: (filePath: string) => void
}

export function CommitDetailView({ worktreePath, commitHash, onFileSelect }: CommitDetailViewProps) {
  const { selectedCommit, selectCommit } = useCommitLogViewModel()
  const fileList = selectedCommit?.files.map((f) => f.path) ?? []
  const { selectedFiles, handleFileSelect } = useMultiFileSelection(fileList)

  useEffect(() => {
    selectCommit(worktreePath, commitHash)
  }, [worktreePath, commitHash, selectCommit])

  if (!selectedCommit) {
    return <div className="p-4 text-sm text-muted-foreground">読み込み中...</div>
  }

  const date = new Date(selectedCommit.date)
  const dateStr = date.toLocaleString('ja-JP')

  return (
    <div className="flex flex-col gap-3 p-3">
      <div>
        <p className="text-sm font-medium">{selectedCommit.message}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{selectedCommit.hashShort}</span>
          <span>{selectedCommit.author}</span>
          <span>{dateStr}</span>
        </div>
      </div>
      <Separator />
      <div>
        <h4 className="mb-1 text-xs font-semibold text-muted-foreground">
          変更ファイル ({selectedCommit.files.length})
        </h4>
        <div className="space-y-0.5">
          {selectedCommit.files.map((file) => (
            <button
              key={file.path}
              className={cn(
                'flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent',
                selectedFiles.has(file.path) && 'bg-accent/70',
              )}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                  handleFileSelect(file.path, e)
                } else {
                  onFileSelect(file.path)
                }
              }}
            >
              {file.status === 'added' && <FilePlus className="h-3.5 w-3.5 text-green-500" />}
              {file.status === 'deleted' && <FileX className="h-3.5 w-3.5 text-red-500" />}
              {file.status !== 'added' && file.status !== 'deleted' && (
                <FileEdit className="h-3.5 w-3.5 text-yellow-500" />
              )}
              <span className="truncate">{file.path}</span>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {file.additions > 0 && <span className="text-green-500">+{file.additions}</span>}
                {file.deletions > 0 && <span className="ml-1 text-red-500">-{file.deletions}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
