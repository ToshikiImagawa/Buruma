import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DiffDisplayMode, DiffTarget, FileContents, FileDiff, ReviewComment } from '@domain'
import type { editor } from 'monaco-editor'
import { formatDiffsAsText } from '@lib/format-diffs-as-text'
import { DiffEditor } from '@monaco-editor/react'
import { Button } from '@renderer/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@renderer/components/ui/tooltip'
import { DiffExplanationView } from '@renderer/features/claude-code-integration/presentation/components/DiffExplanationView'
import { ReviewCommentList } from '@renderer/features/claude-code-integration/presentation/components/ReviewCommentList'
import { useClaudeAuth } from '@renderer/features/claude-code-integration/presentation/use-claude-auth'
import { useClaudeExplainViewModel } from '@renderer/features/claude-code-integration/presentation/use-claude-explain-viewmodel'
import { useClaudeReviewViewModel } from '@renderer/features/claude-code-integration/presentation/use-claude-review-viewmodel'
import { BookOpen, Loader2, Sparkles, X } from 'lucide-react'

interface DiffViewProps {
  worktreePath: string
  filePath?: string
  staged?: boolean
  commitHash?: string
}

type AiPanelMode = 'review' | 'explain'

export function DiffView({ worktreePath, filePath, staged = false, commitHash }: DiffViewProps) {
  const [displayMode, setDisplayMode] = useState<DiffDisplayMode>('side-by-side')
  const [contents, setContents] = useState<FileContents | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)

  const [aiPanelMode, setAiPanelMode] = useState<AiPanelMode | null>(null)

  const { authStatus } = useClaudeAuth()
  const { reviewComments, reviewSummary, isReviewing, requestReview } = useClaudeReviewViewModel()
  const { explanation, isExplaining, requestExplain } = useClaudeExplainViewModel()

  const isAuthenticated = authStatus?.authenticated === true

  // 表示モード切替時にエディタのオプションを直接更新
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        renderSideBySide: displayMode === 'side-by-side',
      })
    }
  }, [displayMode])

  const handleEditorMount = useCallback((diffEditor: editor.IStandaloneDiffEditor) => {
    editorRef.current = diffEditor
  }, [])

  const loadContents = useCallback(async () => {
    if (!filePath) return
    setLoading(true)
    setError(null)
    try {
      if (commitHash) {
        const result = await window.electronAPI.git.fileContentsCommit({
          worktreePath,
          hash: commitHash,
          filePath,
        })
        if (result.success === false) {
          setError(result.error.message)
        } else {
          setContents(result.data)
        }
      } else {
        const result = await window.electronAPI.git.fileContents({
          worktreePath,
          filePath,
          staged,
        })
        if (result.success === false) {
          setError(result.error.message)
        } else {
          setContents(result.data)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [worktreePath, filePath, staged, commitHash])

  useEffect(() => {
    loadContents()
  }, [loadContents])

  // ファイル切替時に AI パネルを閉じる
  useEffect(() => {
    setAiPanelMode(null)
  }, [filePath])

  const fetchDiffText = useCallback(async (): Promise<string | null> => {
    if (!filePath) return null
    let diffs: FileDiff[]
    if (commitHash) {
      const result = await window.electronAPI.git.diffCommit({ worktreePath, hash: commitHash, filePath })
      if (result.success === false) return null
      diffs = result.data
    } else if (staged) {
      const result = await window.electronAPI.git.diffStaged({ worktreePath, filePath })
      if (result.success === false) return null
      diffs = result.data
    } else {
      const result = await window.electronAPI.git.diff({ worktreePath, filePath })
      if (result.success === false) return null
      diffs = result.data
    }
    return formatDiffsAsText(diffs)
  }, [worktreePath, filePath, staged, commitHash])

  const diffTarget: DiffTarget = useMemo(
    () => (commitHash ? { type: 'commits', from: `${commitHash}^`, to: commitHash } : { type: 'working', staged }),
    [commitHash, staged],
  )

  const handleReview = useCallback(async () => {
    if (!isAuthenticated) return
    const diffText = await fetchDiffText()
    if (!diffText) return
    requestReview(worktreePath, diffTarget, diffText)
    setAiPanelMode('review')
  }, [isAuthenticated, fetchDiffText, requestReview, worktreePath, diffTarget])

  const handleExplain = useCallback(async () => {
    if (!isAuthenticated) return
    const diffText = await fetchDiffText()
    if (!diffText) return
    requestExplain(worktreePath, diffTarget, diffText)
    setAiPanelMode('explain')
  }, [isAuthenticated, fetchDiffText, requestExplain, worktreePath, diffTarget])

  const handleCommentClick = useCallback((comment: ReviewComment) => {
    if (editorRef.current) {
      editorRef.current.getModifiedEditor().revealLineInCenter(comment.lineStart)
    }
  }, [])

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">差分を読み込み中...</div>
  }

  if (error) {
    return <div className="p-4 text-sm text-red-500">エラー: {error}</div>
  }

  if (!contents) {
    return <div className="p-4 text-sm text-muted-foreground">ファイルを選択して差分を表示</div>
  }

  if (contents.original === contents.modified) {
    return <div className="p-4 text-sm text-muted-foreground">差分がありません</div>
  }

  const isSideBySide = displayMode === 'side-by-side'
  const aiTooltip = !isAuthenticated ? 'Claude Code にログインしてください' : undefined

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <span className="flex-1 truncate text-xs text-muted-foreground">{filePath}</span>
        <Button
          variant={!isSideBySide ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setDisplayMode('inline')}
        >
          インライン
        </Button>
        <Button
          variant={isSideBySide ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setDisplayMode('side-by-side')}
        >
          サイドバイサイド
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={aiPanelMode === 'review' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={handleReview}
                disabled={!filePath || isReviewing || !isAuthenticated}
              >
                {isReviewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{aiTooltip ?? 'AI レビュー'}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={aiPanelMode === 'explain' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={handleExplain}
                disabled={!filePath || isExplaining || !isAuthenticated}
              >
                {isExplaining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookOpen className="h-3.5 w-3.5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{aiTooltip ?? 'AI 解説'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="min-h-0 flex-1">
        <DiffEditor
          height="100%"
          original={contents.original}
          modified={contents.modified}
          language={contents.language}
          theme="vs-dark"
          onMount={handleEditorMount}
          keepCurrentOriginalModel={true}
          keepCurrentModifiedModel={true}
          options={{
            readOnly: true,
            renderSideBySide: isSideBySide,
            useInlineViewWhenSpaceIsLimited: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            lineHeight: 18,
            automaticLayout: true,
          }}
        />
      </div>
      {aiPanelMode && (
        <div className="shrink-0 border-t">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="flex-1 text-xs font-medium">{aiPanelMode === 'review' ? 'AI レビュー' : 'AI 解説'}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAiPanelMode(null)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="max-h-64 overflow-auto px-3 pb-3">
            {aiPanelMode === 'review' && (
              <ReviewCommentList
                comments={reviewComments}
                summary={reviewSummary}
                onCommentClick={handleCommentClick}
              />
            )}
            {aiPanelMode === 'explain' && <DiffExplanationView explanation={explanation} />}
          </div>
        </div>
      )}
    </div>
  )
}
