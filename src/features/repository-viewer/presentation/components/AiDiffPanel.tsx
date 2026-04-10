/**
 * AI レビュー / AI 解説の共通パネル。
 * ヘッダーのボタン群と、下部の結果パネルを提供する。
 * children にメインコンテンツ (diff リスト等) を渡す。
 */

import { useCallback, useState } from 'react'
import type { DiffTarget, FileDiff, ReviewComment } from '@domain'
import type { ReactNode } from 'react'
import { formatDiffsAsText } from '@lib/format-diffs-as-text'
import { BookOpen, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DiffExplanationView } from '@/features/claude-code-integration/presentation/components/DiffExplanationView'
import { ReviewCommentList } from '@/features/claude-code-integration/presentation/components/ReviewCommentList'
import { useClaudeAuth } from '@/features/claude-code-integration/presentation/use-claude-auth'
import { useClaudeExplainViewModel } from '@/features/claude-code-integration/presentation/use-claude-explain-viewmodel'
import { useClaudeReviewViewModel } from '@/features/claude-code-integration/presentation/use-claude-review-viewmodel'

type AiPanelMode = 'review' | 'explain'

interface AiDiffPanelProps {
  worktreePath: string
  diffs: FileDiff[]
  diffTarget?: DiffTarget
  staged?: boolean
  /** ヘッダー左側に表示する追加要素 */
  headerLeft?: ReactNode
  /** メインコンテンツ (diff リスト等) */
  children: ReactNode
  /** レビューコメントクリック時のコールバック */
  onCommentClick?: (comment: ReviewComment) => void
}

export function AiDiffPanel({
  worktreePath,
  diffs,
  diffTarget,
  staged,
  headerLeft,
  children,
  onCommentClick,
}: AiDiffPanelProps) {
  const [aiPanelMode, setAiPanelMode] = useState<AiPanelMode | null>(null)

  const { authStatus } = useClaudeAuth()
  const { reviewComments, reviewSummary, isReviewing, requestReview } = useClaudeReviewViewModel()
  const { explanation, isExplaining, requestExplain } = useClaudeExplainViewModel()
  const isAuthenticated = authStatus?.authenticated === true

  const handleReview = useCallback(() => {
    if (!isAuthenticated || diffs.length === 0) return
    const target = diffTarget ?? { type: 'working' as const, staged: staged ?? false }
    const diffText = formatDiffsAsText(diffs)
    requestReview(worktreePath, target, diffText)
    setAiPanelMode('review')
  }, [isAuthenticated, worktreePath, diffs, diffTarget, staged, requestReview])

  const handleExplain = useCallback(() => {
    if (!isAuthenticated || diffs.length === 0) return
    const target = diffTarget ?? { type: 'working' as const, staged: staged ?? false }
    const diffText = formatDiffsAsText(diffs)
    requestExplain(worktreePath, target, diffText)
    setAiPanelMode('explain')
  }, [isAuthenticated, worktreePath, diffs, diffTarget, staged, requestExplain])

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
        {headerLeft}
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
                {isReviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{!isAuthenticated ? 'Claude Code にログインしてください' : 'AI レビュー'}</p>
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
                {isExplaining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{!isAuthenticated ? 'Claude Code にログインしてください' : 'AI 解説'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="min-h-0 flex-1">
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel id="main-content" defaultSize={aiPanelMode ? 70 : 100} minSize={20}>
            {children}
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
                      <ReviewCommentList
                        comments={reviewComments}
                        summary={reviewSummary}
                        onCommentClick={onCommentClick}
                      />
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
