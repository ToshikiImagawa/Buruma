import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ClaudeOutput } from '@domain'
import { cn } from '@lib/utils'
import Convert from 'ansi-to-html'
import { ArrowDownToLine, Search, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const ansiConverter = new Convert({ escapeXML: true })

interface ClaudeOutputViewProps {
  outputs: ClaudeOutput[]
  onClear?: () => void
}

export function ClaudeOutputView({ outputs, onClear }: ClaudeOutputViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // 自動スクロール
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [outputs, autoScroll])

  // 手動スクロール検出: 末尾から離れたら autoScroll を OFF
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    if (!isAtBottom && autoScroll) {
      setAutoScroll(false)
    }
  }, [autoScroll])

  // Ctrl+F で検索トグル
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 検索マッチ件数
  const matchCount = useMemo(() => {
    if (!searchQuery) return 0
    const query = searchQuery.toLowerCase()
    return outputs.filter((o) => o.content.toLowerCase().includes(query)).length
  }, [outputs, searchQuery])

  // ANSI → HTML 変換 + 検索ハイライト
  const renderContent = useCallback(
    (content: string) => {
      let html = ansiConverter.toHtml(content)
      if (searchQuery) {
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(${escaped})`, 'gi')
        html = html.replace(regex, '<mark class="bg-yellow-300 text-black rounded px-0.5">$1</mark>')
      }
      return html
    },
    [searchQuery],
  )

  if (outputs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">セッションを開始して Claude Code と対話を始めてください</p>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col">
        {/* ヘッダーバー */}
        <div className="flex items-center justify-between border-b px-3 py-1">
          <span className="text-xs text-muted-foreground">{outputs.length} 件の出力</span>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSearchOpen((prev) => !prev)}>
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>検索 (Ctrl+F)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-6 w-6', autoScroll && 'bg-accent')}
                  onClick={() => {
                    setAutoScroll((prev) => !prev)
                    if (!autoScroll) {
                      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{autoScroll ? '自動スクロール: ON' : '自動スクロール: OFF'}</TooltipContent>
            </Tooltip>
            {onClear && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClear}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>出力をクリア</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* 検索バー */}
        {searchOpen && (
          <div className="flex items-center gap-2 border-b px-3 py-1">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <Input
              className="h-7 flex-1 text-xs"
              placeholder="出力を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && <span className="shrink-0 text-xs text-muted-foreground">{matchCount} 件</span>}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                setSearchOpen(false)
                setSearchQuery('')
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* 出力エリア */}
        <div ref={scrollRef} className="flex-1 overflow-auto" onScroll={handleScroll}>
          <div className="p-3 font-mono text-xs">
            {outputs.map((output, i) => (
              <div
                key={`${output.timestamp}-${i}`}
                className={cn('whitespace-pre-wrap', output.stream === 'stderr' && 'text-red-400')}
                dangerouslySetInnerHTML={{ __html: renderContent(output.content) }}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
