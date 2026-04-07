import { useCallback, useState } from 'react'
import type { DiffHunk, DiffLine, FileDiff } from '@domain'
import type { Highlighter } from 'shiki'
import { CollapsedRegion } from './CollapsedRegion'
import { DiffLineRow } from './DiffLineRow'

interface HunkDiffViewProps {
  diff: FileDiff
  contextLines?: number
  highlighter?: Highlighter | null
  language?: string
}

const DEFAULT_CONTEXT = 3
const COLLAPSE_THRESHOLD_MULTIPLIER = 2
const COLLAPSE_THRESHOLD_OFFSET = 2

interface RenderedRegion {
  type: 'hunk' | 'collapsed'
  key: string
  hunk?: DiffHunk
  collapsedLineCount?: number
  collapsedIndex?: number
}

function buildRegions(diff: FileDiff, contextLines: number, expandedRegions: Set<number>): RenderedRegion[] {
  const threshold = contextLines * COLLAPSE_THRESHOLD_MULTIPLIER + COLLAPSE_THRESHOLD_OFFSET
  const regions: RenderedRegion[] = []

  for (let i = 0; i < diff.hunks.length; i++) {
    const hunk = diff.hunks[i]

    // ハンク間のギャップをチェック
    if (i > 0) {
      const prevHunk = diff.hunks[i - 1]
      const prevEnd = prevHunk.newStart + prevHunk.newLines
      const gap = hunk.newStart - prevEnd

      if (gap > threshold && !expandedRegions.has(i)) {
        regions.push({
          type: 'collapsed',
          key: `collapsed-${i}`,
          collapsedLineCount: gap,
          collapsedIndex: i,
        })
      }
    }

    regions.push({
      type: 'hunk',
      key: `hunk-${i}`,
      hunk,
    })
  }

  return regions
}

function computeLineNumbers(line: DiffLine, hunk: DiffHunk, lineIndex: number) {
  let oldLineNo: number | undefined
  let newLineNo: number | undefined

  let oldOffset = 0
  let newOffset = 0
  for (let j = 0; j < lineIndex; j++) {
    const prev = hunk.lines[j]
    if (prev.type === 'delete') oldOffset++
    else if (prev.type === 'add') newOffset++
    else {
      oldOffset++
      newOffset++
    }
  }

  if (line.type === 'delete') {
    oldLineNo = hunk.oldStart + oldOffset
  } else if (line.type === 'add') {
    newLineNo = hunk.newStart + newOffset
  } else {
    oldLineNo = hunk.oldStart + oldOffset
    newLineNo = hunk.newStart + newOffset
  }

  return { oldLineNo, newLineNo }
}

export function HunkDiffView({ diff, contextLines = DEFAULT_CONTEXT, highlighter, language }: HunkDiffViewProps) {
  const [expandedRegions, setExpandedRegions] = useState<Set<number>>(new Set())

  const handleExpand = useCallback((index: number) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev)
      next.add(index)
      return next
    })
  }, [])

  if (diff.isBinary) {
    return <div className="px-4 py-2 text-xs text-muted-foreground">バイナリファイル</div>
  }

  if (diff.hunks.length === 0) {
    return <div className="px-4 py-2 text-xs text-muted-foreground">変更なし</div>
  }

  const regions = buildRegions(diff, contextLines, expandedRegions)

  return (
    <div className="overflow-x-auto">
      {regions.map((region) => {
        if (region.type === 'collapsed') {
          return (
            <CollapsedRegion
              key={region.key}
              lineCount={region.collapsedLineCount!}
              onExpand={() => handleExpand(region.collapsedIndex!)}
            />
          )
        }

        const hunk = region.hunk!
        return (
          <div key={region.key}>
            <div className="bg-blue-500/10 px-4 py-0.5 font-mono text-xs text-blue-400">{hunk.header}</div>
            {hunk.lines.map((line, lineIdx) => {
              const { oldLineNo, newLineNo } = computeLineNumbers(line, hunk, lineIdx)
              return (
                <DiffLineRow
                  key={`${region.key}-${lineIdx}`}
                  line={line}
                  oldLineNo={oldLineNo}
                  newLineNo={newLineNo}
                  highlighter={highlighter}
                  language={language}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
