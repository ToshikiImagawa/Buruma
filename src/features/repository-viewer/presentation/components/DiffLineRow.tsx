import { useMemo } from 'react'
import type { DiffLine } from '@domain'
import type { Highlighter } from 'shiki'
import { cn } from '@lib/utils'
import { highlightLine } from '../use-shiki-highlighter'

interface DiffLineRowProps {
  line: DiffLine
  oldLineNo?: number
  newLineNo?: number
  highlighter?: Highlighter | null
  language?: string
}

const lineStyles = {
  add: 'bg-green-500/15 text-green-300',
  delete: 'bg-red-500/15 text-red-300',
  context: '',
} as const

export function DiffLineRow({ line, oldLineNo, newLineNo, highlighter, language }: DiffLineRowProps) {
  const prefix = line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '

  const highlightedHtml = useMemo(() => {
    if (!highlighter || !language) return null
    return highlightLine(highlighter, line.content, language)
  }, [highlighter, language, line.content])

  return (
    <div className={cn('flex font-mono text-xs leading-5', lineStyles[line.type])}>
      <span className="w-12 shrink-0 select-none px-1 text-right text-muted-foreground/60">{oldLineNo ?? ''}</span>
      <span className="w-12 shrink-0 select-none px-1 text-right text-muted-foreground/60">{newLineNo ?? ''}</span>
      <span className="w-4 shrink-0 select-none text-center text-muted-foreground/60">{prefix}</span>
      {highlightedHtml ? (
        <span
          className="min-w-0 flex-1 whitespace-pre-wrap break-all px-1"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      ) : (
        <span className="min-w-0 flex-1 whitespace-pre-wrap break-all px-1">{line.content}</span>
      )}
    </div>
  )
}
