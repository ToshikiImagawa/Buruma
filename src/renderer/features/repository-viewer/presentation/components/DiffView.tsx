import { useCallback, useEffect, useRef, useState } from 'react'
import type { DiffDisplayMode, FileContents } from '@shared/domain'
import type { editor } from 'monaco-editor'
import { DiffEditor } from '@monaco-editor/react'
import { Button } from '@renderer/components/ui/button'

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
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)

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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2 shrink-0">
        <span className="truncate flex-1 text-xs text-muted-foreground">{filePath}</span>
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
      </div>
      <div className="flex-1 min-h-0">
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
    </div>
  )
}
