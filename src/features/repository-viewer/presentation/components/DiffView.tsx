import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DiffDisplayMode, FileContents, FileDiff, ReviewComment } from '@domain'
import type { editor } from 'monaco-editor'
import { DiffEditor } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { invokeCommand } from '@/shared/lib/invoke/commands'
import { AiDiffPanel } from './AiDiffPanel'

interface DiffViewProps {
  worktreePath: string
  filePath?: string
  staged?: boolean
  commitHash?: string
}

export function DiffView({ worktreePath, filePath, staged = false, commitHash }: DiffViewProps) {
  const [displayMode, setDisplayMode] = useState<DiffDisplayMode>('side-by-side')
  const [contents, setContents] = useState<FileContents | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diffs, setDiffs] = useState<FileDiff[]>([])
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)

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
        const result = await invokeCommand<FileContents>('git_file_contents_commit', {
          args: { worktreePath, hash: commitHash, filePath },
        })
        if (result.success === false) setError(result.error.message)
        else setContents(result.data)
      } else {
        const result = await invokeCommand<FileContents>('git_file_contents', {
          args: { worktreePath, filePath, staged },
        })
        if (result.success === false) setError(result.error.message)
        else setContents(result.data)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [worktreePath, filePath, staged, commitHash])

  const loadDiffs = useCallback(async () => {
    if (!filePath) return
    if (commitHash) {
      const result = await invokeCommand<FileDiff[]>('git_diff_commit', {
        args: { worktreePath, hash: commitHash, filePath },
      })
      if (result.success) setDiffs(result.data)
    } else if (staged) {
      const result = await invokeCommand<FileDiff[]>('git_diff_staged', {
        query: { worktreePath, filePath },
      })
      if (result.success) setDiffs(result.data)
    } else {
      const result = await invokeCommand<FileDiff[]>('git_diff', {
        query: { worktreePath, filePath },
      })
      if (result.success) setDiffs(result.data)
    }
  }, [worktreePath, filePath, staged, commitHash])

  useEffect(() => {
    loadContents()
    loadDiffs()
  }, [loadContents, loadDiffs])

  const diffTarget = useMemo(
    () =>
      commitHash
        ? ({ type: 'commits', from: `${commitHash}^`, to: commitHash } as const)
        : ({ type: 'working', staged } as const),
    [commitHash, staged],
  )

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

  const headerLeft = (
    <>
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
    </>
  )

  return (
    <AiDiffPanel
      worktreePath={worktreePath}
      diffs={diffs}
      diffTarget={diffTarget}
      staged={staged}
      headerLeft={headerLeft}
      onCommentClick={handleCommentClick}
    >
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
    </AiDiffPanel>
  )
}
