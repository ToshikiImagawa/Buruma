import { useCallback, useState } from 'react'
import type { DiffHunk, FileDiff } from '@domain'
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
// ハンク間のギャップがこの行数を超えたら折りたたむ（= contextLines * 2 + 2、デフォルト 8 行）
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

interface LineNumberEntry {
  oldLineNo: number | undefined
  newLineNo: number | undefined
}

function computeAllLineNumbers(hunk: DiffHunk): LineNumberEntry[] {
  let oldLine = hunk.oldStart
  let newLine = hunk.newStart
  return hunk.lines.map((line) => {
    const entry: LineNumberEntry = {
      oldLineNo: line.type !== 'add' ? oldLine : undefined,
      newLineNo: line.type !== 'delete' ? newLine : undefined,
    }
    if (line.type !== 'add') oldLine++
    if (line.type !== 'delete') newLine++
    return entry
  })
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
        const lineNumbers = computeAllLineNumbers(hunk)
        return (
          <div key={region.key}>
            <div className="bg-blue-500/10 px-4 py-0.5 font-mono text-xs text-blue-400">{hunk.header}</div>
            {hunk.lines.map((line, lineIdx) => (
              <DiffLineRow
                key={`${region.key}-${lineIdx}`}
                line={line}
                oldLineNo={lineNumbers[lineIdx].oldLineNo}
                newLineNo={lineNumbers[lineIdx].newLineNo}
                highlighter={highlighter}
                language={language}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
