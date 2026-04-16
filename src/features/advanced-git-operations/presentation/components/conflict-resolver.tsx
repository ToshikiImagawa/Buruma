import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ConflictFile, ConflictResolveResult, ConflictResolvingProgress, ThreeWayContent } from '@domain'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConflictViewModel } from '../use-conflict-viewmodel'
import { ThreeWayMergeView } from './three-way-merge-view'

interface ConflictResolverProps {
  worktreePath: string
  operationType: 'merge' | 'rebase' | 'cherry-pick'
  onComplete: () => void
  onAbort: () => void
  // AI conflict resolution (optional, injected from claude-code-integration)
  onAIResolve?: (filePath: string, threeWayContent: ThreeWayContent) => void
  onAIResolveAll?: (worktreePath: string, files: Array<{ filePath: string; threeWayContent: ThreeWayContent }>) => void
  isResolvingConflict?: boolean
  conflictResult?: ConflictResolveResult | null
  resolvingProgress?: ConflictResolvingProgress | null
}

export function ConflictResolver({
  worktreePath,
  operationType,
  onComplete,
  onAbort,
  onAIResolve,
  onAIResolveAll,
  isResolvingConflict = false,
  conflictResult,
  resolvingProgress,
}: ConflictResolverProps) {
  const {
    loading,
    conflictFiles,
    threeWayContent,
    conflictList,
    conflictFileContent,
    getConflictFileContent,
    conflictResolve,
    conflictResolveAll,
    conflictMarkResolved,
  } = useConflictViewModel()

  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const aiMergedContent = useMemo(() => {
    if (
      conflictResult &&
      selectedFile &&
      conflictResult.filePath === selectedFile &&
      conflictResult.status === 'resolved'
    ) {
      return conflictResult.mergedContent
    }
    return null
  }, [conflictResult, selectedFile])

  const unresolvedFiles = useMemo(
    () => conflictFiles.filter((f: ConflictFile) => f.status !== 'resolved'),
    [conflictFiles],
  )
  const allResolved = conflictFiles.length > 0 && unresolvedFiles.length === 0
  const isDisabled = loading || isResolvingConflict

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
      conflictList(worktreePath)
    },
    [worktreePath, selectedFile, conflictResolve, conflictMarkResolved, conflictList],
  )

  const handleAIResolve = useCallback(() => {
    if (!selectedFile || !threeWayContent || !onAIResolve) return
    onAIResolve(selectedFile, threeWayContent)
  }, [selectedFile, threeWayContent, onAIResolve])

  const isFetchingRef = useRef(false)
  const handleAIResolveAll = useCallback(async () => {
    if (!onAIResolveAll || unresolvedFiles.length === 0 || isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      const files = await Promise.all(
        unresolvedFiles.map(async (f: ConflictFile) => ({
          filePath: f.filePath,
          threeWayContent: await getConflictFileContent(worktreePath, f.filePath),
        })),
      )
      onAIResolveAll(worktreePath, files)
    } finally {
      isFetchingRef.current = false
    }
  }, [unresolvedFiles, worktreePath, onAIResolveAll, getConflictFileContent])

  const handleAcceptOursAll = useCallback(() => {
    conflictResolveAll({ worktreePath, strategy: 'ours' })
    conflictList(worktreePath)
  }, [worktreePath, conflictResolveAll, conflictList])

  const handleAcceptTheirsAll = useCallback(() => {
    conflictResolveAll({ worktreePath, strategy: 'theirs' })
    conflictList(worktreePath)
  }, [worktreePath, conflictResolveAll, conflictList])

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
                disabled={isDisabled}
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
              disabled={isDisabled}
            >
              Accept Ours (All)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-full text-xs"
              onClick={handleAcceptTheirsAll}
              disabled={isDisabled}
            >
              Accept Theirs (All)
            </Button>
          </div>

          {onAIResolve && (
            <div className="mt-2 flex flex-col gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-full gap-1 text-xs"
                onClick={handleAIResolve}
                disabled={isDisabled || !selectedFile || !threeWayContent}
              >
                {isResolvingConflict && !resolvingProgress ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                AI Resolve
              </Button>
              {onAIResolveAll && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-full gap-1 text-xs"
                  onClick={handleAIResolveAll}
                  disabled={isDisabled || unresolvedFiles.length === 0}
                >
                  {isResolvingConflict && resolvingProgress ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  AI Resolve All
                </Button>
              )}
              {resolvingProgress && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${((resolvingProgress.completed + resolvingProgress.failed) / Math.max(resolvingProgress.total, 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    {resolvingProgress.completed + resolvingProgress.failed}/{resolvingProgress.total}
                    {resolvingProgress.failed > 0 && ` (${resolvingProgress.failed} failed)`}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-2 flex flex-col gap-1">
            <Button size="sm" className="h-7 w-full text-xs" onClick={onComplete} disabled={!allResolved || isDisabled}>
              {loading ? '処理中...' : 'Continue'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 w-full text-xs"
              onClick={onAbort}
              disabled={isDisabled}
            >
              Abort
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 右パネル: 3ウェイマージビュー */}
      <div className="flex-1">
        {selectedFile ? (
          <ThreeWayMergeView
            threeWayContent={threeWayContent}
            onResolve={handleResolve}
            aiMergedContent={aiMergedContent}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            ファイルを選択してコンフリクトを解決してください
          </div>
        )}
      </div>
    </div>
  )
}
