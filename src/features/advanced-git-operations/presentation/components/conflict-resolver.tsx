import { useCallback, useEffect, useState } from 'react'
import type { ConflictFile } from '@domain'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConflictViewModel } from '../use-conflict-viewmodel'
import { ThreeWayMergeView } from './three-way-merge-view'

interface ConflictResolverProps {
  worktreePath: string
  operationType: 'merge' | 'rebase' | 'cherry-pick'
  onComplete: () => void
  onAbort: () => void
}

export function ConflictResolver({ worktreePath, operationType, onComplete, onAbort }: ConflictResolverProps) {
  const {
    loading,
    conflictFiles,
    threeWayContent,
    conflictList,
    conflictFileContent,
    conflictResolve,
    conflictResolveAll,
    conflictMarkResolved,
  } = useConflictViewModel()

  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // マウント時にコンフリクトファイル一覧を取得
  useEffect(() => {
    conflictList(worktreePath)
  }, [worktreePath, conflictList])

  const handleFileClick = useCallback(
    (filePath: string) => {
      setSelectedFile(filePath)
      conflictFileContent(worktreePath, filePath)
    },
    [worktreePath, conflictFileContent],
  )

  const handleResolve = useCallback(
    (content: string) => {
      if (!selectedFile) return
      conflictResolve({
        worktreePath,
        filePath: selectedFile,
        resolution: { type: 'manual', content },
      })
      conflictMarkResolved(worktreePath, selectedFile)
      // 一覧を再取得
      conflictList(worktreePath)
    },
    [worktreePath, selectedFile, conflictResolve, conflictMarkResolved, conflictList],
  )

  const handleAcceptOursAll = useCallback(() => {
    conflictResolveAll({ worktreePath, strategy: 'ours' })
    conflictList(worktreePath)
  }, [worktreePath, conflictResolveAll, conflictList])

  const handleAcceptTheirsAll = useCallback(() => {
    conflictResolveAll({ worktreePath, strategy: 'theirs' })
    conflictList(worktreePath)
  }, [worktreePath, conflictResolveAll, conflictList])

  const allResolved = conflictFiles.length > 0 && conflictFiles.every((f: ConflictFile) => f.status === 'resolved')

  const operationLabel =
    operationType === 'merge' ? 'マージ' : operationType === 'rebase' ? 'リベース' : 'チェリーピック'

  return (
    <div className="flex h-full gap-2">
      {/* 左パネル: コンフリクトファイル一覧 */}
      <Card className="w-64 shrink-0">
        <CardHeader className="p-3">
          <CardTitle className="text-sm">{operationLabel}のコンフリクト</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-3 pt-0">
          <div className="space-y-0.5">
            {conflictFiles.map((file: ConflictFile) => (
              <button
                key={file.filePath}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent ${
                  selectedFile === file.filePath ? 'bg-accent' : ''
                }`}
                onClick={() => handleFileClick(file.filePath)}
                disabled={loading}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    file.status === 'resolved' ? 'bg-green-500' : 'bg-destructive'
                  }`}
                />
                <span className="truncate">{file.filePath}</span>
              </button>
            ))}
          </div>

          {conflictFiles.length === 0 && !loading && (
            <p className="text-xs text-muted-foreground">コンフリクトファイルはありません</p>
          )}

          <div className="mt-2 flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-full text-xs"
              onClick={handleAcceptOursAll}
              disabled={loading}
            >
              Accept Ours (All)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-full text-xs"
              onClick={handleAcceptTheirsAll}
              disabled={loading}
            >
              Accept Theirs (All)
            </Button>
          </div>

          <div className="mt-2 flex flex-col gap-1">
            <Button size="sm" className="h-7 w-full text-xs" onClick={onComplete} disabled={!allResolved || loading}>
              {loading ? '処理中...' : 'Continue'}
            </Button>
            <Button variant="destructive" size="sm" className="h-7 w-full text-xs" onClick={onAbort} disabled={loading}>
              Abort
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 右パネル: 3ウェイマージビュー */}
      <div className="flex-1">
        {selectedFile ? (
          <ThreeWayMergeView threeWayContent={threeWayContent} onResolve={handleResolve} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            ファイルを選択してコンフリクトを解決してください
          </div>
        )}
      </div>
    </div>
  )
}
