import { useEffect, useRef } from 'react'
import type { ClaudeOutput } from '@domain'
import { cn } from '@lib/utils'

interface ClaudeOutputViewProps {
  outputs: ClaudeOutput[]
  autoScroll?: boolean
}

// ANSI エスケープコードを除去する簡易実装（strip-ansi の代替）
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
}

export function ClaudeOutputView({ outputs, autoScroll = true }: ClaudeOutputViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [outputs, autoScroll])

  if (outputs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">セッションを開始して Claude Code と対話を始めてください</p>
      </div>
    )
  }

  return (
    <div className="p-3 font-mono text-xs">
      {outputs.map((output, i) => (
        <div
          key={`${output.timestamp}-${i}`}
          className={cn('whitespace-pre-wrap', output.stream === 'stderr' && 'text-red-400')}
        >
          {stripAnsi(output.content)}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
