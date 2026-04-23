import { useCallback, useMemo, useState } from 'react'
import type { DiffTarget, FileDiff } from '@domain'
import { Virtuoso } from 'react-virtuoso'
import { AiDiffPanel } from './AiDiffPanel'
import { FileDiffSection } from './FileDiffSection'

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

interface MultiFileDiffPanelProps {
  worktreePath?: string
  diffs: FileDiff[]
  selectedFiles?: Set<string>
  onFileSelect?: (filePath: string, event: React.MouseEvent) => void
  diffTarget?: DiffTarget
}

export function MultiFileDiffPanel({
  worktreePath,
  diffs,
  selectedFiles,
  onFileSelect,
  diffTarget,
}: MultiFileDiffPanelProps) {
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

  const headerLeft = (
    <span className="flex-1 text-xs text-muted-foreground">
      {diffs.length} ファイル変更
      {stats.additions > 0 && <span className="ml-2 font-medium text-green-400">+{stats.additions}</span>}
      {stats.deletions > 0 && <span className="ml-1 font-medium text-red-400">-{stats.deletions}</span>}
    </span>
  )

  return (
    <AiDiffPanel worktreePath={worktreePath ?? ''} diffs={diffs} diffTarget={diffTarget} headerLeft={headerLeft}>
      <Virtuoso
        totalCount={diffs.length}
        increaseViewportBy={200}
        itemContent={(index) => {
          const diff = diffs[index]
          return (
            <FileDiffSection
              worktreePath={worktreePath}
              diff={diff}
              collapsed={collapsedFiles.has(diff.filePath)}
              selected={selectedFiles?.has(diff.filePath) ?? false}
              onToggleCollapse={() => toggleCollapse(diff.filePath)}
              onSelect={onFileSelect}
            />
          )
        }}
      />
    </AiDiffPanel>
  )
}
