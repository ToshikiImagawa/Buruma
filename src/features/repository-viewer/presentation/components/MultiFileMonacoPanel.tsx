import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FileContents, FileDiff } from '@domain'
import { DiffEditor } from '@monaco-editor/react'
import { invokeCommand } from '@/shared/lib/invoke/commands'
import {
  ChevronDown,
  ChevronRight,
  FileMinus,
  FilePen,
  FilePlus,
  FileSymlink,
} from 'lucide-react'
import { Virtuoso } from 'react-virtuoso'

interface MultiFileMonacoPanelProps {
  worktreePath: string
  diffs: FileDiff[]
  /** コミットハッシュ (指定時は git_file_contents_commit を使用) */
  commitHash?: string
  /** staged diff を表示するか (commitHash 未指定時に使用) */
  staged?: boolean
}

const statusIcon = {
  added: FilePlus,
  modified: FilePen,
  deleted: FileMinus,
  renamed: FileSymlink,
  copied: FileSymlink,
} as const

function computeStats(diff: FileDiff) {
  let additions = 0
  let deletions = 0
  for (const hunk of diff.hunks) {
    for (const line of hunk.lines) {
      if (line.type === 'add') additions++
      else if (line.type === 'delete') deletions++
    }
  }
  return { additions, deletions }
}

function computeTotalStats(diffs: FileDiff[]) {
  let additions = 0
  let deletions = 0
  for (const diff of diffs) {
    const s = computeStats(diff)
    additions += s.additions
    deletions += s.deletions
  }
  return { additions, deletions }
}

const LINE_HEIGHT = 18
const EDITOR_PADDING = 20

/** 内容の行数からエディタの高さを算出 */
function computeEditorHeight(original: string, modified: string): number {
  const lines = Math.max(original.split('\n').length, modified.split('\n').length)
  return Math.max(lines * LINE_HEIGHT + EDITOR_PADDING, 60)
}

/** 個別ファイルの Monaco DiffEditor セクション */
function MonacoFileSection({
  diff,
  worktreePath,
  commitHash,
  staged,
  collapsed,
  onToggleCollapse,
}: {
  diff: FileDiff
  worktreePath: string
  commitHash?: string
  staged?: boolean
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const [contents, setContents] = useState<FileContents | null>(null)
  const [loading, setLoading] = useState(false)
  const Icon = statusIcon[diff.status] ?? FilePen
  const stats = computeStats(diff)
  const Chevron = collapsed ? ChevronRight : ChevronDown

  useEffect(() => {
    if (collapsed) return
    if (contents) return // 既にロード済み

    let cancelled = false
    setLoading(true)

    const load = async () => {
      if (commitHash) {
        const result = await invokeCommand<FileContents>('git_file_contents_commit', {
          args: { worktreePath, hash: commitHash, filePath: diff.filePath },
        })
        if (!cancelled && result.success) setContents(result.data)
      } else {
        const result = await invokeCommand<FileContents>('git_file_contents', {
          args: { worktreePath, filePath: diff.filePath, staged: staged ?? false },
        })
        if (!cancelled && result.success) setContents(result.data)
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [collapsed, contents, worktreePath, commitHash, staged, diff.filePath])

  return (
    <div className="border-b border-border/50">
      <div
        className="flex cursor-pointer items-center gap-2 bg-muted/30 px-3 py-1.5 hover:bg-muted/50"
        onClick={onToggleCollapse}
      >
        <Chevron className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-mono text-xs">{diff.filePath}</span>
        {stats.additions > 0 && <span className="text-xs font-medium text-green-400">+{stats.additions}</span>}
        {stats.deletions > 0 && <span className="text-xs font-medium text-red-400">-{stats.deletions}</span>}
      </div>
      {!collapsed && (
        <div>
          {loading || !contents ? (
            <div className="flex h-10 items-center justify-center text-xs text-muted-foreground">読み込み中...</div>
          ) : contents.original === contents.modified ? (
            <div className="flex h-10 items-center justify-center text-xs text-muted-foreground">差分がありません</div>
          ) : (
            <DiffEditor
              height={computeEditorHeight(contents.original, contents.modified)}
              original={contents.original}
              modified={contents.modified}
              language={contents.language}
              theme="vs-dark"
              options={{
                readOnly: true,
                renderSideBySide: true,
                useInlineViewWhenSpaceIsLimited: false,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                scrollbar: { vertical: 'hidden', horizontal: 'auto' },
                fontSize: 12,
                lineHeight: 18,
                automaticLayout: true,
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function MultiFileMonacoPanel({
  worktreePath,
  diffs,
  commitHash,
  staged,
}: MultiFileMonacoPanelProps) {
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set())

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
      </div>
      <div className="min-h-0 flex-1">
        <Virtuoso
          totalCount={diffs.length}
          increaseViewportBy={200}
          itemContent={(index) => {
            const diff = diffs[index]
            return (
              <MonacoFileSection
                diff={diff}
                worktreePath={worktreePath}
                commitHash={commitHash}
                staged={staged}
                collapsed={collapsedFiles.has(diff.filePath)}
                onToggleCollapse={() => toggleCollapse(diff.filePath)}
              />
            )
          }}
        />
      </div>
    </div>
  )
}
