import type { FileDiff } from '@domain'
import { detectLanguageFromPath } from '@lib/detect-language'
import { cn } from '@lib/utils'
import { Check, ChevronDown, ChevronRight, FileMinus, FilePen, FilePlus, FileSymlink } from 'lucide-react'
import { FileContextMenu } from '@/components/FileContextMenu'
import { useShikiHighlighter } from '../use-shiki-highlighter'
import { HunkDiffView } from './HunkDiffView'

interface FileDiffSectionProps {
  worktreePath?: string
  diff: FileDiff
  collapsed: boolean
  selected: boolean
  onToggleCollapse: () => void
  onSelect?: (filePath: string, event: React.MouseEvent) => void
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

export function FileDiffSection({
  worktreePath,
  diff,
  collapsed,
  selected,
  onToggleCollapse,
  onSelect,
}: FileDiffSectionProps) {
  const Icon = statusIcon[diff.status] ?? FilePen
  const stats = computeStats(diff)
  const Chevron = collapsed ? ChevronRight : ChevronDown
  const highlighter = useShikiHighlighter()
  const language = detectLanguageFromPath(diff.filePath)

  const header = (
    <div
      className="flex cursor-pointer items-center gap-2 bg-muted/30 px-3 py-1.5 hover:bg-muted/50"
      onClick={onToggleCollapse}
    >
      <Chevron className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {onSelect && (
        <button
          type="button"
          className={cn(
            'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border',
            selected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
          )}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(diff.filePath, e)
          }}
        >
          {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
        </button>
      )}
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-mono text-xs">{diff.filePath}</span>
      {stats.additions > 0 && <span className="text-xs font-medium text-green-400">+{stats.additions}</span>}
      {stats.deletions > 0 && <span className="text-xs font-medium text-red-400">-{stats.deletions}</span>}
    </div>
  )

  return (
    <div className={cn('border-b border-border/50', selected && 'ring-1 ring-primary/30')}>
      {worktreePath ? (
        <FileContextMenu filePath={`${worktreePath}/${diff.filePath}`}>{header}</FileContextMenu>
      ) : (
        header
      )}
      {!collapsed && <HunkDiffView diff={diff} highlighter={highlighter} language={language} />}
    </div>
  )
}
