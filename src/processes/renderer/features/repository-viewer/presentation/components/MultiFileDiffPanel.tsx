import { useCallback, useMemo, useState } from 'react'
import type { DiffTarget, FileDiff } from '@domain'
import { formatDiffsAsText } from '@lib/format-diffs-as-text'
import { Button } from '@renderer/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@renderer/components/ui/resizable'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { DiffExplanationView } from '@renderer/features/claude-code-integration/presentation/components/DiffExplanationView'
import { ReviewCommentList } from '@renderer/features/claude-code-integration/presentation/components/ReviewCommentList'
import { useClaudeAuth } from '@renderer/features/claude-code-integration/presentation/use-claude-auth'
import { useClaudeExplainViewModel } from '@renderer/features/claude-code-integration/presentation/use-claude-explain-viewmodel'
import { useClaudeReviewViewModel } from '@renderer/features/claude-code-integration/presentation/use-claude-review-viewmodel'
import { BookOpen, Loader2, Sparkles, X } from 'lucide-react'
import { Virtuoso } from 'react-virtuoso'
import { FileDiffSection } from './FileDiffSection'

type AiPanelMode = 'review' | 'explain'

interface MultiFileDiffPanelProps {
  worktreePath?: string
  diffs: FileDiff[]
  selectedFiles?: Set<string>
  onFileSelect?: (filePath: string, event: React.MouseEvent) => void
  diffTarget?: DiffTarget
}

function computeTotalStats(diffs: FileDiff[]) {
  let additions = 0
  let deletions = 0
  for (const diff of diffs) {
    for (const hunk of diff.hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add') additions++
        else if (line.type === 'delete') deletions++
      }
    }
  }
  return { additions, deletions }
}

export function MultiFileDiffPanel({
  worktreePath,
  diffs,
  selectedFiles,
  onFileSelect,
  diffTarget,
}: MultiFileDiffPanelProps) {
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set())
  const [aiPanelMode, setAiPanelMode] = useState<AiPanelMode | null>(null)

  const { authStatus } = useClaudeAuth()
  const { reviewComments, reviewSummary, isReviewing, requestReview } = useClaudeReviewViewModel()
  const { explanation, isExplaining, requestExplain } = useClaudeExplainViewModel()
  const isAuthenticated = authStatus?.authenticated === true

  const handleReview = useCallback(() => {
    if (!isAuthenticated || !worktreePath || diffs.length === 0) return
    const target = diffTarget ?? { type: 'working' as const, staged: false }
    const diffText = formatDiffsAsText(diffs)
    requestReview(worktreePath, target, diffText)
    setAiPanelMode('review')
  }, [isAuthenticated, worktreePath, diffs, diffTarget, requestReview])

  const handleExplain = useCallback(() => {
    if (!isAuthenticated || !worktreePath || diffs.length === 0) return
    const target = diffTarget ?? { type: 'working' as const, staged: false }
    const diffText = formatDiffsAsText(diffs)
    requestExplain(worktreePath, target, diffText)
    setAiPanelMode('explain')
  }, [isAuthenticated, worktreePath, diffs, diffTarget, requestExplain])

  const toggleCollapse = useCallback((filePath: string) => {
    setCollapsedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(filePath)) {
        next.delete(filePath)
      } else {
        next.add(filePath)
      }
      return next
    })
  }, [])

  const stats = useMemo(() => computeTotalStats(diffs), [diffs])

  if (diffs.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">差分がありません</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
        <span className="flex-1 text-xs text-muted-foreground">
          {diffs.length} ファイル変更
          {stats.additions > 0 && <span className="ml-2 font-medium text-green-400">+{stats.additions}</span>}
          {stats.deletions > 0 && <span className="ml-1 font-medium text-red-400">-{stats.deletions}</span>}
        </span>
        {worktreePath && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={aiPanelMode === 'review' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleReview}
                  disabled={isReviewing || !isAuthenticated || diffs.length === 0}
                >
                  {isReviewing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{!isAuthenticated ? 'Claude Code にログインしてください' : 'AI レビュー（全ファイル）'}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={aiPanelMode === 'explain' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleExplain}
                  disabled={isExplaining || !isAuthenticated || diffs.length === 0}
                >
                  {isExplaining ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <BookOpen className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{!isAuthenticated ? 'Claude Code にログインしてください' : 'AI 解説（全ファイル）'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel id="diff-list" defaultSize={aiPanelMode ? 70 : 100} minSize={20}>
            <Virtuoso
              totalCount={diffs.length}
              increaseViewportBy={200}
              itemContent={(index) => {
                const diff = diffs[index]
                return (
                  <FileDiffSection
                    diff={diff}
                    collapsed={collapsedFiles.has(diff.filePath)}
                    selected={selectedFiles?.has(diff.filePath) ?? false}
                    onToggleCollapse={() => toggleCollapse(diff.filePath)}
                    onSelect={onFileSelect}
                  />
                )
              }}
            />
          </ResizablePanel>
          {aiPanelMode && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel id="ai-panel" defaultSize={30} minSize={10}>
                <div className="flex h-full flex-col border-t">
                  <div className="flex shrink-0 items-center gap-2 px-3 py-1.5">
                    <span className="flex-1 text-xs font-medium">
                      {aiPanelMode === 'review' ? 'AI レビュー' : 'AI 解説'}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAiPanelMode(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
                    {aiPanelMode === 'review' && (
                      <ReviewCommentList comments={reviewComments} summary={reviewSummary} />
                    )}
                    {aiPanelMode === 'explain' && <DiffExplanationView explanation={explanation} />}
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
